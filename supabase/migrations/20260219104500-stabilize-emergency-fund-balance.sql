-- Migration to stabilize Emergency Fund balance
-- Ensures only one record exists in emergency_fund_balance
-- and improves the robustness of the deposit/withdrawal functions

-- 1. Consolidate potential multiple balance records into one singleton
DO $$
DECLARE
    total_balance NUMERIC;
    v_balance_id UUID;
    v_updated_by TEXT;
    v_last_updated TIMESTAMPTZ;
BEGIN
    -- Calculate the total sum of all balances (just in case multiple records exist)
    SELECT SUM(current_balance), MAX(last_updated) INTO total_balance, v_last_updated
    FROM public.emergency_fund_balance;

    -- If there's no balance record at all, start with 0
    IF total_balance IS NULL THEN
        total_balance := 0;
    END IF;

    -- Identify the "main" record ID (oldest or first one based on last_updated)
    SELECT id, updated_by INTO v_balance_id, v_updated_by
    FROM public.emergency_fund_balance
    ORDER BY last_updated ASC
    LIMIT 1;

    -- If one was found, update it with total balance and delete extras
    IF v_balance_id IS NOT NULL THEN
        UPDATE public.emergency_fund_balance 
        SET current_balance = total_balance, 
            last_updated = COALESCE(v_last_updated, NOW())
        WHERE id = v_balance_id;

        -- Delete any other records
        DELETE FROM public.emergency_fund_balance WHERE id != v_balance_id;
    ELSE
        -- No record existed, insert a fresh one
        INSERT INTO public.emergency_fund_balance (current_balance, updated_by)
        VALUES (total_balance, 'System Consolidation')
        RETURNING id INTO v_balance_id;
    END IF;
END $$;

-- 2. Add an artificial constraint to prevent multiple rows in the future
-- First ensure the table has a "singleton_guard" column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_fund_balance' AND column_name = 'is_singleton') THEN
        ALTER TABLE public.emergency_fund_balance ADD COLUMN is_singleton BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update the only row to have is_singleton = TRUE
UPDATE public.emergency_fund_balance SET is_singleton = TRUE;

-- Add a unique constraint on is_singleton
-- This will fail if multiple rows exist with is_singleton = true
-- But we already deleted extras above.
-- Note: Postgres handles unique constraints on constant columns by ensuring only one row can have that value.
-- To allow only ONE row in the table, we combine it with CHECK (is_singleton IS TRUE)
ALTER TABLE public.emergency_fund_balance DROP CONSTRAINT IF EXISTS singleton_emergency_fund_balance;
ALTER TABLE public.emergency_fund_balance ADD CONSTRAINT singleton_emergency_fund_balance UNIQUE (is_singleton);
ALTER TABLE public.emergency_fund_balance ADD CONSTRAINT check_singleton_true CHECK (is_singleton IS TRUE);

-- 3. Update the RPC functions to be even more robust (using the singleton)
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

  -- Get current emergency fund balance (the only one allowed)
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  WHERE is_singleton = TRUE
  LIMIT 1;

  IF v_balance_id IS NULL THEN
    -- This should not happen due to the singleton constraint but as safety:
    INSERT INTO public.emergency_fund_balance (current_balance, updated_by, is_singleton)
    VALUES (0, user_username, TRUE)
    ON CONFLICT (is_singleton) DO UPDATE SET is_singleton = TRUE
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
  -- Get current emergency fund balance (using singleton)
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  WHERE is_singleton = TRUE
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
  -- Get current emergency fund balance (using singleton)
  SELECT id, current_balance INTO v_balance_id, current_ef_balance
  FROM public.emergency_fund_balance
  WHERE is_singleton = TRUE
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

-- Repeat for withdrawal functions if needed, but the main issue is usually in the discovery and update of the balance record.
