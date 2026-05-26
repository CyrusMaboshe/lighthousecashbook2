
-- Create conversations table to manage chat sessions
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'admin-broadcast')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create conversation participants table
CREATE TABLE conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'moderator')),
  UNIQUE(conversation_id, user_id)
);

-- Update messages table to reference conversations properly
ALTER TABLE messages DROP COLUMN IF EXISTS conversation_id;
ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Add message status tracking
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'notification'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Enable RLS on new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM conversation_participants WHERE conversation_id = id
    )
  );

CREATE POLICY "Admins can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Conversation creators can update their conversations" ON conversations
  FOR UPDATE USING (created_by = auth.uid());

-- RLS policies for conversation participants
CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage conversation participants" ON conversation_participants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_admin = true)
  );

-- Update messages RLS policy to work with new conversation system
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

-- Function to create a direct conversation between two users
CREATE OR REPLACE FUNCTION create_direct_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_uuid UUID;
  existing_conversation UUID;
BEGIN
  -- Check if conversation already exists between these users
  SELECT c.id INTO existing_conversation
  FROM conversations c
  WHERE c.type = 'direct' 
    AND c.id IN (
      SELECT cp1.conversation_id 
      FROM conversation_participants cp1
      JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = user1_id AND cp2.user_id = user2_id
    );
    
  IF existing_conversation IS NOT NULL THEN
    RETURN existing_conversation;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations (type, created_by) 
  VALUES ('direct', user1_id) 
  RETURNING id INTO conversation_uuid;
  
  -- Add both users as participants
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  VALUES 
    (conversation_uuid, user1_id, 'member'),
    (conversation_uuid, user2_id, 'member');
    
  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create group conversation
CREATE OR REPLACE FUNCTION create_group_conversation(creator_id UUID, title TEXT, participant_ids UUID[])
RETURNS UUID AS $$
DECLARE
  conversation_uuid UUID;
  participant_id UUID;
BEGIN
  -- Create new group conversation
  INSERT INTO conversations (type, title, created_by) 
  VALUES ('group', title, creator_id) 
  RETURNING id INTO conversation_uuid;
  
  -- Add creator as admin
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  VALUES (conversation_uuid, creator_id, 'admin');
  
  -- Add other participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    IF participant_id != creator_id THEN
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES (conversation_uuid, participant_id, 'member')
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
