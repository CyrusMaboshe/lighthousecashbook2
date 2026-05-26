-- Add allocated_amount column to lock the admin-allocated amount as a snapshot
ALTER TABLE public.reserve_investment_allocations 
ADD COLUMN IF NOT EXISTS allocated_amount numeric;

COMMENT ON COLUMN public.reserve_investment_allocations.allocated_amount IS 
'Locked snapshot of the amount admin allocated to this user. When set, this is the canonical user-visible amount used by both admin and user views (instead of computing percent × live pool). Falls back to computed value when null for backward compatibility.';