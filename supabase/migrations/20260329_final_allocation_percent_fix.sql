-- Migration: Final and permanent fix for Reserve Investment allocation_percent constraint
-- This migration drops the old restricted constraint (50, 30, 20, 15) and replaces it with 1-50%
-- It handles multiple potential constraint names to ensure the fix is applied regardless of how Postgres named it.

DO $$
BEGIN
    -- 1. Drop the restricted constraint (IN list) regardless of its name
    -- We try to drop all variations known to have been used or auto-generated
    
    -- This was the name in the user's error report
    ALTER TABLE IF EXISTS reserve_investment_allocations 
    DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocations_percent_check;
    
    -- This is the standard auto-generated name if the column is allocation_percent
    ALTER TABLE IF EXISTS reserve_investment_allocations 
    DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocation_percent_check;
    
    -- This was used in a previous migration attempt
    ALTER TABLE IF EXISTS reserve_investment_allocations 
    DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocations;
    
    -- Any other potential variant
    ALTER TABLE IF EXISTS reserve_investment_allocations 
    DROP CONSTRAINT IF EXISTS reserve_investment_allocations_percent_check;

    -- 2. Add the correct, permanent constraint
    -- Allows any number (including decimals if the schema permits) between 1 and 50
    ALTER TABLE reserve_investment_allocations
    ADD CONSTRAINT reserve_investment_allocations_percent_range_check
    CHECK (allocation_percent >= 1 AND allocation_percent <= 50);

END $$;
