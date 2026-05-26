
-- Create table for tracking user balance overrides
CREATE TABLE public.user_balance_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  original_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  effective_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  override_reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for user balance overrides
ALTER TABLE public.user_balance_overrides ENABLE ROW LEVEL SECURITY;

-- Only admins can view balance overrides
CREATE POLICY "Only admins can view balance overrides" 
  ON public.user_balance_overrides 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Only admins can insert balance overrides
CREATE POLICY "Only admins can insert balance overrides" 
  ON public.user_balance_overrides 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Only admins can update balance overrides
CREATE POLICY "Only admins can update balance overrides" 
  ON public.user_balance_overrides 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role = 'admin'
  ));

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_user_balance_overrides_updated_at
  BEFORE UPDATE ON public.user_balance_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_user_balance_overrides_username_active 
  ON public.user_balance_overrides(username, is_active) 
  WHERE is_active = true;

-- Create function to check system balance status
CREATE OR REPLACE FUNCTION public.get_system_balance_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_cash_in NUMERIC := 0;
  total_cash_out NUMERIC := 0;
  admin_balance NUMERIC := 0;
  is_depleted BOOLEAN := false;
  result JSONB;
BEGIN
  -- Calculate total system cash in/out (use ABS for cash-out to handle both positive and negative amounts)
  SELECT
    COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash-out' THEN ABS(amount) ELSE 0 END), 0)
  INTO total_cash_in, total_cash_out
  FROM public.transactions;
  
  -- Get admin balance from cashvault
  SELECT COALESCE(current_balance, 0)
  INTO admin_balance
  FROM public.cashvault_balance
  LIMIT 1;
  
  -- Determine if system is depleted
  is_depleted := admin_balance <= 0;
  
  -- Build result
  result := jsonb_build_object(
    'total_cash_in', total_cash_in,
    'total_cash_out', total_cash_out,
    'admin_balance', admin_balance,
    'is_depleted', is_depleted,
    'net_system_balance', total_cash_in - total_cash_out
  );
  
  RETURN result;
END;
$$;
