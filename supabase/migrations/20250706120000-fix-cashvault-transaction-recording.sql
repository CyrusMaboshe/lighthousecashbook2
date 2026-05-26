-- Fix Cash Vault Transaction Recording Issue
-- This migration fixes the critical issue where Cash Vault transactions weren't being properly
-- recorded with the correct user_id, causing them to not appear in the frontend due to RLS policies.

-- First, let's ensure the RLS policies are correct for cashvault_transactions
DROP POLICY IF EXISTS "Only admins can view cashvault transactions" ON public.cashvault_transactions;
DROP POLICY IF EXISTS "Only admins can insert cashvault transactions" ON public.cashvault_transactions;
DROP POLICY IF EXISTS "Authenticated users can view cashvault transactions" ON public.cashvault_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert cashvault transactions" ON public.cashvault_transactions;

-- Create proper RLS policies that allow admin users to view and insert cashvault transactions
CREATE POLICY "Admins can view cashvault transactions" ON public.cashvault_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert cashvault transactions" ON public.cashvault_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Also ensure the balance policies are correct
DROP POLICY IF EXISTS "Only admins can view cashvault balance" ON public.cashvault_balance;
DROP POLICY IF EXISTS "Only admins can update cashvault balance" ON public.cashvault_balance;
DROP POLICY IF EXISTS "Authenticated users can view cashvault balance" ON public.cashvault_balance;
DROP POLICY IF EXISTS "Authenticated users can update cashvault balance" ON public.cashvault_balance;
DROP POLICY IF EXISTS "Authenticated users can insert cashvault balance" ON public.cashvault_balance;

CREATE POLICY "Admins can view cashvault balance" ON public.cashvault_balance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update cashvault balance" ON public.cashvault_balance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert cashvault balance" ON public.cashvault_balance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Now recreate the cash_out_to_cashvault function with proper user_id handling
DROP FUNCTION IF EXISTS public.cash_out_to_cashvault(NUMERIC, TEXT, TEXT);

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
  user_id_param UUID;
  result JSONB;
BEGIN
  -- Get the user ID for the given username
  SELECT id INTO user_id_param
  FROM public.users
  WHERE username = user_name
  LIMIT 1;

  -- Calculate current main system balance
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions;

  main_net_balance := main_cash_in - main_cash_out;

  -- Check if there's enough balance in main account
  IF main_net_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in main account',
      'available_balance', main_net_balance,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

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
  
  -- Calculate new cashvault balance
  new_cashvault_balance := current_cashvault_balance + amount_param;
  
  -- ATOMIC TRANSACTION: Update cashvault balance AND create main system cash-out
  BEGIN
    -- 1. Update cashvault balance
    UPDATE public.cashvault_balance 
    SET current_balance = new_cashvault_balance,
        updated_by = user_name,
        updated_by_user_id = user_id_param,
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
      'Transfer to Cash Vault: ' || COALESCE(note_param, 'Manual deposit to Cash Vault'),
      user_name,
      'Cash Vault Transfer'
    );
    
    -- 3. Record the cashvault transaction with proper user_id
    INSERT INTO public.cashvault_transactions (
      action_type,
      amount,
      note,
      initiating_user,
      initiating_user_id
    ) VALUES (
      'deposit',
      amount_param,
      COALESCE(note_param, 'Cash out to Cash Vault'),
      user_name,
      user_id_param
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
    'message', 'Amount transferred to Cash Vault successfully. Main balance deducted.',
    'new_cashvault_balance', new_cashvault_balance,
    'amount', amount_param,
    'main_balance_after', main_net_balance - amount_param
  );
  
  RETURN result;
END;
$$;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.cash_out_to_cashvault IS 'Fixed function that properly transfers money from main balance to Cash Vault with atomic transactions and correct user_id recording';

-- Recreate the cash_out_from_cashvault function with proper user_id handling
DROP FUNCTION IF EXISTS public.cash_out_from_cashvault(NUMERIC, TEXT, TEXT);

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
  user_id_param UUID;
  result JSONB;
BEGIN
  -- Get the user ID for the given username
  SELECT id INTO user_id_param
  FROM public.users
  WHERE username = user_name
  LIMIT 1;

  -- Calculate current main system balance
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions;

  main_net_balance := main_cash_in - main_cash_out;

  -- Get current cashvault balance
  SELECT current_balance INTO current_cashvault_balance
  FROM public.cashvault_balance
  LIMIT 1;

  -- Check if cashvault balance record exists
  IF NOT FOUND THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Cash Vault not initialized',
      'available_balance', 0,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Check if there's enough balance in cashvault
  IF current_cashvault_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in Cash Vault',
      'available_balance', current_cashvault_balance,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Calculate new cashvault balance
  new_cashvault_balance := current_cashvault_balance - amount_param;

  -- ATOMIC TRANSACTION: Update cashvault balance AND create main system cash-in
  BEGIN
    -- 1. Update cashvault balance
    UPDATE public.cashvault_balance
    SET current_balance = new_cashvault_balance,
        updated_by = user_name,
        updated_by_user_id = user_id_param,
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
      'Withdrawal from Cash Vault: ' || COALESCE(note_param, 'Manual withdrawal from Cash Vault'),
      user_name,
      'Cash Vault Transfer'
    );

    -- 3. Record the cashvault transaction with proper user_id
    INSERT INTO public.cashvault_transactions (
      action_type,
      amount,
      note,
      initiating_user,
      initiating_user_id
    ) VALUES (
      'withdrawal',
      amount_param,
      COALESCE(note_param, 'Cash out from Cash Vault'),
      user_name,
      user_id_param
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
    'message', 'Amount withdrawn from Cash Vault successfully. Main balance increased.',
    'new_cashvault_balance', new_cashvault_balance,
    'amount', amount_param,
    'main_balance_after', main_net_balance + amount_param
  );

  RETURN result;
END;
$$;

-- Recreate the withdraw_cash_from_vault function with proper user_id handling
DROP FUNCTION IF EXISTS public.withdraw_cash_from_vault(NUMERIC, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.withdraw_cash_from_vault(
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
  user_id_param UUID;
  result JSONB;
BEGIN
  -- Get the user ID for the given username
  SELECT id INTO user_id_param
  FROM public.users
  WHERE username = user_name
  LIMIT 1;

  -- Get current cashvault balance
  SELECT current_balance INTO current_cashvault_balance
  FROM public.cashvault_balance
  LIMIT 1;

  -- Check if cashvault balance record exists
  IF NOT FOUND THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Cash Vault not initialized',
      'available_balance', 0,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Check if there's enough balance in cashvault
  IF current_cashvault_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in Cash Vault',
      'available_balance', current_cashvault_balance,
      'requested_amount', amount_param
    );
    RETURN result;
  END IF;

  -- Calculate new cashvault balance
  new_cashvault_balance := current_cashvault_balance - amount_param;

  -- ATOMIC TRANSACTION: Update cashvault balance and record withdrawal (NO main account change)
  BEGIN
    -- 1. Update cashvault balance
    UPDATE public.cashvault_balance
    SET current_balance = new_cashvault_balance,
        updated_by = user_name,
        updated_by_user_id = user_id_param,
        last_updated = NOW()
    WHERE id = (SELECT id FROM public.cashvault_balance LIMIT 1);

    -- 2. Record the cashvault transaction (cash usage - expense) with proper user_id
    INSERT INTO public.cashvault_transactions (
      action_type,
      amount,
      note,
      initiating_user,
      initiating_user_id
    ) VALUES (
      'withdrawal',
      amount_param,
      COALESCE(note_param, 'Cash withdrawal from Cash Vault'),
      user_name,
      user_id_param
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
    'message', 'Cash withdrawn from Cash Vault successfully.',
    'new_cashvault_balance', new_cashvault_balance,
    'amount', amount_param
  );

  RETURN result;
END;
$$;

-- Add comments explaining the fixes
COMMENT ON FUNCTION public.cash_out_from_cashvault IS 'Fixed function that properly transfers money from Cash Vault back to main balance with atomic transactions and correct user_id recording';
COMMENT ON FUNCTION public.withdraw_cash_from_vault IS 'Fixed function to withdraw cash from vault as expense (does not return to main account) with correct user_id recording';

-- Ensure any existing transactions without user_id get updated if possible
UPDATE public.cashvault_transactions
SET initiating_user_id = (
  SELECT id FROM public.users
  WHERE username = cashvault_transactions.initiating_user
  LIMIT 1
)
WHERE initiating_user_id IS NULL
AND initiating_user IS NOT NULL;
