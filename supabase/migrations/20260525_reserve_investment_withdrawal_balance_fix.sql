-- Migration: Reserve Investment Withdrawal Balance Fix
-- Ensure Reserve Investment withdrawals are included in total cash-out totals, but excluded from net/operational balance calculations.

CREATE OR REPLACE FUNCTION public.get_system_balance_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_cash_in NUMERIC := 0;
  total_cash_out NUMERIC := 0;
  total_operational_cash_out NUMERIC := 0;
  admin_balance NUMERIC := 0;
  is_depleted BOOLEAN := false;
  result JSONB;
BEGIN
  -- Calculate total system cash in/out (include all cash-outs, but compute net system balance excluding Reserve Investment withdrawals)
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN ABS(amount) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' AND (category_name IS NULL OR category_name != 'Reserve Investment Withdrawal') THEN ABS(amount) ELSE 0 END), 0)
  INTO total_cash_in, total_cash_out, total_operational_cash_out
  FROM public.transactions;
  
  -- Get admin balance from cashvault
  SELECT COALESCE(current_balance, 0)
  INTO admin_balance
  FROM public.cashvault_balance
  LIMIT 1;
  
  -- Determine if system is depleted
  is_depleted := admin_balance <= 0;
  
  -- Build result object (net_system_balance excludes Reserve Investment Withdrawal)
  result := jsonb_build_object(
    'total_cash_in', total_cash_in,
    'total_cash_out', total_cash_out,
    'net_system_balance', total_cash_in - total_operational_cash_out,
    'admin_balance', admin_balance,
    'is_system_depleted', is_depleted,
    'last_updated', NOW()
  );
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_system_balance_status() IS 'System balance calculation function. Excludes Reserve Investment withdrawals from net balance, but includes them in total_cash_out.';

CREATE OR REPLACE FUNCTION public.get_user_summary_report(
  month_filter INTEGER DEFAULT NULL,
  year_filter INTEGER DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT,
  total_cash_in NUMERIC,
  total_cash_out NUMERIC,
  net_balance NUMERIC,
  transaction_count BIGINT,
  first_transaction TIMESTAMP WITH TIME ZONE,
  last_transaction TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_list AS (
    -- Get all users from the system
    SELECT u.id, u.username, u.email FROM public.users u
  ),
  aggregated_stats AS (
    -- Calculate stats per user
    SELECT 
      COALESCE(t.added_by_user_id, '00000000-0000-0000-0000-000000000000'::UUID) as uid,
      t.added_by as uname,
      SUM(CASE WHEN t.type = 'cash-in' THEN COALESCE(t.amount, 0) ELSE 0 END) as in_sum,
      SUM(CASE WHEN t.type = 'cash-out' THEN ABS(COALESCE(t.amount, 0)) ELSE 0 END) as out_sum,
      SUM(CASE WHEN t.type = 'cash-out' AND (t.category_name IS NULL OR t.category_name != 'Reserve Investment Withdrawal') THEN ABS(COALESCE(t.amount, 0)) ELSE 0 END) as op_out_sum,
      COUNT(t.id) as t_count,
      MIN(t.created_at) as first_t,
      MAX(t.created_at) as last_t
    FROM public.transactions t
    WHERE 
      (month_filter IS NULL OR (EXTRACT(MONTH FROM t.date::DATE) = month_filter AND EXTRACT(YEAR FROM t.date::DATE) = year_filter))
    GROUP BY COALESCE(t.added_by_user_id, '00000000-0000-0000-0000-000000000000'::UUID), t.added_by
  ),
  combined_data AS (
    -- Match aggregated stats with users
    SELECT 
      l.id as l_id,
      l.username as l_username,
      l.email as l_email,
      a.in_sum,
      a.out_sum,
      a.op_out_sum,
      a.t_count,
      a.first_t,
      a.last_t
    FROM user_list l
    LEFT JOIN aggregated_stats a ON (l.id = a.uid OR l.username = a.uname)
    
    UNION
    
    -- Include stats for "users" who don't exist in user_list
    SELECT 
      a.uid as l_id,
      a.uname as l_username,
      NULL as l_email,
      a.in_sum,
      a.out_sum,
      a.op_out_sum,
      a.t_count,
      a.first_t,
      a.last_t
    FROM aggregated_stats a
    WHERE NOT EXISTS (SELECT 1 FROM user_list l2 WHERE l2.id = a.uid OR l2.username = a.uname)
  )
  SELECT 
    l_id as user_id,
    l_username as username,
    l_email as email,
    COALESCE(SUM(in_sum), 0) as total_cash_in,
    COALESCE(SUM(out_sum), 0) as total_cash_out,
    (COALESCE(SUM(in_sum), 0) - COALESCE(SUM(op_out_sum), 0)) as net_balance,
    COALESCE(SUM(t_count), 0)::BIGINT as transaction_count,
    MIN(first_t) as first_transaction,
    MAX(last_t) as last_transaction
  FROM combined_data
  GROUP BY l_id, l_username, l_email
  ORDER BY l_username ASC;
END;
$$;

COMMENT ON FUNCTION public.get_user_summary_report IS 'Calculates user cash summaries (all-time or monthly). Net balance excludes Reserve Investment withdrawals.';
