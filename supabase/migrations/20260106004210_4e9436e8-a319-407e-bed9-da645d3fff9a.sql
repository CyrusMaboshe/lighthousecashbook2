-- Add is_active column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to be active by default
UPDATE public.users SET is_active = true WHERE is_active IS NULL;

-- Disable RLS on cashvault_transactions (since this app uses custom auth, not Supabase Auth)
ALTER TABLE public.cashvault_transactions DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on messages table for the chat system
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;