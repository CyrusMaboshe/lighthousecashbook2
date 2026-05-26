-- Emergency Fund Diagnostic Query
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if tables exist
SELECT 
    'emergency_fund_balance' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'emergency_fund_balance'
    ) as exists;

SELECT 
    'emergency_fund_transactions' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'emergency_fund_transactions'
    ) as exists;

-- 2. Check if functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%emergency_fund%';

-- 3. Check current balance (if table exists)
SELECT * FROM public.emergency_fund_balance;

-- 4. Check transactions (if table exists)
SELECT * FROM public.emergency_fund_transactions
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('emergency_fund_balance', 'emergency_fund_transactions');
