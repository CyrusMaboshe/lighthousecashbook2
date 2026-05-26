-- Create user_targets table for personal financial goals
CREATE TABLE IF NOT EXISTS public.user_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create user_todos table for personal task management
CREATE TABLE IF NOT EXISTS public.user_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on both tables
ALTER TABLE public.user_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_todos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_targets - users can manage their own targets
CREATE POLICY "Users can view their own targets" 
  ON public.user_targets FOR SELECT 
  USING (user_id IN (SELECT id FROM public.users WHERE id = user_targets.user_id));

CREATE POLICY "Users can create their own targets" 
  ON public.user_targets FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE id = user_targets.user_id));

CREATE POLICY "Users can update their own targets" 
  ON public.user_targets FOR UPDATE 
  USING (user_id IN (SELECT id FROM public.users WHERE id = user_targets.user_id));

CREATE POLICY "Users can delete their own targets" 
  ON public.user_targets FOR DELETE 
  USING (user_id IN (SELECT id FROM public.users WHERE id = user_targets.user_id));

-- RLS Policies for user_todos - users can manage their own todos
CREATE POLICY "Users can view their own todos" 
  ON public.user_todos FOR SELECT 
  USING (user_id IN (SELECT id FROM public.users WHERE id = user_todos.user_id));

CREATE POLICY "Users can create their own todos" 
  ON public.user_todos FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE id = user_todos.user_id));

CREATE POLICY "Users can update their own todos" 
  ON public.user_todos FOR UPDATE 
  USING (user_id IN (SELECT id FROM public.users WHERE id = user_todos.user_id));

CREATE POLICY "Users can delete their own todos" 
  ON public.user_todos FOR DELETE 
  USING (user_id IN (SELECT id FROM public.users WHERE id = user_todos.user_id));

-- Create indexes for better performance
CREATE INDEX idx_user_targets_user_id ON public.user_targets(user_id);
CREATE INDEX idx_user_targets_status ON public.user_targets(status);
CREATE INDEX idx_user_todos_user_id ON public.user_todos(user_id);
CREATE INDEX idx_user_todos_status ON public.user_todos(status);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_targets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_todos;