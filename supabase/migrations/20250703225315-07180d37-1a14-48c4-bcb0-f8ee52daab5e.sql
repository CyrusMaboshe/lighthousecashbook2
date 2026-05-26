
-- First, let's ensure the cashvault tables are properly set up with the right structure
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Only admins can view cashvault balance" ON public.cashvault_balance;
DROP POLICY IF EXISTS "Only admins can update cashvault balance" ON public.cashvault_balance;
DROP POLICY IF EXISTS "Only admins can view cashvault transactions" ON public.cashvault_transactions;
DROP POLICY IF EXISTS "Only admins can insert cashvault transactions" ON public.cashvault_transactions;

-- Ensure proper RLS policies for cashvault_balance
CREATE POLICY "Authenticated users can view cashvault balance" ON public.cashvault_balance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cashvault balance" ON public.cashvault_balance
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cashvault balance" ON public.cashvault_balance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ensure proper RLS policies for cashvault_transactions
CREATE POLICY "Authenticated users can view cashvault transactions" ON public.cashvault_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cashvault transactions" ON public.cashvault_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a function to handle cash out to cashvault
CREATE OR REPLACE FUNCTION public.cash_out_to_cashvault(
  amount_param NUMERIC,
  note_param TEXT DEFAULT NULL,
  user_name TEXT DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_cashvault_balance NUMERIC := 0;
  new_cashvault_balance NUMERIC := 0;
  main_cash_in NUMERIC := 0;
  main_cash_out NUMERIC := 0;
  main_net_balance NUMERIC := 0;
  result JSONB;
BEGIN
  -- Calculate current main system balance
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions;

  main_net_balance := main_cash_in - main_cash_out;

  -- Check if sufficient funds available in main balance
  IF main_net_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient funds in main balance. Available: ZMW ' || main_net_balance::text || ', Requested: ZMW ' || amount_param::text,
      'available_balance', main_net_balance,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Get current cashvault balance or create initial record
  SELECT current_balance INTO current_cashvault_balance
  FROM public.cashvault_balance
  LIMIT 1;

  -- If no balance record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.cashvault_balance (current_balance, updated_by)
    VALUES (0, user_name);
    current_cashvault_balance := 0;
  END IF;

  -- Calculate new cashvault balance
  new_cashvault_balance := current_cashvault_balance + amount_param;

  -- ATOMIC TRANSACTION: Update cashvault balance AND create main system cash-out
  BEGIN
    -- 1. Update cashvault balance
    UPDATE public.cashvault_balance
    SET current_balance = new_cashvault_balance,
        updated_by = user_name,
        last_updated = NOW()
    WHERE id = (SELECT id FROM public.cashvault_balance LIMIT 1);

    -- 2. Create cash-out transaction in main system to deduct the amount
    INSERT INTO public.transactions (
      type,
      amount,
      description,
      username,
      category
    ) VALUES (
      'cash-out',
      amount_param,
      'Transfer to Cashvault: ' || COALESCE(note_param, 'Manual deposit to Cashvault'),
      user_name,
      'Cashvault Transfer'
    );

    -- 3. Record the cashvault transaction
    INSERT INTO public.cashvault_transactions (
      action_type,
      amount,
      note,
      initiating_user
    ) VALUES (
      'deposit',
      amount_param,
      COALESCE(note_param, 'Cash out to Cashvault'),
      user_name
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      result := jsonb_build_object(
        'success', false,
        'message', 'Transaction failed: ' || SQLERRM,
        'error_code', SQLSTATE
      );
      RETURN result;
  END;

  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'message', 'Amount transferred to Cashvault successfully. Main balance deducted.',
    'new_cashvault_balance', new_cashvault_balance,
    'amount', amount_param,
    'main_balance_after', main_net_balance - amount_param
  );

  RETURN result;
END;
$$;

-- Create a function to handle cash out from cashvault
CREATE OR REPLACE FUNCTION public.cash_out_from_cashvault(
  amount_param NUMERIC,
  note_param TEXT DEFAULT NULL,
  user_name TEXT DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_cashvault_balance NUMERIC := 0;
  new_cashvault_balance NUMERIC := 0;
  main_cash_in NUMERIC := 0;
  main_cash_out NUMERIC := 0;
  main_net_balance NUMERIC := 0;
  result JSONB;
BEGIN
  -- Get current cashvault balance
  SELECT current_balance INTO current_cashvault_balance
  FROM public.cashvault_balance
  LIMIT 1;

  -- Check if cashvault balance record exists
  IF NOT FOUND THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Cashvault not initialized',
      'available_balance', 0,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Check if sufficient funds in cashvault
  IF current_cashvault_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient funds in Cashvault. Available: ZMW ' || current_cashvault_balance::text || ', Requested: ZMW ' || amount_param::text,
      'available_balance', current_cashvault_balance,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Calculate new cashvault balance
  new_cashvault_balance := current_cashvault_balance - amount_param;

  -- Calculate current main system balance for reporting
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions;

  main_net_balance := main_cash_in - main_cash_out;

  -- ATOMIC TRANSACTION: Update cashvault balance AND create main system cash-in
  BEGIN
    -- 1. Update cashvault balance
    UPDATE public.cashvault_balance
    SET current_balance = new_cashvault_balance,
        updated_by = user_name,
        last_updated = NOW()
    WHERE id = (SELECT id FROM public.cashvault_balance LIMIT 1);

    -- 2. Create cash-in transaction in main system to add the amount back
    INSERT INTO public.transactions (
      type,
      amount,
      description,
      username,
      category
    ) VALUES (
      'cash-in',
      amount_param,
      'Withdrawal from Cashvault: ' || COALESCE(note_param, 'Manual withdrawal from Cashvault'),
      user_name,
      'Cashvault Transfer'
    );

    -- 3. Record the cashvault transaction
    INSERT INTO public.cashvault_transactions (
      action_type,
      amount,
      note,
      initiating_user
    ) VALUES (
      'withdrawal',
      amount_param,
      COALESCE(note_param, 'Cash out from Cashvault'),
      user_name
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      result := jsonb_build_object(
        'success', false,
        'message', 'Transaction failed: ' || SQLERRM,
        'error_code', SQLSTATE
      );
      RETURN result;
  END;

  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'message', 'Amount withdrawn from Cashvault successfully. Main balance increased.',
    'new_cashvault_balance', new_cashvault_balance,
    'amount', amount_param,
    'main_balance_after', main_net_balance + amount_param
  );

  RETURN result;
END;
$$;

-- Ensure there's an initial balance record
INSERT INTO public.cashvault_balance (current_balance, updated_by)
SELECT 0, 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.cashvault_balance);
