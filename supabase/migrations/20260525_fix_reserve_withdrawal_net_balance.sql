-- Migration: Bulletproof Reserve Investment Withdrawal Net Balance
-- Rule: Reserve Investment Withdrawals appear in Cash Out (display only).
--       They must NEVER reduce the net balance for any user or the system admin.
--
-- This migration reinforces the logic at the DB level so even if the frontend
-- falls back to raw transaction data, the calculations remain correct.

-- ============================================================
-- 1. get_system_balance_status — Admin system-wide balance
--    total_cash_out  = ALL cash-outs (incl. reserve) — for display
--    net_system_balance = cash_in minus OPERATIONAL cash-outs only
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_system_balance_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_cash_in            NUMERIC := 0;
  total_cash_out           NUMERIC := 0;   -- includes reserve withdrawal (display)
  total_operational_cashout NUMERIC := 0;  -- excludes reserve withdrawal (net balance)
  admin_balance            NUMERIC := 0;
  is_depleted              BOOLEAN := false;
  result                   JSONB;
BEGIN
  -- Compute both cash-out totals in one pass
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN ABS(amount) ELSE 0 END), 0),
    COALESCE(SUM(
      CASE
        WHEN type = 'cash-out'
         AND (category_name IS NULL OR category_name <> 'Reserve Investment Withdrawal')
        THEN ABS(amount)
        ELSE 0
      END
    ), 0)
  INTO total_cash_in, total_cash_out, total_operational_cashout
  FROM public.transactions;

  -- Admin vault balance (used for depletion detection only)
  SELECT COALESCE(current_balance, 0)
  INTO admin_balance
  FROM public.cashvault_balance
  LIMIT 1;

  is_depleted := admin_balance <= 0;

  result := jsonb_build_object(
    'total_cash_in',         total_cash_in,
    'total_cash_out',        total_cash_out,           -- incl. reserve (display)
    'net_system_balance',    total_cash_in - total_operational_cashout,  -- excl. reserve
    'admin_balance',         admin_balance,
    'is_system_depleted',    is_depleted,
    'last_updated',          NOW()
  );

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_system_balance_status() IS
'Returns system-wide balance status. total_cash_out INCLUDES Reserve Investment Withdrawals (display).
net_system_balance EXCLUDES them — reserve withdrawals are internal wealth reallocations,
not operational expenses, so they do not reduce the admin net balance.';


-- ============================================================
-- 2. get_user_summary_report — Per-user report (all-time or monthly)
--    total_cash_out = ALL cash-outs (incl. reserve) — for display
--    net_balance    = cash_in minus OPERATIONAL cash-outs only
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
    COALESCE(SUM(out_sum), 0)                       AS total_cash_out,   -- incl. reserve
    -- net_balance excludes reserve investment withdrawals
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
'Per-user cash summary (all-time or monthly). total_cash_out includes Reserve Investment Withdrawals
for display. net_balance excludes them — they are internal reallocations, not operational expenses.';


-- ============================================================
-- 3. execute_reserve_withdrawal — Atomic withdrawal from reserve
--    Ensures the transaction inserted into public.transactions
--    has category_name = ''Reserve Investment Withdrawal'' so all
--    filtering logic above correctly identifies and excludes it
--    from net balance calculations.
--    Also removes the savings_balance deduction that was causing
--    double-counting when savings pool is used for balance display.
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
  v_new_withdrawn   NUMERIC := 0;
  v_new_global      NUMERIC := 0;
  v_alloc_user_id   UUID;
  v_alloc_username  TEXT;
  result            JSONB;
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

  -- 2. Check withdrawal does not exceed remaining allocated balance
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
  --    This makes it appear in Cash Out totals for display,
  --    but ALL balance functions filter it OUT of net balance calculations.
  INSERT INTO public.transactions (
    date, time, type, category_name, amount,
    customer_name, added_by, added_by_user_id,
    details, number_of_pictures, whatsapp_number
  ) VALUES (
    p_today_date, CURRENT_TIME,
    'cash-out',
    'Reserve Investment Withdrawal',   -- ← exact category name used by all filters
    p_amount,
    p_username, p_username, p_user_id,
    'Reserve Investment Withdrawal: ' || COALESCE(p_description, 'Withdrawal') || ' — ' || p_username || '.',
    0, ''
  );

  -- ─── RESULT ───────────────────────────────────────────────────────────────
  result := jsonb_build_object(
    'success',             true,
    'message',             'Reserve withdrawal executed successfully',
    'withdrawn_amount',    p_amount,
    'new_total_withdrawn', v_new_withdrawn,
    'new_global_reserve',  v_new_global
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.execute_reserve_withdrawal IS
'Atomic Reserve Investment withdrawal. Records in reserve_investment_withdrawals, updates
allocation and global pool, then inserts a ''cash-out'' transaction with category
''Reserve Investment Withdrawal''. This category is filtered from net balance calculations
in get_system_balance_status() and get_user_summary_report() — the withdrawal amount
appears in Cash Out display only and does NOT reduce any net balance.';
