-- Migration: Add get_mt_company_period_stats database function for optimized stats calculation
-- Path: supabase/migrations/20260530000002-add-mt-period-stats.sql

CREATE OR REPLACE FUNCTION public.get_mt_company_period_stats(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  total_cash_in NUMERIC,
  total_cash_out NUMERIC,
  net_balance NUMERIC,
  total_pictures INTEGER,
  total_transactions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN t.type = 'cash-in' THEN t.amount ELSE 0 END), 0) as total_cash_in,
    COALESCE(SUM(CASE WHEN t.type = 'cash-out' THEN t.amount ELSE 0 END), 0) as total_cash_out,
    COALESCE(SUM(CASE WHEN t.type = 'cash-in' THEN t.amount ELSE -t.amount END), 0) as net_balance,
    COALESCE(SUM(t.number_of_pictures), 0)::INTEGER as total_pictures,
    COUNT(*)::INTEGER as total_transactions
  FROM public.mt_company_transactions t
  WHERE t.company_id = p_company_id
    AND t.date >= p_start_date
    AND t.date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
