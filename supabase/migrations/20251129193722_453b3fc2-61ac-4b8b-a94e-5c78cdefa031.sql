-- Fix and enhance the Savings functions for proper real-time execution

-- Drop and recreate deposit_to_savings with improved error handling
DROP FUNCTION IF EXISTS public.deposit_to_savings(numeric, text, text);

CREATE OR REPLACE FUNCTION public.deposit_to_savings(
  amount_param numeric,
  description_param text DEFAULT NULL,
  user_name text DEFAULT 'System'
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

  -- Calculate current main system balance
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0)
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
    CURRENT_DATE, 
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
  
  -- Record the savings transaction
  INSERT INTO public.savings_transactions (
    action_type, amount, description, initiating_user, initiating_user_id,
    balance_before, balance_after
  ) VALUES (
    'deposit', 
    amount_param, 
    COALESCE(description_param, 'Deposit to savings'),
    user_name, 
    user_id_param, 
    current_savings_balance, 
    new_savings_balance
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
$$;

-- Drop and recreate withdraw_from_savings with improved error handling
DROP FUNCTION IF EXISTS public.withdraw_from_savings(numeric, text, text);

CREATE OR REPLACE FUNCTION public.withdraw_from_savings(
  amount_param numeric,
  description_param text DEFAULT NULL,
  user_name text DEFAULT 'System'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_savings_balance numeric := 0;
  new_savings_balance numeric := 0;
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

  -- Get current savings balance
  SELECT current_balance INTO current_savings_balance
  FROM public.savings_balance
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Savings account not initialized',
      'available_balance', 0,
      'requested_amount', amount_param
    );
  END IF;

  -- Check sufficient savings balance
  IF current_savings_balance < amount_param THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient balance in Savings',
      'available_balance', current_savings_balance,
      'requested_amount', amount_param
    );
  END IF;
  
  new_savings_balance := current_savings_balance - amount_param;
  
  -- ATOMIC TRANSACTION: All or nothing
  -- Update savings balance
  UPDATE public.savings_balance 
  SET current_balance = new_savings_balance,
      updated_by = user_name,
      updated_by_user_id = user_id_param,
      last_updated = NOW()
  WHERE id = (SELECT id FROM public.savings_balance LIMIT 1);
  
  -- Create cash-in transaction in main system
  INSERT INTO public.transactions (
    type, amount, details, added_by, category_name, customer_name,
    date, time, number_of_pictures, whatsapp_number, added_by_user_id
  ) VALUES (
    'cash-in', 
    amount_param,
    'Withdrawal from Savings: ' || COALESCE(description_param, 'Savings withdrawal'),
    user_name, 
    'Savings Transfer', 
    'Savings Account',
    CURRENT_DATE, 
    CURRENT_TIME, 
    0, 
    '', 
    user_id_param
  );
  
  -- Record the savings transaction
  INSERT INTO public.savings_transactions (
    action_type, amount, description, initiating_user, initiating_user_id,
    balance_before, balance_after
  ) VALUES (
    'withdrawal', 
    amount_param, 
    COALESCE(description_param, 'Withdrawal from savings'),
    user_name, 
    user_id_param, 
    current_savings_balance, 
    new_savings_balance
  );
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Amount withdrawn from Savings successfully',
    'new_savings_balance', new_savings_balance,
    'amount', amount_param
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
$$;