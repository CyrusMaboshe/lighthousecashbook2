-- Migration: Expand allocation_percent constraint from 1–50 to 0–100
-- 0 is used as sentinel for "manual amount" mode (allocation_mode = 'amount')
-- 1–100 is the valid range for standard percentage allocations
--
-- ⚠️  RUN THIS IN THE SUPABASE SQL EDITOR:
--     Dashboard → SQL Editor → New Query → paste → Run
--
-- Previous constraint (reserve_investment_allocations_percent_range_check)
-- enforced: allocation_percent >= 1 AND allocation_percent <= 50
-- This blocked admins from saving allocations above 50%.

DO $$
BEGIN
    -- Drop all known constraint name variants to be safe across environments
    ALTER TABLE IF EXISTS reserve_investment_allocations
        DROP CONSTRAINT IF EXISTS reserve_investment_allocations_percent_range_check;

    ALTER TABLE IF EXISTS reserve_investment_allocations
        DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocations;

    ALTER TABLE IF EXISTS reserve_investment_allocations
        DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocation_percent_check;

    ALTER TABLE IF EXISTS reserve_investment_allocations
        DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocations_percent_check;

    ALTER TABLE IF EXISTS reserve_investment_allocations
        DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocations_percent_range_check;

    -- Add the new, correct constraint: 0 (manual amount sentinel) through 100
    ALTER TABLE reserve_investment_allocations
        ADD CONSTRAINT reserve_investment_allocations_percent_range_check
        CHECK (allocation_percent >= 0 AND allocation_percent <= 100);

    RAISE NOTICE 'SUCCESS: allocation_percent constraint updated to allow 0–100.';
END $$;
