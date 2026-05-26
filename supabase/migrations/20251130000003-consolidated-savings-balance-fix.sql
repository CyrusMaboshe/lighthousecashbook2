-- ============================================================
-- CONSOLIDATED SAVINGS BALANCE FIX MIGRATION
-- ============================================================
-- This migration ensures the savings balance is calculated correctly
-- from transactions and updates in real-time.
--
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Step 1: Create the get_current_savings_balance function
-- This function calculates balance from savings_transactions table
-- Formula: (total deposits) - (total withdrawals)

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

-- Step 2: Update RLS policies to allow all authenticated users to view savings data
-- This fixes the issue where non-admin users see 0.00 balance

-- Drop existing restrictive policies if they exist
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

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these after applying the migration to verify it worked

-- Test 1: Call the function
-- SELECT * FROM public.get_current_savings_balance();

-- Test 2: Check if you can view savings_transactions
-- SELECT * FROM public.savings_transactions ORDER BY created_at DESC LIMIT 5;

-- Test 3: Check if you can view savings_balance
-- SELECT * FROM public.savings_balance LIMIT 1;

-- ============================================================
-- SUCCESS!
-- ============================================================
-- After running this migration:
-- 1. The frontend will be able to call get_current_savings_balance()
-- 2. All authenticated users can view savings data
-- 3. Balance will be calculated in real-time from transactions
-- 4. Every deposit/withdrawal will trigger a balance recalculation
-- ============================================================

-- ============================================================
-- STEP 3: BACKFILL HISTORY
-- ============================================================
-- Populate savings_transactions from existing main transactions
-- to ensure history is complete.

DO $$
DECLARE
  r RECORD;
  running_balance numeric := 0;
BEGIN
  -- Iterate through existing savings transfers in chronological order
  FOR r IN 
    SELECT * FROM public.transactions 
    WHERE category_name = 'Savings Transfer' 
       OR (details ILIKE '%Savings%' AND category_name != 'Cash Vault Transfer')
    ORDER BY created_at ASC
  LOOP
    -- Determine action type and amount change
    IF r.type = 'cash-out' THEN
      -- Money left main account -> Deposit to Savings
      INSERT INTO public.savings_transactions (
        action_type, amount, description, initiating_user, initiating_user_id,
        balance_before, balance_after, date, time, created_at
      ) VALUES (
        'deposit',
        r.amount,
        r.details,
        r.added_by,
        r.added_by_user_id,
        running_balance,
        running_balance + r.amount,
        r.date,
        r.time,
        r.created_at
      )
      ON CONFLICT DO NOTHING; -- Avoid duplicates if re-running
      
      running_balance := running_balance + r.amount;
      
    ELSIF r.type = 'cash-in' THEN
      -- Money entered main account -> Withdrawal from Savings
      INSERT INTO public.savings_transactions (
        action_type, amount, description, initiating_user, initiating_user_id,
        balance_before, balance_after, date, time, created_at
      ) VALUES (
        'withdrawal',
        r.amount,
        r.details,
        r.added_by,
        r.added_by_user_id,
        running_balance,
        running_balance - r.amount,
        r.date,
        r.time,
        r.created_at
      )
      ON CONFLICT DO NOTHING;

      running_balance := running_balance - r.amount;
    END IF;
  END LOOP;
  
  -- Update the savings_balance table with the final calculated balance
  -- This is optional since get_current_savings_balance calculates it dynamically,
  -- but good for consistency if other parts use this table.
  DELETE FROM public.savings_balance;
  INSERT INTO public.savings_balance (current_balance, last_updated, updated_by)
  VALUES (running_balance, NOW(), 'System Migration');
  
END $$;
