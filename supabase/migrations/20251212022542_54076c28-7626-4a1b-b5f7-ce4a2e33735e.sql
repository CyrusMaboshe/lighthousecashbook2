-- Drop the problematic RLS policies causing infinite recursion
DROP POLICY IF EXISTS "Users can view their conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

-- Drop any existing policies on messages that might cause issues
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;

-- Create simple, non-recursive policies for messages (system-wide chat)
CREATE POLICY "Allow all to view messages"
ON public.messages
FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert messages"
ON public.messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all to update messages"
ON public.messages
FOR UPDATE
USING (true);

-- Create simple policies for conversation_participants
DROP POLICY IF EXISTS "Allow all to view participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Allow all to insert participants" ON public.conversation_participants;

CREATE POLICY "Allow all to view participants"
ON public.conversation_participants
FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (true);

-- Ensure conversations table has proper policies
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all to view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all to insert conversations" ON public.conversations;

CREATE POLICY "Allow all to view conversations"
ON public.conversations
FOR SELECT
USING (true);

CREATE POLICY "Allow all to insert conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);