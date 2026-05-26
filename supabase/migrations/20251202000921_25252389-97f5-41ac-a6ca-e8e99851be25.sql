-- Fix RLS policies for savings_transactions to allow proper SELECT access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "allow_all_authenticated_select_savings_transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "policy_allow_select_savings_transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "allow_all_authenticated_insert_savings_transactions" ON public.savings_transactions;
DROP POLICY IF EXISTS "policy_allow_insert_savings_transactions" ON public.savings_transactions;

-- Create new comprehensive policies that allow all operations
CREATE POLICY "allow_all_select_savings_transactions" 
  ON public.savings_transactions 
  FOR SELECT 
  USING (true);

CREATE POLICY "allow_all_insert_savings_transactions" 
  ON public.savings_transactions 
  FOR INSERT 
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;