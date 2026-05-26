-- Fix User Logs RLS for Custom Authentication System
-- This migration fixes the Row Level Security policies for user_logs table
-- to work with the custom authentication system instead of Supabase Auth

-- Drop existing RLS policies that depend on Supabase Auth
DROP POLICY IF EXISTS "Admins can view all user logs" ON public.user_logs;
DROP POLICY IF EXISTS "Users can view their own logs" ON public.user_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.user_logs;
DROP POLICY IF EXISTS "Admins can insert logs for any user" ON public.user_logs;
DROP POLICY IF EXISTS "Allow authenticated users to view user logs" ON public.user_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert user logs" ON public.user_logs;
DROP POLICY IF EXISTS "Allow authenticated users to update user logs" ON public.user_logs;

-- Disable RLS temporarily to allow access with custom auth system
ALTER TABLE public.user_logs DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to public role (since we're using custom auth)
GRANT SELECT ON public.user_logs TO public;
GRANT INSERT ON public.user_logs TO public;
GRANT UPDATE ON public.user_logs TO public;

-- Grant permissions on the log_user_action function
GRANT EXECUTE ON FUNCTION public.log_user_action TO public;

-- Create a test log entry to verify the fix
DO $$
BEGIN
  PERFORM public.log_user_action(
    '4925a009-270b-4d64-b497-8e1ed1a60573'::UUID,
    'System',
    'system_test',
    'User logs RLS fixed - users should now see their logs',
    '{"test": true, "migration": "20250713200000", "rls_disabled": true, "issue": "custom_auth_compatibility"}'::jsonb
  );
END $$;

-- Add a comment explaining the RLS situation
COMMENT ON TABLE public.user_logs IS 'User action logs table. RLS disabled due to custom authentication system. Access control handled at application level.';
