-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Admins can view all preferences" ON public.user_preferences;

-- Create simplified policies that work with username-based auth
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  FOR ALL
  USING (username = current_user OR username IN (
    SELECT u.username FROM public.users u WHERE u.id = user_id
  ))
  WITH CHECK (username = current_user OR username IN (
    SELECT u.username FROM public.users u WHERE u.id = user_id  
  ));

-- Allow authentication bypass for service role
CREATE POLICY "Service role can do anything"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
