
-- First, let's ensure the transactions table has real-time capabilities
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Add the transactions table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Create an updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since this is an internal business app)
CREATE POLICY "Allow all operations on transactions" ON public.transactions
    FOR ALL USING (true) WITH CHECK (true);
