-- =============================================================================
-- Migration: FINAL Reserve Investment Withdrawal — Net Balance Fix
-- Date: 2026-05-26
-- =============================================================================
--
-- CORE PRINCIPLE:
--   Reserve Investment Withdrawals are NOT operational expenses.
--   They are internal wealth reallocations from reserve funds (savings/vault).
--   Therefore they must:
--     ✅  Appear in Cash-Out TOTALS for display/history/tracking
--     ✅  Reduce reserve balances (savings/vault)
--     ❌  NOT reduce operational Net Balance
--     ❌  NOT create artificial negative balances
--
-- This migration rewrites the three critical DB functions to enforce this rule
-- at the database layer, ensuring correctness regardless of frontend version.
-- =============================================================================


-- ============================================================
-- 1. get_system_balance_status
--    Used by: useSystemBalance → admin dashboard totals
--
--    total_cash_out        = ALL cash-outs incl. Reserve (display)
--    net_system_balance    = cash_in − OPERATIONAL cash-outs only
--                           (Reserve Investment Withdrawals EXCLUDED)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_system_balance_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_cash_in            NUMERIC := 0;
  v_total_cash_out_display   NUMERIC := 0;  -- ALL cash-outs (incl. reserve) — for display
  v_total_operational_out    NUMERIC := 0;  -- operational cash-outs only — for net balance
  v_admin_balance            NUMERIC := 0;
  v_is_depleted              BOOLEAN := false;
  v_result                   JSONB;
BEGIN
  -- Single pass: calculate cash-in, full cash-out, and operational cash-out
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in'  THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN ABS(amount) ELSE 0 END), 0),
    COALESCE(SUM(
      CASE
        WHEN type = 'cash-out'
         AND (category_name IS NULL OR category_name <> 'Reserve Investment Withdrawal')
        THEN ABS(amount)
        ELSE 0
      END
    ), 0)
  INTO v_total_cash_in, v_total_cash_out_display, v_total_operational_out
  FROM public.transactions;

  -- Admin vault balance (used for depletion detection only)
  SELECT COALESCE(current_balance, 0)
  INTO v_admin_balance
  FROM public.cashvault_balance
  LIMIT 1;

  v_is_depleted := v_admin_balance <= 0;

  v_result := jsonb_build_object(
    'total_cash_in',         v_total_cash_in,
    'total_cash_out',        v_total_cash_out_display,          -- incl. reserve (display/history)
    'operational_cash_out',  v_total_operational_out,           -- excl. reserve (homepage outgoing card)
    'net_system_balance',    v_total_cash_in - v_total_operational_out,  -- excl. reserve
    'admin_balance',         v_admin_balance,
    'is_system_depleted',    v_is_depleted,
    'last_updated',          NOW()
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_system_balance_status() IS
'Returns system-wide balance status.
 total_cash_out INCLUDES Reserve Investment Withdrawals (for display/tracking).
 net_system_balance EXCLUDES them — reserve withdrawals are internal wealth reallocations,
 not operational expenses, and must NOT reduce the net balance.';


-- ============================================================
-- 2. get_user_summary_report
--    Used by: super-admin user summary views, PDF exports
--
--    total_cash_out = ALL cash-outs incl. Reserve (display)
--    net_balance    = cash_in − OPERATIONAL cash-outs only
--                    (Reserve Investment Withdrawals EXCLUDED)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_summary_report(
  month_filter INTEGER DEFAULT NULL,
  year_filter  INTEGER DEFAULT NULL
)
RETURNS TABLE (
  user_id           UUID,
  username          TEXT,
  email             TEXT,
  total_cash_in     NUMERIC,
  total_cash_out    NUMERIC,
  net_balance       NUMERIC,
  transaction_count BIGINT,
  first_transaction TIMESTAMP WITH TIME ZONE,
  last_transaction  TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_list AS (
    SELECT u.id, u.username, u.email FROM public.users u
  ),
  aggregated_stats AS (
    SELECT
      COALESCE(t.added_by_user_id, '00000000-0000-0000-0000-000000000000'::UUID) AS uid,
      t.added_by AS uname,
      -- Cash in total
      SUM(CASE WHEN t.type = 'cash-in' THEN COALESCE(t.amount, 0) ELSE 0 END) AS in_sum,
      -- Total cash out (includes reserve) — for display
      SUM(CASE WHEN t.type = 'cash-out' THEN ABS(COALESCE(t.amount, 0)) ELSE 0 END) AS out_sum,
      -- Operational cash out (excludes reserve) — for net balance
      SUM(
        CASE
          WHEN t.type = 'cash-out'
           AND (t.category_name IS NULL OR t.category_name <> 'Reserve Investment Withdrawal')
          THEN ABS(COALESCE(t.amount, 0))
          ELSE 0
        END
      ) AS op_out_sum,
      COUNT(t.id)       AS t_count,
      MIN(t.created_at) AS first_t,
      MAX(t.created_at) AS last_t
    FROM public.transactions t
    WHERE
      (month_filter IS NULL
       OR (
         EXTRACT(MONTH FROM t.date::DATE) = month_filter
         AND EXTRACT(YEAR  FROM t.date::DATE) = year_filter
       )
      )
    GROUP BY
      COALESCE(t.added_by_user_id, '00000000-0000-0000-0000-000000000000'::UUID),
      t.added_by
  ),
  combined_data AS (
    -- Registered users with matching stats
    SELECT
      l.id       AS l_id,
      l.username AS l_username,
      l.email    AS l_email,
      a.in_sum, a.out_sum, a.op_out_sum, a.t_count, a.first_t, a.last_t
    FROM user_list l
    LEFT JOIN aggregated_stats a ON (l.id = a.uid OR l.username = a.uname)

    UNION

    -- Legacy / orphaned stats entries not in user_list
    SELECT
      a.uid    AS l_id,
      a.uname  AS l_username,
      NULL     AS l_email,
      a.in_sum, a.out_sum, a.op_out_sum, a.t_count, a.first_t, a.last_t
    FROM aggregated_stats a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_list l2
      WHERE l2.id = a.uid OR l2.username = a.uname
    )
  )
  SELECT
    l_id                                            AS user_id,
    l_username                                      AS username,
    l_email                                         AS email,
    COALESCE(SUM(in_sum),  0)                       AS total_cash_in,
    COALESCE(SUM(out_sum), 0)                       AS total_cash_out,   -- incl. reserve (display)
    -- net_balance: operational only, reserve withdrawals excluded
    (COALESCE(SUM(in_sum), 0) - COALESCE(SUM(op_out_sum), 0)) AS net_balance,
    COALESCE(SUM(t_count), 0)::BIGINT              AS transaction_count,
    MIN(first_t)                                    AS first_transaction,
    MAX(last_t)                                     AS last_transaction
  FROM combined_data
  GROUP BY l_id, l_username, l_email
  ORDER BY l_username ASC;
END;
$$;

COMMENT ON FUNCTION public.get_user_summary_report IS
'Per-user cash summary (all-time or monthly).
 total_cash_out INCLUDES Reserve Investment Withdrawals for display.
 net_balance EXCLUDES them — they are internal reallocations, not operational expenses.';


-- ============================================================
-- 3. execute_reserve_withdrawal  (authoritative version)
--    Used by: ReserveInvestmentView → handleWithdraw (DB RPC path)
--
--    Atomically:
--      A. Records in reserve_investment_withdrawals
--      B. Updates allocation.total_withdrawn
--      C. Deducts from reserve_investment_config.total_reserve
--      D. Inserts 'cash-out' transaction with category
--         'Reserve Investment Withdrawal' — this EXACT category name
--         is used by all balance filtering logic above to exclude it
--         from net balance calculations.
--      E. Updates savings_transactions + savings_balance
-- ============================================================
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
  v_global_reserve  NUMERIC := 0;
  v_savings_balance NUMERIC := 0;
  v_new_withdrawn   NUMERIC := 0;
  v_new_global      NUMERIC := 0;
  v_alloc_user_id   UUID;
  v_alloc_username  TEXT;
  v_result          JSONB;
BEGIN
  -- 1. Fetch allocation details
  SELECT
    COALESCE(total_withdrawn, 0),
    COALESCE(allocated_amount, 0),
    user_id,
    user_display_name
  INTO v_alloc_withdrawn, v_alloc_amount, v_alloc_user_id, v_alloc_username
  FROM public.reserve_investment_allocations
  WHERE id = p_alloc_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Allocation not found');
  END IF;

  -- 2. Verify withdrawal does not exceed remaining allocated balance
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

  -- 3. Check global reserve pool has sufficient funds
  SELECT COALESCE(total_reserve, 0)
  INTO v_global_reserve
  FROM public.reserve_investment_config
  WHERE id = 'singleton';

  IF v_global_reserve < p_amount THEN
    RETURN jsonb_build_object(
      'success',        false,
      'message',        'Insufficient global reserve pool funds',
      'global_reserve', v_global_reserve,
      'requested',      p_amount
    );
  END IF;

  -- 4. Get current savings balance for audit trail
  SELECT COALESCE(current_balance, 0)
  INTO v_savings_balance
  FROM public.savings_balance
  LIMIT 1;

  -- Compute new totals
  v_new_withdrawn := v_alloc_withdrawn + p_amount;
  v_new_global    := v_global_reserve  - p_amount;

  -- ─── ATOMIC UPDATES ───────────────────────────────────────────────────────

  -- A. Record the withdrawal in reserve_investment_withdrawals
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
  );

  -- B. Update allocation totals
  UPDATE public.reserve_investment_allocations
  SET total_withdrawn = v_new_withdrawn,
      updated_at      = NOW()
  WHERE id = p_alloc_id;

  -- C. Deduct from global reserve pool
  UPDATE public.reserve_investment_config
  SET total_reserve = v_new_global,
      updated_at    = NOW()
  WHERE id = 'singleton';

  -- D. Insert into main transactions table as 'cash-out' with the
  --    EXACT category 'Reserve Investment Withdrawal'.
  --    *** This is the key: category_name MUST be exactly this string ***
  --    All balance functions filter it OUT of net balance calculations.
  --    It still APPEARS in Cash Out totals for display/history.
  INSERT INTO public.transactions (
    date, time, type, category_name, amount,
    customer_name, added_by, added_by_user_id,
    details, number_of_pictures, whatsapp_number
  ) VALUES (
    p_today_date, CURRENT_TIME,
    'cash-out',
    'Reserve Investment Withdrawal',   -- ← EXACT category name used by all filters
    p_amount,
    p_username, p_username, p_user_id,
    'Reserve Investment Withdrawal: ' || COALESCE(p_description, 'Withdrawal') || ' — ' || p_username || '.',
    0, ''
  );

  -- E. Record in savings_transactions for savings history
  INSERT INTO public.savings_transactions (
    action_type, amount, description,
    initiating_user, initiating_user_id,
    balance_before, balance_after,
    date, created_at
  ) VALUES (
    'withdrawal',
    p_amount,
    'Reserve Investment: ' || COALESCE(p_description, 'Withdrawal') || ' - ' || p_username,
    p_username, p_user_id,
    v_savings_balance,
    GREATEST(0, v_savings_balance - p_amount),
    p_today_date, NOW()
  );

  -- F. Update savings balance singleton
  UPDATE public.savings_balance
  SET current_balance = GREATEST(0, COALESCE(current_balance, 0) - p_amount),
      last_updated    = NOW(),
      updated_by      = p_username;

  -- ─── RESULT ───────────────────────────────────────────────────────────────
  v_result := jsonb_build_object(
    'success',             true,
    'message',             'Reserve withdrawal executed successfully',
    'withdrawn_amount',    p_amount,
    'new_total_withdrawn', v_new_withdrawn,
    'new_global_reserve',  v_new_global
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.execute_reserve_withdrawal IS
'Atomic Reserve Investment withdrawal. Records in reserve_investment_withdrawals,
 updates allocation and global pool, inserts a ''cash-out'' transaction with the
 EXACT category ''Reserve Investment Withdrawal'', and updates savings records.

 The category name is used by get_system_balance_status() and get_user_summary_report()
 to EXCLUDE this amount from net balance calculations — it appears in Cash Out
 display totals ONLY, and does NOT reduce any operational net balance.

 This prevents artificial negative balances caused by treating reserve withdrawals
 (which come from savings/vault reserves, not operational inflow) as operational expenses.';
