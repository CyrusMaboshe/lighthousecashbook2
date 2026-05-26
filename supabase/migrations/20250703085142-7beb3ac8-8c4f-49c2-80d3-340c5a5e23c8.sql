
-- Create Cashvault balance table to track the secure vault funds
CREATE TABLE public.cashvault_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  updated_by_user_id UUID REFERENCES public.users(id)
);

-- Create Cashvault transactions table to track all vault operations
CREATE TABLE public.cashvault_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME WITHOUT TIME ZONE DEFAULT CURRENT_TIME,
  action_type TEXT NOT NULL, -- 'deposit' (from main), 'withdrawal' (from vault)
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  initiating_user TEXT NOT NULL,
  initiating_user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial balance record
INSERT INTO public.cashvault_balance (current_balance, updated_by, updated_by_user_id)
SELECT 0, 'System', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.cashvault_balance);

-- Enable RLS on both tables
ALTER TABLE public.cashvault_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashvault_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Cashvault balance (admin only)
CREATE POLICY "Only admins can view cashvault balance" ON public.cashvault_balance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update cashvault balance" ON public.cashvault_balance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create RLS policies for Cashvault transactions (admin only)
CREATE POLICY "Only admins can view cashvault transactions" ON public.cashvault_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert cashvault transactions" ON public.cashvault_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cashvault_balance_updated_at
    BEFORE UPDATE ON public.cashvault_balance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cashvault_transactions_updated_at
    BEFORE UPDATE ON public.cashvault_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
