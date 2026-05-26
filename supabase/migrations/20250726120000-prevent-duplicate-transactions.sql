-- Migration to prevent duplicate transactions in mt_company_transactions table
-- This adds constraints and indexes to ensure only one transaction per unique combination

-- =====================================================
-- ADD UNIQUE CONSTRAINT TO PREVENT DUPLICATES
-- =====================================================

-- Create a unique index to prevent duplicate transactions
-- This prevents the same user from creating identical transactions within a short time window
CREATE UNIQUE INDEX IF NOT EXISTS idx_mt_company_transactions_unique_recent
ON public.mt_company_transactions (
  company_id, 
  added_by_user_id, 
  type, 
  amount, 
  customer_name,
  date_trunc('minute', created_at)
) WHERE type = 'cash-in';

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_mt_company_transactions_unique_recent IS 
'Prevents duplicate cash-in transactions from the same user with identical details within the same minute';

-- =====================================================
-- CREATE FUNCTION TO PREVENT RAPID DUPLICATES
-- =====================================================

-- Function to check for recent duplicate transactions
CREATE OR REPLACE FUNCTION public.check_duplicate_transaction()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Only check for cash-in transactions
  IF NEW.type = 'cash-in' THEN
    -- Check for identical transactions in the last 30 seconds
    SELECT COUNT(*) INTO duplicate_count
    FROM public.mt_company_transactions
    WHERE company_id = NEW.company_id
      AND added_by_user_id = NEW.added_by_user_id
      AND type = NEW.type
      AND amount = NEW.amount
      AND customer_name = NEW.customer_name
      AND created_at > (NOW() - INTERVAL '30 seconds');
    
    -- If duplicates found, prevent insertion
    IF duplicate_count > 0 THEN
      RAISE EXCEPTION 'Duplicate transaction detected. Please wait before creating another identical transaction.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGER TO PREVENT DUPLICATES
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_duplicate_transactions ON public.mt_company_transactions;

-- Create trigger to prevent duplicate transactions
CREATE TRIGGER prevent_duplicate_transactions
  BEFORE INSERT ON public.mt_company_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_transaction();

-- =====================================================
-- ADD LOGGING FOR DUPLICATE ATTEMPTS
-- =====================================================

-- Function to log duplicate transaction attempts
CREATE OR REPLACE FUNCTION public.log_duplicate_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the duplicate attempt for debugging
  INSERT INTO public.mt_company_admin_logs (
    company_id,
    user_id,
    username,
    action,
    details
  ) VALUES (
    NEW.company_id,
    NEW.added_by_user_id,
    NEW.added_by,
    'duplicate_transaction_prevented',
    jsonb_build_object(
      'type', NEW.type,
      'amount', NEW.amount,
      'customer_name', NEW.customer_name,
      'attempted_at', NOW()
    )
  );
  
  RETURN NULL; -- Don't insert the duplicate
EXCEPTION
  WHEN OTHERS THEN
    -- If logging fails, still prevent the duplicate
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Index for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_mt_company_transactions_duplicate_check
ON public.mt_company_transactions (
  company_id, 
  added_by_user_id, 
  type, 
  amount, 
  customer_name, 
  created_at DESC
) WHERE type = 'cash-in';

-- Index for recent transactions lookup
CREATE INDEX IF NOT EXISTS idx_mt_company_transactions_recent
ON public.mt_company_transactions (created_at DESC)
WHERE created_at > (NOW() - INTERVAL '1 hour');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.check_duplicate_transaction() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_duplicate_attempt() TO authenticated;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.check_duplicate_transaction() IS 
'Prevents duplicate cash-in transactions from the same user within 30 seconds';

COMMENT ON TRIGGER prevent_duplicate_transactions ON public.mt_company_transactions IS 
'Trigger to prevent duplicate cash-in transactions and maintain data integrity';
