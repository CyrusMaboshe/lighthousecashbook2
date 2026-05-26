-- Fix RLS policies to allow all authenticated users to view savings balance and transactions
-- This resolves the issue where non-admin users see 0.00 balance despite successful deposits

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view savings balance" ON public.savings_balance;
DROP POLICY IF EXISTS "Admins can view savings transactions" ON public.savings_transactions;

-- Create new permissive policies for viewing (SELECT)
CREATE POLICY "Authenticated users can view savings balance"
  ON public.savings_balance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view savings transactions"
  ON public.savings_transactions FOR SELECT
  TO authenticated
  USING (true);

-- Ensure the tables are enabled for RLS (idempotent)
ALTER TABLE public.savings_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;
