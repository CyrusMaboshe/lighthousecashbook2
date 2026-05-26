-- Migration: Expand allocation_percent constraint to allow 1% through 50%
-- Previous constraint only allowed IN (50, 30, 20, 15)
-- New constraint allows any integer from 1 to 50 inclusive

ALTER TABLE reserve_investment_allocations
    DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocations;

ALTER TABLE reserve_investment_allocations
    ADD CONSTRAINT reserve_investment_allocations_allocations
    CHECK (allocation_percent >= 1 AND allocation_percent <= 50);
