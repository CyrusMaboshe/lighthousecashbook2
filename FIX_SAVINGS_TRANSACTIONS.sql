-- ============================================================
-- QUICK FIX: Savings Transactions Not Showing
-- ============================================================
-- Copy this entire file and run it in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop all existing restrictive policies
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

-- Step 2: Create new permissive policies that allow ALL authenticated users
CREATE POLICY "allow_all_authenticated_select_savings_balance"
  ON public.savings_balance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_authenticated_insert_savings_balance"
  ON public.savings_balance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_update_savings_balance"
  ON public.savings_balance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_select_savings_transactions"
  ON public.savings_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_authenticated_insert_savings_transactions"
  ON public.savings_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.savings_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.savings_balance TO authenticated;
GRANT SELECT, INSERT ON public.savings_transactions TO authenticated;

-- Step 5: Verify (this will show you the active policies)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('savings_balance', 'savings_transactions')
ORDER BY tablename, policyname;
