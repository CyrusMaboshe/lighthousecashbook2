-- Enable realtime for savings_transactions table
ALTER TABLE public.savings_transactions REPLICA IDENTITY FULL;

-- Add savings_transactions to realtime publication if not already added
DO $$
BEGIN
  -- Check if publication exists and add table if not already present
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add table to publication (will silently succeed if already added)
    ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_transactions;
  END IF;
END $$;