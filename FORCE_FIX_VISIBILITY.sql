-- ============================================================
-- FORCE FIX VISIBILITY (Aggressive)
-- ============================================================
-- This script will force the savings transactions to be visible
-- by resetting the security policies completely.
-- ============================================================

BEGIN;

-- 1. Temporarily disable RLS to clear any weird state
ALTER TABLE public.savings_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_balance DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies (to be absolutely sure)
DROP POLICY IF EXISTS "Admins can view savings balance" ON public.savings_balance;
DROP POLICY IF EXISTS "Admins can insert savings balance" ON public.savings_balance;
DROP POLICY IF EXISTS "Admins can update savings balance" ON public.savings_balance;
DROP POLICY IF EXISTS "Admins can view savings transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "Admins can insert savings transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "Authenticated users can view savings balance" ON public.savings_balance;
DROP POLICY IF EXISTS "Authenticated users can view savings transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "All authenticated users can view savings balance" ON public.savings_balance;
DROP POLICY IF EXISTS "All authenticated users can insert savings balance" ON public.savings_balance;
DROP POLICY IF EXISTS "All authenticated users can update savings balance" ON public.savings_balance;
DROP POLICY IF EXISTS "All authenticated users can view savings transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "All authenticated users can insert savings transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "allow_all_authenticated_select_savings_balance" ON public.savings_balance;
DROP POLICY IF EXISTS "allow_all_authenticated_insert_savings_balance" ON public.savings_balance;
DROP POLICY IF EXISTS "allow_all_authenticated_update_savings_balance" ON public.savings_balance;
DROP POLICY IF EXISTS "allow_all_authenticated_select_savings_transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "allow_all_authenticated_insert_savings_transactions" ON public.savings_transactions;

-- 3. Re-enable RLS
ALTER TABLE public.savings_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, permissive policies for ALL authenticated users
CREATE POLICY "policy_allow_select_savings_transactions"
  ON public.savings_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "policy_allow_insert_savings_transactions"
  ON public.savings_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "policy_allow_select_savings_balance"
  ON public.savings_balance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "policy_allow_insert_savings_balance"
  ON public.savings_balance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "policy_allow_update_savings_balance"
  ON public.savings_balance FOR UPDATE
  TO authenticated
  USING (true);

-- 5. Grant permissions to the 'authenticated' role explicitly
GRANT ALL ON public.savings_transactions TO authenticated;
GRANT ALL ON public.savings_balance TO authenticated;

COMMIT;

-- Verify
SELECT count(*) as transaction_count FROM public.savings_transactions;
