-- Migration: Exclude Reserve Investment Withdrawal from system-wide/global outflow calculations
-- Reserve Investment withdrawals are internal wealth reallocations, not new outgoing expenses,
-- so they must not affect system-wide expenditure or net balances.

CREATE OR REPLACE FUNCTION public.get_system_balance_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_cash_in NUMERIC := 0;
  total_cash_out NUMERIC := 0;
  admin_balance NUMERIC := 0;
  is_depleted BOOLEAN := false;
  result JSONB;
BEGIN
  -- Calculate total system cash in/out (exclude Reserve Investment withdrawals from system-wide outflow)
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' AND (category_name IS NULL OR category_name != 'Reserve Investment Withdrawal') THEN ABS(amount) ELSE 0 END), 0)
  INTO total_cash_in, total_cash_out
  FROM public.transactions;
  
  -- Get admin balance from cashvault
  SELECT COALESCE(current_balance, 0)
  INTO admin_balance
  FROM public.cashvault_balance
  LIMIT 1;
  
  -- Determine if system is depleted
  is_depleted := admin_balance <= 0;
  
  -- Build result object
  result := jsonb_build_object(
    'total_cash_in', total_cash_in,
    'total_cash_out', total_cash_out,
    'net_system_balance', total_cash_in - total_cash_out,
    'admin_balance', admin_balance,
    'is_system_depleted', is_depleted,
    'last_updated', NOW()
  );
  
  RETURN result;
END;
$$;

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

  -- Calculate current main system balance, excluding Reserve Investment withdrawals
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' AND (category_name IS NULL OR category_name != 'Reserve Investment Withdrawal') THEN ABS(amount) ELSE 0 END), 0)
  INTO main_cash_in, main_cash_out
  FROM public.transactions;

  main_net_balance := main_cash_in - main_cash_out;

  -- Validation: Check if main system has sufficient balance
  IF main_net_balance < amount_param THEN
    result := jsonb_build_object(
      'success', false,
      'message', 'Insufficient main system balance for transfer to Cashvault',
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
      date,
      time,
      type,
      category_name,
      amount,
      customer_name,
      number_of_pictures,
      whatsapp_number,
      details,
      added_by,
      added_by_user_id
    ) VALUES (
      CURRENT_DATE,
      CURRENT_TIME,
      'cash-out',
      'Cashvault Transfer',
      amount_param, -- Store as positive amount
      'System Transfer',
      0,
      '',
      'Transfer to Cashvault: ' || COALESCE(note_param, 'Manual deposit to Cashvault'),
      user_name,
      user_id_param
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback happens automatically
      result := jsonb_build_object(
        'success', false,
        'message', 'Transaction failed: ' || SQLERRM,
        'available_balance', current_cashvault_balance,
        'requested_amount', amount_param
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

COMMENT ON FUNCTION public.get_system_balance_status() IS 'System balance calculation function. Updated to exclude Reserve Investment withdrawals and use ABS() for cash-out amounts.';
