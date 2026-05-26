-- Migration: Add max_allocation to reserve_investment_allocations
ALTER TABLE reserve_investment_allocations 
ADD COLUMN IF NOT EXISTS max_allocation NUMERIC(18, 2) DEFAULT NULL;

COMMENT ON COLUMN reserve_investment_allocations.max_allocation IS 'Maximum amount cap for this user allocation. Redistribution occurs once reached.';
