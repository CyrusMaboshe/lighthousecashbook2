-- Create a comprehensive user summary report function
-- This handles both all-time and monthly summaries for all users
-- Fixes the 1000-row limit inaccuracy in frontend calculations

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
    -- We include transactions grouped by user
    SELECT 
      COALESCE(t.added_by_user_id, '00000000-0000-0000-0000-000000000000'::UUID) as uid,
      t.added_by as uname,
      SUM(CASE WHEN t.type = 'cash-in' THEN COALESCE(t.amount, 0) ELSE 0 END) as in_sum,
      SUM(CASE WHEN t.type = 'cash-out' THEN ABS(COALESCE(t.amount, 0)) ELSE 0 END) as out_sum,
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
    (COALESCE(SUM(in_sum), 0) - COALESCE(SUM(out_sum), 0)) as net_balance,
    COALESCE(SUM(t_count), 0)::BIGINT as transaction_count,
    MIN(first_t) as first_transaction,
    MAX(last_t) as last_transaction
  FROM combined_data
  GROUP BY l_id, l_username, l_email
  ORDER BY l_username ASC;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_summary_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_summary_report TO service_role;

COMMENT ON FUNCTION public.get_user_summary_report IS 'Calculates accurate user-wise cash summaries (all-time or monthly) directly in the database to avoid frontend record limits.';
