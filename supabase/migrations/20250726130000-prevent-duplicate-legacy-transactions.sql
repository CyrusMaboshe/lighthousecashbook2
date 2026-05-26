-- Migration to prevent duplicate transactions in legacy transactions table
-- This adds constraints and indexes to ensure only one transaction per unique combination

-- =====================================================
-- ADD UNIQUE CONSTRAINT TO PREVENT DUPLICATES
-- =====================================================

-- Create a unique index to prevent duplicate transactions in legacy table
-- This prevents the same user from creating identical transactions within a short time window
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_recent
ON public.transactions (
  added_by_user_id, 
  type, 
  amount, 
  customer_name,
  date_trunc('minute', created_at)
) WHERE type = 'cash-in' AND added_by_user_id IS NOT NULL;

-- Add a comment explaining the constraint
COMMENT ON INDEX idx_transactions_unique_recent IS 
'Prevents duplicate cash-in transactions from the same user with identical details within the same minute';

-- =====================================================
-- CREATE FUNCTION TO PREVENT RAPID DUPLICATES
-- =====================================================

-- Function to check for recent duplicate transactions in legacy table
CREATE OR REPLACE FUNCTION public.check_duplicate_legacy_transaction()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Only check for cash-in transactions with valid user ID
  IF NEW.type = 'cash-in' AND NEW.added_by_user_id IS NOT NULL THEN
    -- Check for identical transactions in the last 30 seconds
    SELECT COUNT(*) INTO duplicate_count
    FROM public.transactions
    WHERE added_by_user_id = NEW.added_by_user_id
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
DROP TRIGGER IF EXISTS prevent_duplicate_legacy_transactions ON public.transactions;

-- Create trigger to prevent duplicate transactions
CREATE TRIGGER prevent_duplicate_legacy_transactions
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_legacy_transaction();

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Index for faster duplicate checking in legacy table
CREATE INDEX IF NOT EXISTS idx_transactions_duplicate_check
ON public.transactions (
  added_by_user_id, 
  type, 
  amount, 
  customer_name, 
  created_at DESC
) WHERE type = 'cash-in' AND added_by_user_id IS NOT NULL;

-- Index for recent transactions lookup in legacy table
CREATE INDEX IF NOT EXISTS idx_transactions_recent
ON public.transactions (created_at DESC)
WHERE created_at > (NOW() - INTERVAL '1 hour');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.check_duplicate_legacy_transaction() TO authenticated;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION public.check_duplicate_legacy_transaction() IS 
'Prevents duplicate cash-in transactions from the same user within 30 seconds in legacy transactions table';

COMMENT ON TRIGGER prevent_duplicate_legacy_transactions ON public.transactions IS 
'Trigger to prevent duplicate cash-in transactions in legacy table and maintain data integrity';
