-- Create function to calculate current savings balance from transactions
-- This ensures the balance is always accurate and reflects the true state

CREATE OR REPLACE FUNCTION public.get_current_savings_balance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_deposits numeric := 0;
  total_withdrawals numeric := 0;
  current_balance numeric := 0;
  last_transaction_date timestamp with time zone;
  transaction_count integer := 0;
BEGIN
  -- Calculate total deposits
  SELECT COALESCE(SUM(amount), 0)
  INTO total_deposits
  FROM public.savings_transactions
  WHERE action_type = 'deposit';

  -- Calculate total withdrawals
  SELECT COALESCE(SUM(amount), 0)
  INTO total_withdrawals
  FROM public.savings_transactions
  WHERE action_type = 'withdrawal';

  -- Calculate current balance
  current_balance := total_deposits - total_withdrawals;

  -- Get last transaction timestamp
  SELECT MAX(created_at)
  INTO last_transaction_date
  FROM public.savings_transactions;

  -- Get transaction count
  SELECT COUNT(*)
  INTO transaction_count
  FROM public.savings_transactions;

  -- Return the calculated balance with metadata
  RETURN jsonb_build_object(
    'current_balance', current_balance,
    'total_deposits', total_deposits,
    'total_withdrawals', total_withdrawals,
    'last_updated', COALESCE(last_transaction_date, NOW()),
    'transaction_count', transaction_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'current_balance', 0,
      'total_deposits', 0,
      'total_withdrawals', 0,
      'last_updated', NOW(),
      'transaction_count', 0,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_savings_balance() TO authenticated;

COMMENT ON FUNCTION public.get_current_savings_balance IS 'Calculates the current savings balance from all transactions: (total deposits) - (total withdrawals)';
