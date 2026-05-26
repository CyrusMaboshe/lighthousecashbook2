-- =======================================================
-- PASTE THIS INTO SUPABASE SQL EDITOR AND CLICK RUN
-- supabase.com → Project → SQL Editor → New Query → Run
-- =======================================================

-- STEP 1: Delete all test/diagnostic EF transactions EXCEPT the 210 ZMW one
DELETE FROM public.emergency_fund_transactions
WHERE note IN (
  'test entry',
  'Test Deposit from Script',
  'Withdrawal from Emergency Fund',
  'withdrawal test amount',
  'System connectivity test',
  'Test 210 deposit diagnostic',
  '__balance_correction__',
  'System balance sync',
  'Balance correction',
  'Deposit from main'
)
AND amount != 210;

-- STEP 2: Fix the note on the 210 ZMW transaction to be clean
UPDATE public.emergency_fund_transactions
SET 
  note = 'Deposit to Emergency Fund',
  initiating_user = 'Admin User'
WHERE amount = 210;

-- STEP 3: Remove any paired test main-account transactions
DELETE FROM public.transactions
WHERE category_name = 'Emergency Fund Transfer'
  AND (
    details ILIKE '%test entry%'
    OR details ILIKE '%Test Deposit from Script%'
    OR details ILIKE '%System connectivity test%'
    OR details ILIKE '%Test 210%'
    OR details ILIKE '%balance_correction%'
    OR details ILIKE '%withdrawal test%'
  );

-- STEP 4: Set the balance to exactly 210
UPDATE public.emergency_fund_balance
SET 
  current_balance = 210,
  updated_by = 'Admin User',
  last_updated = NOW();

-- STEP 5: Verify the final state
SELECT 'BALANCE' as check_type, current_balance, updated_by, last_updated
FROM public.emergency_fund_balance;

SELECT 'TRANSACTIONS' as check_type, action_type, amount, note, initiating_user, created_at
FROM public.emergency_fund_transactions
ORDER BY created_at DESC;
