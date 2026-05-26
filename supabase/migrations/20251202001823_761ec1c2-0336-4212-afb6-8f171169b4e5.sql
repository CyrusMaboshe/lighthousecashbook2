-- Update cash_out_to_cashvault function to accept transaction_date parameter
CREATE OR REPLACE FUNCTION public.cash_out_to_cashvault(
  amount_param numeric, 
  note_param text DEFAULT NULL::text, 
  user_name text DEFAULT 'System'::text,
  transaction_date date DEFAULT CURRENT_DATE
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
      'message', 'Cash Vault not initialized',
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
    
    -- 2. Create cash-out transaction in main system to deduct the amount (with custom date)
    INSERT INTO public.transactions (
      date,
      time,
      type,
      amount,
      details,
      added_by,
      added_by_user_id,
      category_name,
      customer_name,
      number_of_pictures,
      whatsapp_number
    ) VALUES (
      transaction_date,
      CURRENT_TIME,
      'cash-out',
      amount_param,
      'Transfer to Cash Vault: ' || COALESCE(note_param, 'Manual deposit to Cash Vault'),
      user_name,
      user_id_param,
      'Cash Vault Transfer',
      user_name,
      0,
      ''
    );
    
    -- 3. Record the cashvault transaction (with custom date)
    INSERT INTO public.cashvault_transactions (
      action_type,
      amount,
      note,
      initiating_user,
      initiating_user_id,
      date
    ) VALUES (
      'deposit_from_main',
      amount_param,
      COALESCE(note_param, 'Cash out to Cash Vault'),
      user_name,
      user_id_param,
      transaction_date
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
$function$;

-- Update cash_out_from_cashvault function to accept transaction_date parameter
CREATE OR REPLACE FUNCTION public.cash_out_from_cashvault(
  amount_param numeric, 
  note_param text DEFAULT NULL::text, 
  user_name text DEFAULT 'System'::text,
  transaction_date date DEFAULT CURRENT_DATE
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    
    -- 2. Create cash-in transaction in main system to add the amount back (with custom date)
    INSERT INTO public.transactions (
      type,
      amount,
      details,
      added_by,
      category_name,
      customer_name,
      date,
      time,
      number_of_pictures,
      whatsapp_number,
      added_by_user_id
    ) VALUES (
      'cash-in',
      amount_param,
      'Withdrawal from Cash Vault: ' || COALESCE(note_param, 'Manual withdrawal from Cash Vault'),
      user_name,
      'Cash Vault Transfer',
      user_name,
      transaction_date,
      CURRENT_TIME,
      0,
      '',
      user_id_param
    );
    
    -- 3. Record the cashvault transaction (with custom date)
    INSERT INTO public.cashvault_transactions (
      action_type,
      amount,
      note,
      initiating_user,
      initiating_user_id,
      date
    ) VALUES (
      'withdraw_from_vault',
      amount_param,
      COALESCE(note_param, 'Cash out from Cash Vault'),
      user_name,
      user_id_param,
      transaction_date
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
$function$;