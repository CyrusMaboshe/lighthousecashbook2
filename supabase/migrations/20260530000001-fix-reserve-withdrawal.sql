-- ================================================================
-- FIX: Split Reserve Investment Withdrawals between Savings & Vault
-- Migration: 20260530000001-fix-reserve-withdrawal.sql
-- ================================================================

-- 1. DATA CLEANUP: Find negative savings balances and shift them to the vault
DO $$
DECLARE
  v_neg_row RECORD;
  v_vault_id UUID;
  v_current_vault_balance NUMERIC;
BEGIN
  -- Get global vault balance details
  SELECT id, current_balance INTO v_vault_id, v_current_vault_balance
  FROM public.cashvault_balance
  LIMIT 1;

  IF v_vault_id IS NULL THEN
    -- Initialize cashvault if not found
    INSERT INTO public.cashvault_balance (current_balance, updated_by)
    VALUES (0, 'System Migration')
    RETURNING id, current_balance INTO v_vault_id, v_current_vault_balance;
  END IF;

  -- Process negative savings balances (global or company/tenant-specific)
  FOR v_neg_row IN
    SELECT id, tenant_id, current_balance
    FROM public.savings_balance
    WHERE current_balance < 0
  LOOP
    DECLARE
      v_offset NUMERIC := ABS(v_neg_row.current_balance);
    BEGIN
      -- A. Offset the negative savings balance by setting it to 0.00
      UPDATE public.savings_balance
      SET current_balance = 0,
          last_updated = NOW(),
          updated_by = 'System Migration (Negative Balance Fix)'
      WHERE id = v_neg_row.id;

      -- B. Deduct the offset from the global cash vault
      UPDATE public.cashvault_balance
      SET current_balance = current_balance - v_offset,
          last_updated = NOW(),
          updated_by = 'System Migration (Negative Balance Fix)'
      WHERE id = v_vault_id;

      -- C. Record correcting savings transaction to bring it to 0.00
      INSERT INTO public.savings_transactions (
        tenant_id, action_type, amount, description,
        initiating_user, initiating_user_id,
        balance_before, balance_after,
        date, time
      ) VALUES (
        v_neg_row.tenant_id,
        'deposit',
        v_offset,
        'System adjustment: Offset negative reserve withdrawal balance (adjusted to 0.00)',
        'System',
        NULL,
        v_neg_row.current_balance,
        0.00,
        CURRENT_DATE,
        CURRENT_TIME
      );

      -- D. Record the corresponding withdrawal in cashvault_transactions
      INSERT INTO public.cashvault_transactions (
        action_type, amount, note,
        initiating_user, initiating_user_id,
        date
      ) VALUES (
        'withdraw_from_vault',
        v_offset,
        'System adjustment: Offset negative reserve withdrawal balance for ' || COALESCE('tenant ' || v_neg_row.tenant_id::text, 'global'),
        'System',
        NULL,
        CURRENT_DATE
      );
    END;
  END LOOP;
END $$;


-- 2. Define/Redefine Atomic execute_reserve_withdrawal function
CREATE OR REPLACE FUNCTION public.execute_reserve_withdrawal(
  p_alloc_id   UUID,
  p_amount     NUMERIC,
  p_username   TEXT,
  p_user_id    UUID,
  p_today_date DATE,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alloc_withdrawn NUMERIC := 0;
  v_alloc_amount    NUMERIC := 0;
  v_company_id      UUID;
  v_global_reserve  NUMERIC := 0;
  v_savings_balance NUMERIC := 0;
  v_vault_balance   NUMERIC := 0;
  v_withdraw_savings NUMERIC := 0;
  v_withdraw_vault   NUMERIC := 0;
  v_new_withdrawn   NUMERIC := 0;
  v_new_global      NUMERIC := 0;
  v_alloc_user_id   UUID;
  v_alloc_username  TEXT;
  v_savings_balance_row_id UUID;
  v_vault_balance_row_id UUID;
  v_withdrawal_id   UUID;
  v_result          JSONB;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Withdrawal amount must be greater than zero');
  END IF;

  -- A. Fetch allocation details
  SELECT
    COALESCE(total_withdrawn, 0),
    COALESCE(allocated_amount, 0),
    user_id,
    user_display_name,
    company_id
  INTO v_alloc_withdrawn, v_alloc_amount, v_alloc_user_id, v_alloc_username, v_company_id
  FROM public.reserve_investment_allocations
  WHERE id = p_alloc_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Allocation not found');
  END IF;

  -- B. Verify withdrawal does not exceed remaining allocated balance
  IF (v_alloc_amount - v_alloc_withdrawn) < p_amount THEN
    RETURN jsonb_build_object(
      'success',   false,
      'message',   'Withdrawal amount exceeds remaining allocated reserve balance',
      'allocated', v_alloc_amount,
      'withdrawn', v_alloc_withdrawn,
      'available', v_alloc_amount - v_alloc_withdrawn,
      'requested', p_amount
    );
  END IF;

  -- C. Check global/tenant config pool
  SELECT COALESCE(total_reserve, 0)
  INTO v_global_reserve
  FROM public.reserve_investment_config
  WHERE id = COALESCE(v_company_id::text, 'singleton');

  IF NOT FOUND THEN
    -- If config not found for tenant, check if it's singleton or create default
    IF v_company_id IS NULL THEN
      INSERT INTO public.reserve_investment_config (id, total_reserve, savings_percent, updated_by)
      VALUES ('singleton', p_amount, 15, p_username)
      RETURNING total_reserve INTO v_global_reserve;
    ELSE
      INSERT INTO public.reserve_investment_config (id, total_reserve, savings_percent, updated_by)
      VALUES (v_company_id::text, p_amount, 10, p_username)
      RETURNING total_reserve INTO v_global_reserve;
    END IF;
  END IF;

  IF v_global_reserve < p_amount THEN
    RETURN jsonb_build_object(
      'success',        false,
      'message',        'Insufficient reserve pool funds in config',
      'global_reserve', v_global_reserve,
      'requested',      p_amount
    );
  END IF;

  -- D. Get current savings balance
  SELECT COALESCE(current_balance, 0), id
  INTO v_savings_balance, v_savings_balance_row_id
  FROM public.savings_balance
  WHERE (v_company_id IS NOT NULL AND tenant_id = v_company_id)
     OR (v_company_id IS NULL AND tenant_id IS NULL)
  LIMIT 1;

  IF NOT FOUND THEN
    -- Initialize if not exists
    INSERT INTO public.savings_balance (tenant_id, current_balance, updated_by, updated_by_user_id)
    VALUES (v_company_id, 0, p_username, p_user_id)
    RETURNING current_balance, id INTO v_savings_balance, v_savings_balance_row_id;
  END IF;

  -- E. Get current vault balance
  SELECT COALESCE(current_balance, 0), id
  INTO v_vault_balance, v_vault_balance_row_id
  FROM public.cashvault_balance
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.cashvault_balance (current_balance, updated_by, updated_by_user_id)
    VALUES (0, p_username, p_user_id)
    RETURNING current_balance, id INTO v_vault_balance, v_vault_balance_row_id;
  END IF;

  -- F. Check if combined funds are sufficient
  IF (v_savings_balance + v_vault_balance) < p_amount THEN
    RETURN jsonb_build_object(
      'success',         false,
      'message',         'Insufficient combined funds in Savings and Vault to cover withdrawal',
      'savings_balance', v_savings_balance,
      'vault_balance',   v_vault_balance,
      'requested',       p_amount
    );
  END IF;

  -- G. Calculate Split
  v_withdraw_savings := LEAST(v_savings_balance, p_amount);
  v_withdraw_vault   := p_amount - v_withdraw_savings;

  -- Double check vault limit
  IF v_withdraw_vault > v_vault_balance THEN
    RETURN jsonb_build_object(
      'success',         false,
      'message',         'Withdrawal exceeds cash vault capacity after exhausting savings',
      'savings_balance', v_savings_balance,
      'vault_balance',   v_vault_balance,
      'requested',       p_amount
    );
  END IF;

  -- Calculate new totals
  v_new_withdrawn := v_alloc_withdrawn + p_amount;
  v_new_global    := v_global_reserve  - p_amount;

  -- ─── ATOMIC UPDATES ───────────────────────────────────────────────────────

  -- 1. Insert into reserve_investment_withdrawals
  INSERT INTO public.reserve_investment_withdrawals (
    user_id, user_display_name, allocation_id,
    amount, balance_before, balance_after,
    description, date, created_at
  ) VALUES (
    v_alloc_user_id, v_alloc_username, p_alloc_id,
    p_amount,
    v_alloc_amount - v_alloc_withdrawn,
    v_alloc_amount - v_new_withdrawn,
    p_description, p_today_date, NOW()
  ) RETURNING id INTO v_withdrawal_id;

  -- 2. Update allocation
  UPDATE public.reserve_investment_allocations
  SET total_withdrawn = v_new_withdrawn,
      updated_at      = NOW()
  WHERE id = p_alloc_id;

  -- 3. Update config pool
  UPDATE public.reserve_investment_config
  SET total_reserve = v_new_global,
      updated_at    = NOW()
  WHERE id = COALESCE(v_company_id::text, 'singleton');

  -- 4. Record main cash-out transaction
  IF v_company_id IS NOT NULL THEN
    INSERT INTO public.mt_company_transactions (
      company_id, date, time, type, category_name, amount,
      customer_name, added_by, added_by_user_id, details
    ) VALUES (
      v_company_id, p_today_date, CURRENT_TIME, 'cash-out',
      'Reserve Investment Withdrawal', p_amount,
      p_username, p_username, p_user_id,
      'Reserve Investment Withdrawal: ' || COALESCE(p_description, 'Withdrawal') || ' — ' || p_username || '.'
    );
  ELSE
    INSERT INTO public.transactions (
      date, time, type, category_name, amount,
      customer_name, added_by, added_by_user_id,
      details, number_of_pictures, whatsapp_number
    ) VALUES (
      p_today_date, CURRENT_TIME, 'cash-out',
      'Reserve Investment Withdrawal', p_amount,
      p_username, p_username, p_user_id,
      'Reserve Investment Withdrawal: ' || COALESCE(p_description, 'Withdrawal') || ' — ' || p_username || '.',
      0, ''
    );
  END IF;

  -- 5. Deduct from Savings (if savings portion > 0)
  IF v_withdraw_savings > 0 THEN
    UPDATE public.savings_balance
    SET current_balance = current_balance - v_withdraw_savings,
        last_updated    = NOW(),
        updated_by      = p_username,
        updated_by_user_id = p_user_id
    WHERE id = v_savings_balance_row_id;

    -- Include the withdrawal ID in the description so it can be reversed cleanly
    INSERT INTO public.savings_transactions (
      user_id, tenant_id, action_type, amount, description,
      initiating_user, initiating_user_id,
      balance_before, balance_after,
      date, created_at
    ) VALUES (
      v_alloc_user_id, v_company_id, 'withdrawal',
      v_withdraw_savings,
      'Reserve Investment (Savings portion) [' || v_withdrawal_id::text || ']: ' || COALESCE(p_description, 'Withdrawal') || ' - ' || p_username,
      p_username, p_user_id,
      v_savings_balance,
      v_savings_balance - v_withdraw_savings,
      p_today_date, NOW()
    );
  END IF;

  -- 6. Deduct from Cash Vault (if vault portion > 0)
  IF v_withdraw_vault > 0 THEN
    UPDATE public.cashvault_balance
    SET current_balance = current_balance - v_withdraw_vault,
        last_updated    = NOW(),
        updated_by      = p_username,
        updated_by_user_id = p_user_id
    WHERE id = v_vault_balance_row_id;

    -- Include the withdrawal ID in the note so it can be reversed cleanly
    INSERT INTO public.cashvault_transactions (
      action_type, amount, note,
      initiating_user, initiating_user_id,
      date, created_at, updated_at
    ) VALUES (
      'withdraw_from_vault',
      v_withdraw_vault,
      'Reserve Investment (Vault portion) [' || v_withdrawal_id::text || ']: ' || COALESCE(p_description, 'Withdrawal') || ' - ' || p_username,
      p_username, p_user_id,
      p_today_date, NOW(), NOW()
    );
  END IF;

  v_result := jsonb_build_object(
    'success',             true,
    'message',             'Reserve withdrawal executed successfully',
    'withdrawal_id',       v_withdrawal_id,
    'withdrawn_amount',    p_amount,
    'savings_deducted',    v_withdraw_savings,
    'vault_deducted',      v_withdraw_vault,
    'new_total_withdrawn', v_new_withdrawn,
    'new_global_reserve',  v_new_global
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$;


-- 3. Define Atomic reverse_reserve_withdrawal function
CREATE OR REPLACE FUNCTION public.reverse_reserve_withdrawal(
  p_withdrawal_id UUID,
  p_username      TEXT,
  p_user_id       UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_w_amount        NUMERIC;
  v_alloc_id        UUID;
  v_company_id      UUID;
  v_user_display_name TEXT;
  v_date            DATE;
  v_savings_refund  NUMERIC := 0;
  v_vault_refund    NUMERIC := 0;
  v_savings_bal_id  UUID;
  v_vault_bal_id    UUID;
  v_result          JSONB;
BEGIN
  -- Fetch withdrawal record
  SELECT amount, allocation_id, user_display_name, date
  INTO v_w_amount, v_alloc_id, v_user_display_name, v_date
  FROM public.reserve_investment_withdrawals
  WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Withdrawal record not found');
  END IF;

  -- Fetch allocation company_id
  IF v_alloc_id IS NOT NULL THEN
    SELECT company_id INTO v_company_id
    FROM public.reserve_investment_allocations
    WHERE id = v_alloc_id;
  END IF;

  -- Find and delete savings transaction
  DECLARE
    v_st_id UUID;
    v_st_amount NUMERIC;
  BEGIN
    SELECT id, amount INTO v_st_id, v_st_amount
    FROM public.savings_transactions
    WHERE description LIKE '%' || p_withdrawal_id::text || '%'
    LIMIT 1;

    IF v_st_id IS NOT NULL THEN
      v_savings_refund := v_st_amount;
      DELETE FROM public.savings_transactions WHERE id = v_st_id;
    END IF;
  END;

  -- Find and delete vault transaction
  DECLARE
    v_vt_id UUID;
    v_vt_amount NUMERIC;
  BEGIN
    SELECT id, amount INTO v_vt_id, v_vt_amount
    FROM public.cashvault_transactions
    WHERE note LIKE '%' || p_withdrawal_id::text || '%'
    LIMIT 1;

    IF v_vt_id IS NOT NULL THEN
      v_vault_refund := v_vt_amount;
      DELETE FROM public.cashvault_transactions WHERE id = v_vt_id;
    END IF;
  END;

  -- Refund savings balance
  IF v_savings_refund > 0 THEN
    SELECT id INTO v_savings_bal_id
    FROM public.savings_balance
    WHERE (v_company_id IS NOT NULL AND tenant_id = v_company_id)
       OR (v_company_id IS NULL AND tenant_id IS NULL)
    LIMIT 1;

    IF v_savings_bal_id IS NOT NULL THEN
      UPDATE public.savings_balance
      SET current_balance = current_balance + v_savings_refund,
          last_updated = NOW(),
          updated_by = p_username,
          updated_by_user_id = p_user_id
      WHERE id = v_savings_bal_id;
    END IF;
  END IF;

  -- Refund vault balance
  IF v_vault_refund > 0 THEN
    SELECT id INTO v_vault_bal_id
    FROM public.cashvault_balance
    LIMIT 1;

    IF v_vault_bal_id IS NOT NULL THEN
      UPDATE public.cashvault_balance
      SET current_balance = current_balance + v_vault_refund,
          last_updated = NOW(),
          updated_by = p_username,
          updated_by_user_id = p_user_id
      WHERE id = v_vault_bal_id;
    END IF;
  END IF;

  -- Update allocation
  IF v_alloc_id IS NOT NULL THEN
    UPDATE public.reserve_investment_allocations
    SET total_withdrawn = GREATEST(0, total_withdrawn - v_w_amount),
        updated_at = NOW()
    WHERE id = v_alloc_id;
  END IF;

  -- Update config pool
  UPDATE public.reserve_investment_config
  SET total_reserve = total_reserve + v_w_amount,
      updated_at = NOW()
  WHERE id = COALESCE(v_company_id::text, 'singleton');

  -- Delete from main transactions table
  IF v_company_id IS NOT NULL THEN
    DELETE FROM public.mt_company_transactions
    WHERE company_id = v_company_id
      AND amount = v_w_amount
      AND date = v_date
      AND category_name = 'Reserve Investment Withdrawal';
  ELSE
    DELETE FROM public.transactions
    WHERE amount = v_w_amount
      AND date = v_date
      AND category_name = 'Reserve Investment Withdrawal';
  END IF;

  -- Delete the primary withdrawal record
  DELETE FROM public.reserve_investment_withdrawals
  WHERE id = p_withdrawal_id;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Reserve withdrawal reversed successfully',
    'refunded_savings', v_savings_refund,
    'refunded_vault', v_vault_refund
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$;


-- 4. Define Atomic update_reserve_withdrawal function
CREATE OR REPLACE FUNCTION public.update_reserve_withdrawal(
  p_withdrawal_id   UUID,
  p_new_amount      NUMERIC,
  p_new_description TEXT,
  p_new_date        DATE,
  p_username        TEXT,
  p_user_id         UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alloc_id UUID;
  v_rev_res  JSONB;
  v_exec_res JSONB;
BEGIN
  -- Get the allocation ID
  SELECT allocation_id INTO v_alloc_id
  FROM public.reserve_investment_withdrawals
  WHERE id = p_withdrawal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Existing withdrawal record not found');
  END IF;

  -- A. Reverse the existing withdrawal (restores all balances)
  v_rev_res := public.reverse_reserve_withdrawal(p_withdrawal_id, p_username, p_user_id);
  IF NOT (v_rev_res->>'success')::BOOLEAN THEN
    RETURN jsonb_build_object('success', false, 'message', 'Failed to reverse old withdrawal: ' || (v_rev_res->>'message'));
  END IF;

  -- B. Execute the new withdrawal (applies the split-deduction dynamically)
  v_exec_res := public.execute_reserve_withdrawal(
    v_alloc_id,
    p_new_amount,
    p_username,
    p_user_id,
    p_new_date,
    p_new_description
  );

  IF NOT (v_exec_res->>'success')::BOOLEAN THEN
    -- Raising an exception rolls back the entire transaction (including the reversal)
    -- so no balances/records are corrupted.
    RAISE EXCEPTION 'Failed to execute new withdrawal: %', (v_exec_res->>'message');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Withdrawal updated successfully',
    'reversal_details', v_rev_res,
    'execution_details', v_exec_res
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Update failed: ' || SQLERRM);
END;
$$;
