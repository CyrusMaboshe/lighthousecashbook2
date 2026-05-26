-- Create Emergency Fund tables and functions
CREATE TABLE IF NOT EXISTS public.emergency_fund_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    current_balance NUMERIC NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT NOT NULL DEFAULT 'System',
    updated_by_user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.emergency_fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    action_type TEXT NOT NULL CHECK (action_type IN ('deposit', 'withdrawal')),
    amount NUMERIC NOT NULL,
    note TEXT,
    initiating_user TEXT NOT NULL,
    initiating_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for internal tables
ALTER TABLE public.emergency_fund_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_fund_transactions ENABLE ROW LEVEL SECURITY;

-- Policies (More permissive to match the rest of the app's patterns)
DROP POLICY IF EXISTS "Authenticated users can view emergency balance" ON public.emergency_fund_balance;
DROP POLICY IF EXISTS "Users can view emergency balance" ON public.emergency_fund_balance;
CREATE POLICY "Users can view emergency balance" ON public.emergency_fund_balance
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can update emergency balance" ON public.emergency_fund_balance;
DROP POLICY IF EXISTS "Users can update emergency balance" ON public.emergency_fund_balance;
CREATE POLICY "Users can update emergency balance" ON public.emergency_fund_balance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view emergency transactions" ON public.emergency_fund_transactions;
DROP POLICY IF EXISTS "Users can view emergency transactions" ON public.emergency_fund_transactions;
CREATE POLICY "Users can view emergency transactions" ON public.emergency_fund_transactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert emergency transactions" ON public.emergency_fund_transactions;
DROP POLICY IF EXISTS "Users can manage emergency transactions" ON public.emergency_fund_transactions;
CREATE POLICY "Users can manage emergency transactions" ON public.emergency_fund_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Atomic RPC functions with improved robustness
CREATE OR REPLACE FUNCTION public.deposit_to_emergency_fund(
  amount_param NUMERIC,
  note_param TEXT DEFAULT NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  user_username TEXT DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_ef_balance NUMERIC := 0;
  new_ef_balance NUMERIC := 0;
  main_cash_in NUMERIC := 0;
  main_cash_out NUMERIC := 0;
  main_net_balance NUMERIC := 0;
  v_balance_id UUID;
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

  -- Get current emergency fund balance or create initial record (Robust UPSERT style)
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  LIMIT 1;

  IF v_balance_id IS NULL THEN
    INSERT INTO public.emergency_fund_balance (current_balance, updated_by)
    VALUES (0, user_username)
    RETURNING id, current_balance INTO v_balance_id, current_ef_balance;
  END IF;

  -- Calculate new balance
  new_ef_balance := current_ef_balance + amount_param;

  -- ATOMIC TRANSACTION
  BEGIN
    -- 1. Update emergency balance
    UPDATE public.emergency_fund_balance
    SET current_balance = new_ef_balance,
        updated_by = user_username,
        last_updated = NOW()
    WHERE id = v_balance_id;

    -- 2. Create cash-out transaction in main system
    INSERT INTO public.transactions (
      type,
      amount,
      details,
      added_by,
      category_name,
      date,
      time,
      customer_name,
      number_of_pictures,
      whatsapp_number
    ) VALUES (
      'cash-out',
      amount_param,
      'Transfer to Emergency Fund: ' || COALESCE(note_param, 'Manual deposit'),
      user_username,
      'Emergency Fund Transfer',
      transaction_date,
      CURRENT_TIME,
      'Emergency Fund',
      0,
      ''
    );

    -- 3. Record emergency transaction
    INSERT INTO public.emergency_fund_transactions (
      action_type,
      amount,
      note,
      initiating_user,
      date
    ) VALUES (
      'deposit',
      amount_param,
      COALESCE(note_param, 'Deposit from main'),
      user_username,
      transaction_date
    );

  EXCEPTION
    WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false,
        'message', 'Transaction failed: ' || SQLERRM,
        'error_code', SQLSTATE
      );
      RETURN result;
  END;

  result := jsonb_build_object(
    'success', true,
    'message', 'Deposited to Emergency Fund. Main balance deducted.',
    'new_balance', new_ef_balance
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_from_emergency_fund(
  amount_param NUMERIC,
  note_param TEXT DEFAULT NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  user_username TEXT DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_ef_balance NUMERIC := 0;
  new_ef_balance NUMERIC := 0;
  v_balance_id UUID;
  result JSONB;
BEGIN
  -- Get current emergency fund balance
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  LIMIT 1;

  IF v_balance_id IS NULL OR current_ef_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient funds in Emergency Fund',
      'available_balance', COALESCE(current_ef_balance, 0)
    );
    RETURN result;
  END IF;

  new_ef_balance := current_ef_balance - amount_param;

  -- ATOMIC TRANSACTION
  BEGIN
    -- 1. Update emergency balance
    UPDATE public.emergency_fund_balance
    SET current_balance = new_ef_balance,
        updated_by = user_username,
        last_updated = NOW()
    WHERE id = v_balance_id;

    -- 2. Create cash-in transaction in main system
    INSERT INTO public.transactions (
      type,
      amount,
      details,
      added_by,
      category_name,
      date,
      time,
      customer_name,
      number_of_pictures,
      whatsapp_number
    ) VALUES (
      'cash-in',
      amount_param,
      'Withdrawal from Emergency Fund: ' || COALESCE(note_param, 'Manual withdrawal'),
      user_username,
      'Emergency Fund Transfer',
      transaction_date,
      CURRENT_TIME,
      'Emergency Fund',
      0,
      ''
    );

    -- 3. Record emergency transaction
    INSERT INTO public.emergency_fund_transactions (
      action_type,
      amount,
      note,
      initiating_user,
      date
    ) VALUES (
      'withdrawal',
      amount_param,
      COALESCE(note_param, 'Withdrawal to main'),
      user_username,
      transaction_date
    );

  EXCEPTION
    WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false,
        'message', 'Transaction failed: ' || SQLERRM,
        'error_code', SQLSTATE
      );
      RETURN result;
  END;

  result := jsonb_build_object(
    'success', true,
    'message', 'Withdrawn from Emergency Fund. Main balance increased.',
    'new_balance', new_ef_balance
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.withdraw_cash_from_emergency_fund(
  amount_param NUMERIC,
  note_param TEXT DEFAULT NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  user_username TEXT DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_ef_balance NUMERIC := 0;
  new_ef_balance NUMERIC := 0;
  v_balance_id UUID;
  result JSONB;
BEGIN
  -- Get current emergency fund balance
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  LIMIT 1;

  IF v_balance_id IS NULL OR current_ef_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient funds in Emergency Fund',
      'available_balance', COALESCE(current_ef_balance, 0)
    );
    RETURN result;
  END IF;

  new_ef_balance := current_ef_balance - amount_param;

  -- ATOMIC TRANSACTION
  BEGIN
    -- 1. Update emergency balance
    UPDATE public.emergency_fund_balance
    SET current_balance = new_ef_balance,
        updated_by = user_username,
        last_updated = NOW()
    WHERE id = v_balance_id;

    -- 2. Record the emergency fund transaction (cash usage - expense)
    INSERT INTO public.emergency_fund_transactions (
      action_type,
      amount,
      note,
      initiating_user,
      date
    ) VALUES (
      'withdrawal',
      amount_param,
      COALESCE(note_param, 'Direct cash withdrawal from Emergency Fund'),
      user_username,
      transaction_date
    );

  EXCEPTION
    WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false,
        'message', 'Transaction failed: ' || SQLERRM,
        'error_code', SQLSTATE
      );
      RETURN result;
  END;

  result := jsonb_build_object(
    'success', true,
    'message', 'Direct withdrawal from Emergency Fund successful. Treated as expense.',
    'new_balance', new_ef_balance
  );
  RETURN result;
END;
$$;

-- Ensure there's an initial balance record
INSERT INTO public.emergency_fund_balance (current_balance, updated_by)
SELECT 0, 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.emergency_fund_balance);

-- Explicitly grant permissions to common roles to ensure visibility
GRANT ALL ON public.emergency_fund_balance TO anon, authenticated, service_role;
GRANT ALL ON public.emergency_fund_transactions TO anon, authenticated, service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.deposit_to_emergency_fund(NUMERIC, TEXT, DATE, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.withdraw_from_emergency_fund(NUMERIC, TEXT, DATE, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.withdraw_cash_from_emergency_fund(NUMERIC, TEXT, DATE, TEXT) TO anon, authenticated, service_role;

-- Enable Realtime
ALTER TABLE public.emergency_fund_balance REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_fund_transactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already present
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_fund_balance;
  EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Table emergency_fund_balance already in publication or publication missing';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_fund_transactions;
  EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Table emergency_fund_transactions already in publication or publication missing';
  END;
END $$;
