-- Migration: Atomic execute_reserve_withdrawal function
-- This provides a bulletproof database transaction for drawing money from reserve investment,
-- keeping all system balances in exact parity.

CREATE OR REPLACE FUNCTION public.execute_reserve_withdrawal(
  p_alloc_id UUID,
  p_amount NUMERIC,
  p_username TEXT,
  p_user_id UUID,
  p_today_date DATE,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_savings_balance NUMERIC := 0;
  v_vault_balance NUMERIC := 0;
  v_combined_balance NUMERIC := 0;
  v_current_alloc_withdrawn NUMERIC := 0;
  v_current_alloc_amount NUMERIC := 0;
  v_global_reserve NUMERIC := 0;
  v_new_withdrawn NUMERIC := 0;
  v_new_global NUMERIC := 0;
  result JSONB;
BEGIN
  -- 1. Check allocation details
  SELECT COALESCE(total_withdrawn, 0), COALESCE(allocated_amount, 0)
  INTO v_current_alloc_withdrawn, v_current_alloc_amount
  FROM public.reserve_investment_allocations
  WHERE id = p_alloc_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Allocation not found'
    );
  END IF;

  -- 2. Verify withdrawal eligibility (must not exceed remaining allocation balance)
  IF (v_current_alloc_amount - v_current_alloc_withdrawn) < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Withdrawal amount exceeds remaining allocated reserve balance',
      'allocated', v_current_alloc_amount,
      'withdrawn', v_current_alloc_withdrawn,
      'available', v_current_alloc_amount - v_current_alloc_withdrawn,
      'requested', p_amount
    );
  END IF;

  -- 3. Check and deduct from global config
  SELECT COALESCE(total_reserve, 0)
  INTO v_global_reserve
  FROM public.reserve_investment_config
  WHERE id = 'singleton';

  IF v_global_reserve < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient global reserve pool funds',
      'global_reserve', v_global_reserve,
      'requested', p_amount
    );
  END IF;

  -- 4. Get available secure holdings to ensure savings has parity
  SELECT COALESCE(current_balance, 0)
  INTO v_savings_balance
  FROM public.savings_balance
  LIMIT 1;

  -- Deduct chronologically
  v_new_withdrawn := v_current_alloc_withdrawn + p_amount;
  v_new_global := v_global_reserve - p_amount;

  -- ATOMIC UPDATES:
  -- A. Insert reserve withdrawal record
  INSERT INTO public.reserve_investment_withdrawals (
    user_id,
    user_display_name,
    allocation_id,
    amount,
    balance_before,
    balance_after,
    description,
    date,
    created_at
  ) VALUES (
    (SELECT user_id FROM public.reserve_investment_allocations WHERE id = p_alloc_id),
    (SELECT user_display_name FROM public.reserve_investment_allocations WHERE id = p_alloc_id),
    p_alloc_id,
    p_amount,
    v_current_alloc_amount - v_current_alloc_withdrawn,
    v_current_alloc_amount - v_new_withdrawn,
    p_description,
    p_today_date,
    NOW()
  );

  -- B. Update allocation record
  UPDATE public.reserve_investment_allocations
  SET total_withdrawn = v_new_withdrawn,
      updated_at = NOW()
  WHERE id = p_alloc_id;

  -- C. Deduct from Global Reserve Total in config
  UPDATE public.reserve_investment_config
  SET total_reserve = v_new_global,
      updated_at = NOW()
  WHERE id = 'singleton';

  -- D. Record in main transaction history (included in Cash Out but excluded from Net Balance calculations)
  INSERT INTO public.transactions (
    date,
    time,
    type,
    category_name,
    amount,
    customer_name,
    added_by,
    added_by_user_id,
    details,
    number_of_pictures,
    whatsapp_number
  ) VALUES (
    p_today_date,
    CURRENT_TIME,
    'cash-out',
    'Reserve Investment Withdrawal',
    p_amount,
    p_username,
    p_username,
    p_user_id,
    'Reserve Investment cash-out: ' || COALESCE(p_description, 'Withdrawal') || '.',
    0,
    ''
  );

  -- E. Deduct from persistent savings pool (Savings totals)
  INSERT INTO public.savings_transactions (
    action_type,
    amount,
    description,
    initiating_user,
    initiating_user_id,
    balance_before,
    balance_after,
    date,
    created_at
  ) VALUES (
    'withdrawal',
    p_amount,
    'Reserve Investment: ' || COALESCE(p_description, 'Withdrawal') || ' - ' || p_username,
    p_username,
    p_user_id,
    v_savings_balance,
    v_savings_balance - p_amount,
    p_today_date,
    NOW()
  );

  -- Update overall savings balance singleton record
  UPDATE public.savings_balance
  SET current_balance = COALESCE(current_balance, 0) - p_amount,
      last_updated = NOW(),
      updated_by = p_username;

  result := jsonb_build_object(
    'success', true,
    'message', 'Reserve withdrawal executed successfully',
    'withdrawn_amount', p_amount,
    'new_total_withdrawn', v_new_withdrawn,
    'new_global_reserve', v_new_global
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Database error: ' || SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.execute_reserve_withdrawal IS 'Executes an atomic Reserve Investment withdrawal transaction across allocations, config, transactions, and savings pools.';
