
-- Ensure the users table has an email column (it should already exist based on schema)
-- Add email column if it doesn't exist (this will be ignored if it already exists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;

-- Make sure email is unique if not already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'users_email_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END
$$;

-- Create an index on email for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
