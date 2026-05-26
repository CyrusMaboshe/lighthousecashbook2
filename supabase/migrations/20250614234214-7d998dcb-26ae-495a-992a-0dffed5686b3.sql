
-- Add RLS policies for the users table to allow proper user management
-- Policy to allow anyone to insert users (needed for registration)
CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT 
  WITH CHECK (true);

-- Policy to allow users to view all users (needed for user management)
CREATE POLICY "Allow viewing users" ON public.users
  FOR SELECT 
  USING (true);

-- Policy to allow updating users
CREATE POLICY "Allow updating users" ON public.users
  FOR UPDATE 
  USING (true);

-- Policy to allow deleting users (except protected admin accounts)
CREATE POLICY "Allow deleting users" ON public.users
  FOR DELETE 
  USING (username NOT IN ('Cyrus Maboshe', 'Admin'));

-- Also add RLS policies for admin_logs table
CREATE POLICY "Allow admin logs insert" ON public.admin_logs
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow admin logs select" ON public.admin_logs
  FOR SELECT 
  USING (true);
