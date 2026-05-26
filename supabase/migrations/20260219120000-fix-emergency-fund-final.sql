-- ============================================================
-- DEFINITIVE FIX: Emergency Fund Balance Always Shows 0
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: Drop ALL existing balance records and start fresh with ONE clean record
-- We calculate the true balance from transaction history
DO $$
DECLARE
    v_true_balance NUMERIC := 0;
BEGIN
    -- Calculate true balance from transaction history
    SELECT COALESCE(
        SUM(CASE WHEN action_type = 'deposit' THEN amount ELSE -amount END), 0
    ) INTO v_true_balance
    FROM public.emergency_fund_transactions;

    RAISE NOTICE 'Calculated true balance from transactions: %', v_true_balance;

    -- Wipe all balance records
    DELETE FROM public.emergency_fund_balance;

    -- Insert one clean record
    INSERT INTO public.emergency_fund_balance (current_balance, updated_by, last_updated)
    VALUES (v_true_balance, 'System Fix', NOW());

    RAISE NOTICE 'Inserted single balance record with value: %', v_true_balance;
END $$;

-- STEP 2: Add is_singleton column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'emergency_fund_balance' AND column_name = 'is_singleton'
    ) THEN
        ALTER TABLE public.emergency_fund_balance ADD COLUMN is_singleton BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_singleton column';
    END IF;
END $$;

-- Set is_singleton = TRUE on the single record
UPDATE public.emergency_fund_balance SET is_singleton = TRUE;

-- Drop and recreate the unique constraint to be safe
ALTER TABLE public.emergency_fund_balance DROP CONSTRAINT IF EXISTS singleton_emergency_fund_balance;
ALTER TABLE public.emergency_fund_balance DROP CONSTRAINT IF EXISTS check_singleton_true;
ALTER TABLE public.emergency_fund_balance ADD CONSTRAINT singleton_emergency_fund_balance UNIQUE (is_singleton);
ALTER TABLE public.emergency_fund_balance ADD CONSTRAINT check_singleton_true CHECK (is_singleton IS TRUE);

-- STEP 3: Rebuild deposit_to_emergency_fund - BULLETPROOF version
-- Key fix: does NOT check main_net_balance (this was blocking deposits!)
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
  v_balance_id UUID;
  result JSONB;
BEGIN
  -- Validate input
  IF amount_param IS NULL OR amount_param <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Amount must be greater than 0');
  END IF;

  -- Get the single balance record (UPSERT if somehow missing)
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  LIMIT 1;

  IF v_balance_id IS NULL THEN
    INSERT INTO public.emergency_fund_balance (current_balance, updated_by, is_singleton)
    VALUES (0, user_username, TRUE)
    RETURNING id, current_balance INTO v_balance_id, current_ef_balance;
    RAISE NOTICE 'Created new balance record because none existed';
  END IF;

  current_ef_balance := COALESCE(current_ef_balance, 0);
  new_ef_balance := current_ef_balance + amount_param;

  BEGIN
    -- 1. Update emergency balance
    UPDATE public.emergency_fund_balance
    SET current_balance = new_ef_balance,
        updated_by = user_username,
        last_updated = NOW()
    WHERE id = v_balance_id;

    -- 2. Create cash-out transaction in main system
    INSERT INTO public.transactions (
      type, amount, details, added_by, category_name,
      date, time, customer_name, number_of_pictures, whatsapp_number
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
      action_type, amount, note, initiating_user, date
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
    'message', 'Deposited to Emergency Fund.',
    'new_balance', new_ef_balance,
    'previous_balance', current_ef_balance,
    'amount', amount_param
  );
  RETURN result;
END;
$$;

-- STEP 4: Rebuild withdraw_from_emergency_fund - robust version
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
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  LIMIT 1;

  current_ef_balance := COALESCE(current_ef_balance, 0);

  IF v_balance_id IS NULL OR current_ef_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient funds in Emergency Fund',
      'available_balance', current_ef_balance
    );
    RETURN result;
  END IF;

  new_ef_balance := current_ef_balance - amount_param;

  BEGIN
    UPDATE public.emergency_fund_balance
    SET current_balance = new_ef_balance,
        updated_by = user_username,
        last_updated = NOW()
    WHERE id = v_balance_id;

    INSERT INTO public.transactions (
      type, amount, details, added_by, category_name,
      date, time, customer_name, number_of_pictures, whatsapp_number
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

    INSERT INTO public.emergency_fund_transactions (
      action_type, amount, note, initiating_user, date
    ) VALUES (
      'withdrawal',
      amount_param,
      COALESCE(note_param, 'Withdrawal to main'),
      user_username,
      transaction_date
    );

  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
  END;

  RETURN jsonb_build_object('success', true, 'message', 'Withdrawn from Emergency Fund.', 'new_balance', new_ef_balance);
END;
$$;

-- STEP 5: Rebuild withdraw_cash_from_emergency_fund - robust version
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
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  LIMIT 1;

  current_ef_balance := COALESCE(current_ef_balance, 0);

  IF v_balance_id IS NULL OR current_ef_balance < amount_param THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient funds in Emergency Fund', 'available_balance', current_ef_balance);
  END IF;

  new_ef_balance := current_ef_balance - amount_param;

  BEGIN
    UPDATE public.emergency_fund_balance
    SET current_balance = new_ef_balance,
        updated_by = user_username,
        last_updated = NOW()
    WHERE id = v_balance_id;

    INSERT INTO public.emergency_fund_transactions (
      action_type, amount, note, initiating_user, date
    ) VALUES (
      'withdrawal',
      amount_param,
      COALESCE(note_param, 'Direct cash withdrawal from Emergency Fund'),
      user_username,
      transaction_date
    );

  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
  END;

  RETURN jsonb_build_object('success', true, 'message', 'Direct withdrawal from Emergency Fund successful.', 'new_balance', new_ef_balance);
END;
$$;

-- STEP 6: Ensure grants are correct
GRANT ALL ON public.emergency_fund_balance TO anon, authenticated, service_role;
GRANT ALL ON public.emergency_fund_transactions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deposit_to_emergency_fund(NUMERIC, TEXT, DATE, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.withdraw_from_emergency_fund(NUMERIC, TEXT, DATE, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.withdraw_cash_from_emergency_fund(NUMERIC, TEXT, DATE, TEXT) TO anon, authenticated, service_role;

-- STEP 7: Verify final state
SELECT 
    'Balance Records' as check_type,
    COUNT(*) as count,
    SUM(current_balance) as total_balance
FROM public.emergency_fund_balance;

SELECT 
    'Emergency Transactions' as check_type,
    COUNT(*) as count,
    SUM(CASE WHEN action_type = 'deposit' THEN amount ELSE -amount END) as net_balance
FROM public.emergency_fund_transactions;
