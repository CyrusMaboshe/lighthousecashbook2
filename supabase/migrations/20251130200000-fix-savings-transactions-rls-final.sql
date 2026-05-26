-- ============================================================
-- FIX SAVINGS TRANSACTIONS RLS POLICIES
-- ============================================================
-- This migration ensures ALL authenticated users can view
-- savings transactions and balance, not just admins.
-- ============================================================

-- Step 1: Drop ALL existing policies on savings tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on savings_balance
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'savings_balance' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.savings_balance';
    END LOOP;
    
    -- Drop all policies on savings_transactions
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'savings_transactions' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.savings_transactions';
    END LOOP;
END $$;

-- Step 2: Create new permissive policies for ALL authenticated users

-- Savings Balance Policies
CREATE POLICY "All authenticated users can view savings balance"
  ON public.savings_balance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can insert savings balance"
  ON public.savings_balance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "All authenticated users can update savings balance"
  ON public.savings_balance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Savings Transactions Policies
CREATE POLICY "All authenticated users can view savings transactions"
  ON public.savings_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can insert savings transactions"
  ON public.savings_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 3: Ensure RLS is enabled (idempotent)
ALTER TABLE public.savings_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.savings_balance TO authenticated;
GRANT SELECT, INSERT ON public.savings_transactions TO authenticated;

-- Verification query (commented out - uncomment to test)
-- SELECT * FROM pg_policies WHERE tablename IN ('savings_balance', 'savings_transactions') AND schemaname = 'public';

COMMENT ON POLICY "All authenticated users can view savings balance" ON public.savings_balance 
  IS 'Allows all authenticated users to view the savings balance';
COMMENT ON POLICY "All authenticated users can view savings transactions" ON public.savings_transactions 
  IS 'Allows all authenticated users to view savings transaction history';
