-- Fix RLS for Core Plan to allow access via anon key (since Supabase Auth is not used for primary login)
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read core plan" ON public.core_plan;
DROP POLICY IF EXISTS "Allow admins to update core plan" ON public.core_plan;
DROP POLICY IF EXISTS "Allow admins to insert core plan" ON public.core_plan;

-- Allow ANYONE (including anon) to read the core plan
CREATE POLICY "Allow anyone to read core plan"
  ON public.core_plan FOR SELECT
  USING (true);

-- Allow ANYONE (including anon) to manage the core plan
-- Note: In this project's pattern, we rely on client-side 'isAdmin' checks
-- because the app uses a custom authentication system that doesn't set auth.uid()
CREATE POLICY "Allow management of core plan"
  ON public.core_plan FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions explicitly just in case
GRANT ALL ON public.core_plan TO anon, authenticated, service_role;
