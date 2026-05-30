-- ================================================================
-- FIX: Exclude Reserve Investment Withdrawals from Savings Deposit Balance Check
-- Migration: 20260530000000-fix-deposit-to-savings.sql
-- ================================================================

-- 1. Update deposit_to_savings function to exclude Reserve Investment Withdrawals from cash-out sum
CREATE OR REPLACE FUNCTION public.deposit_to_savings(
  amount_param numeric, 
  description_param text DEFAULT NULL::text, 
  user_name text DEFAULT 'System'::text,
  transaction_date date DEFAULT CURRENT_DATE
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 AS $function$
DECLARE
  current_savings_balance numeric := 0;
  new_savings_balance numeric := 0;
  main_cash_in numeric := 0;
  main_cash_out numeric := 0;
  main_net_balance numeric := 0;
  user_id_param uuid;
  result jsonb;
BEGIN
  -- Validate amount
  IF amount_param <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Amount must be greater than zero'
    );
  END IF;

  -- Get user ID with validation
  SELECT id INTO user_id_param
  FROM public.users
  WHERE username = user_name
  LIMIT 1;

  IF user_id_param IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found: ' || user_name
    );
  END IF;

  -- Calculate current main system balance (excluding Reserve Investment Withdrawals)
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' AND (category_name IS NULL OR category_name <> 'Reserve Investment Withdrawal') THEN ABS(amount) ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions;

  main_net_balance := main_cash_in - main_cash_out;

  -- Check sufficient balance
  IF main_net_balance < amount_param THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in main account',
      'available_balance', main_net_balance,
      'requested_amount', amount_param
    );
  END IF;

  -- Get or create savings balance
  SELECT current_balance INTO current_savings_balance
  FROM public.savings_balance
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.savings_balance (current_balance, updated_by, updated_by_user_id)
    VALUES (0, user_name, user_id_param);
    current_savings_balance := 0;
  END IF;
  
  new_savings_balance := current_savings_balance + amount_param;
  
  -- ATOMIC TRANSACTION: All or nothing
  -- Update savings balance
  UPDATE public.savings_balance 
  SET current_balance = new_savings_balance,
      updated_by = user_name,
      updated_by_user_id = user_id_param,
      last_updated = NOW()
  WHERE id = (SELECT id FROM public.savings_balance LIMIT 1);
  
  -- Create cash-out transaction in main system
  INSERT INTO public.transactions (
    date, time, type, amount, details, added_by, added_by_user_id,
    category_name, customer_name, number_of_pictures, whatsapp_number
  ) VALUES (
    transaction_date, 
    CURRENT_TIME, 
    'cash-out', 
    amount_param,
    'Transfer to Savings: ' || COALESCE(description_param, 'Savings deposit'),
    user_name, 
    user_id_param, 
    'Savings Transfer', 
    'Savings Account', 
    0, 
    ''
  );
  
  -- Record the savings transaction with the specified date
  INSERT INTO public.savings_transactions (
    action_type, amount, description, initiating_user, initiating_user_id,
    balance_before, balance_after, date
  ) VALUES (
    'deposit', 
    amount_param, 
    COALESCE(description_param, 'Deposit to savings'),
    user_name, 
    user_id_param, 
    current_savings_balance, 
    new_savings_balance,
    transaction_date
  );
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Amount transferred to Savings successfully',
    'new_savings_balance', new_savings_balance,
    'amount', amount_param,
    'main_balance_after', main_net_balance - amount_param
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Transaction failed: ' || SQLERRM,
      'error_code', SQLSTATE
    );
END;
$function$;


-- 2. Update user_deposit_to_savings function to exclude Reserve Investment Withdrawals from cash-out sum
CREATE OR REPLACE FUNCTION public.user_deposit_to_savings(
  p_user_id uuid,
  amount_param numeric,
  description_param text DEFAULT NULL,
  user_name text DEFAULT 'System',
  transaction_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_savings_balance numeric := 0;
  new_savings_balance numeric := 0;
  main_cash_in numeric := 0;
  main_cash_out numeric := 0;
  main_net_balance numeric := 0;
BEGIN
  -- Validate amount
  IF amount_param <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Amount must be greater than zero');
  END IF;

  -- Calculate user's main balance from transactions they created (excluding Reserve Investment Withdrawals)
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' AND (category_name IS NULL OR category_name <> 'Reserve Investment Withdrawal') THEN ABS(amount) ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions
  WHERE added_by_user_id = p_user_id;

  main_net_balance := main_cash_in - main_cash_out;

  -- Check sufficient balance
  IF main_net_balance < amount_param THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in main account',
      'available_balance', main_net_balance,
      'requested_amount', amount_param
    );
  END IF;

  -- Get current user's savings balance
  SELECT COALESCE(SUM(CASE WHEN action_type = 'deposit' THEN amount ELSE -amount END), 0)
  INTO current_savings_balance
  FROM public.savings_transactions
  WHERE user_id = p_user_id;
  
  new_savings_balance := current_savings_balance + amount_param;
  
  -- Create cash-out transaction in main system for this user
  INSERT INTO public.transactions (
    date, time, type, amount, details, added_by, added_by_user_id,
    category_name, customer_name, number_of_pictures, whatsapp_number
  ) VALUES (
    transaction_date, CURRENT_TIME, 'cash-out', amount_param,
    'Transfer to Personal Savings: ' || COALESCE(description_param, 'Savings deposit'),
    user_name, p_user_id, 'Savings Transfer', 'Personal Savings', 0, ''
  );
  
  -- Record the savings transaction for this user
  INSERT INTO public.savings_transactions (
    user_id, action_type, amount, description, initiating_user, initiating_user_id,
    balance_before, balance_after, date
  ) VALUES (
    p_user_id, 'deposit', amount_param, COALESCE(description_param, 'Deposit to savings'),
    user_name, p_user_id, current_savings_balance, new_savings_balance, transaction_date
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Amount transferred to Savings successfully',
    'new_savings_balance', new_savings_balance,
    'amount', amount_param,
    'main_balance_after', main_net_balance - amount_param
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaction failed: ' || SQLERRM);
END;
$$;
