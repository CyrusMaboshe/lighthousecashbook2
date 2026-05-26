
-- Create reserve investment withdrawals table
CREATE TABLE public.reserve_investment_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_display_name TEXT NOT NULL,
    allocation_id UUID REFERENCES public.reserve_investment_allocations(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL DEFAULT 0,
    balance_after NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME WITHOUT TIME ZONE DEFAULT CURRENT_TIME,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reserve_investment_withdrawals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own withdrawals
CREATE POLICY "Users can view own reserve withdrawals"
ON public.reserve_investment_withdrawals
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert withdrawals
CREATE POLICY "Users can insert reserve withdrawals"
ON public.reserve_investment_withdrawals
FOR INSERT
TO public
WITH CHECK (true);

-- Add withdrawn_total column to track total withdrawn per allocation
ALTER TABLE public.reserve_investment_allocations 
ADD COLUMN IF NOT EXISTS total_withdrawn NUMERIC NOT NULL DEFAULT 0;
