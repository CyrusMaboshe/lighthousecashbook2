-- ============================================================
-- BACKFILL SAVINGS TRANSACTIONS
-- ============================================================
-- This will populate the savings_transactions table from
-- existing transactions in the main transactions table
-- ============================================================

-- Clear existing savings transactions (if any)
TRUNCATE TABLE public.savings_transactions;

-- Backfill from main transactions table
DO $$
DECLARE
  r RECORD;
  running_balance numeric := 0;
  inserted_count integer := 0;
BEGIN
  RAISE NOTICE 'Starting backfill of savings transactions...';
  
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
        COALESCE(r.time, '00:00:00'),
        r.created_at
      );
      
      running_balance := running_balance + r.amount;
      inserted_count := inserted_count + 1;
      
      RAISE NOTICE 'Inserted DEPOSIT: % ZMW from % (balance: %)', r.amount, r.added_by, running_balance;
      
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
        COALESCE(r.time, '00:00:00'),
        r.created_at
      );

      running_balance := running_balance - r.amount;
      inserted_count := inserted_count + 1;
      
      RAISE NOTICE 'Inserted WITHDRAWAL: % ZMW by % (balance: %)', r.amount, r.added_by, running_balance;
    END IF;
  END LOOP;
  
  -- Update or create the savings_balance record
  DELETE FROM public.savings_balance;
  INSERT INTO public.savings_balance (current_balance, last_updated, updated_by)
  VALUES (running_balance, NOW(), 'Backfill Migration');
  
  RAISE NOTICE '✅ Backfill complete!';
  RAISE NOTICE 'Total transactions inserted: %', inserted_count;
  RAISE NOTICE 'Final savings balance: % ZMW', running_balance;
  
END $$;

-- Verify the results
SELECT 
    'Savings Transactions' as table_name,
    COUNT(*) as total_count,
    SUM(CASE WHEN action_type = 'deposit' THEN 1 ELSE 0 END) as deposits,
    SUM(CASE WHEN action_type = 'withdrawal' THEN 1 ELSE 0 END) as withdrawals,
    SUM(CASE WHEN action_type = 'deposit' THEN amount ELSE 0 END) as total_deposits_amount,
    SUM(CASE WHEN action_type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals_amount
FROM public.savings_transactions;

-- Show latest 10 transactions
SELECT 
    action_type,
    amount,
    description,
    initiating_user,
    balance_after,
    date,
    created_at
FROM public.savings_transactions
ORDER BY created_at DESC
LIMIT 10;
