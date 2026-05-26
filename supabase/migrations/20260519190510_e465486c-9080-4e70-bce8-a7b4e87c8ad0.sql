-- Expand allocation_percent to 0..100 (0 = manual amount mode)
ALTER TABLE public.reserve_investment_allocations
  DROP CONSTRAINT IF EXISTS reserve_investment_allocations_allocation_percent_check;
ALTER TABLE public.reserve_investment_allocations
  ADD CONSTRAINT reserve_investment_allocations_allocation_percent_check
  CHECK (allocation_percent >= 0 AND allocation_percent <= 100);

-- Allow savings_percent across full 0..100 range with no fixed value
ALTER TABLE public.reserve_investment_config
  DROP CONSTRAINT IF EXISTS reserve_investment_config_savings_percent_check;
ALTER TABLE public.reserve_investment_config
  ADD CONSTRAINT reserve_investment_config_savings_percent_check
  CHECK (savings_percent >= 0 AND savings_percent <= 100);

-- Optional manual override amount for studio savings
ALTER TABLE public.reserve_investment_config
  ADD COLUMN IF NOT EXISTS manual_studio_amount NUMERIC;