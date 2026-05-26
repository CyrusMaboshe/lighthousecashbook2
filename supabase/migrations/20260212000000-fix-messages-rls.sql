
-- Ensure RLS is enabled on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;

-- Policy: Anyone authenticated can view messages
CREATE POLICY "Anyone can view messages" ON public.messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Anyone authenticated can insert messages
CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_user_id OR sender_user_id IS NULL OR (auth.jwt() ->> 'role') = 'admin');

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_user_id OR (auth.jwt() ->> 'user_role') = 'admin' OR (auth.jwt() ->> 'role') = 'admin');

-- Ensure realtime is enabled for messages
DO $$
BEGIN
    ALTER TABLE public.messages REPLICA IDENTITY FULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Add to publication if not already there
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
