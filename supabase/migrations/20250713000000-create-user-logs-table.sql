-- Create user_logs table for tracking all user actions
-- This table will store comprehensive logs of user activities for both admin and regular users

CREATE TABLE public.user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'login', 'logout', 'transaction_create', 'transaction_update', 'transaction_delete', 'profile_update', 'view_change', 'export_pdf', etc.
  action_description TEXT NOT NULL, -- Human readable description of the action
  details JSONB DEFAULT '{}', -- Additional structured data about the action
  ip_address TEXT, -- Optional IP address tracking
  user_agent TEXT, -- Optional user agent tracking
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_logs_user_id ON public.user_logs(user_id);
CREATE INDEX idx_user_logs_username ON public.user_logs(username);
CREATE INDEX idx_user_logs_action_type ON public.user_logs(action_type);
CREATE INDEX idx_user_logs_timestamp ON public.user_logs(timestamp DESC);
CREATE INDEX idx_user_logs_created_at ON public.user_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admin users can view all user logs
CREATE POLICY "Admins can view all user logs" ON public.user_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Regular users can only view their own logs
CREATE POLICY "Users can view their own logs" ON public.user_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.id = user_logs.user_id
      AND users.role = 'user'
    )
  );

-- All authenticated users can insert their own logs
CREATE POLICY "Users can insert their own logs" ON public.user_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.id = user_logs.user_id
    )
  );

-- Only admins can insert logs for other users (for system-level logging)
CREATE POLICY "Admins can insert logs for any user" ON public.user_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Enable realtime for user_logs table
ALTER TABLE public.user_logs REPLICA IDENTITY FULL;

-- Add the user_logs table to the realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_logs;
EXCEPTION
    WHEN duplicate_object THEN
        -- Table is already in publication, ignore
        NULL;
END $$;

-- Create a function to automatically log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
  p_user_id UUID,
  p_username TEXT,
  p_action_type TEXT,
  p_action_description TEXT,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.user_logs (
    user_id,
    username,
    action_type,
    action_description,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_username,
    p_action_type,
    p_action_description,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.log_user_action TO authenticated;

-- Create a trigger function to automatically log transaction-related actions
CREATE OR REPLACE FUNCTION public.log_transaction_action() RETURNS TRIGGER AS $$
BEGIN
  -- Log transaction creation
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_user_action(
      NEW.added_by_user_id,
      NEW.added_by,
      'transaction_create',
      format('Created %s transaction: ZMW %s for %s', NEW.type, NEW.amount, NEW.customer_name),
      jsonb_build_object(
        'transaction_id', NEW.id,
        'type', NEW.type,
        'amount', NEW.amount,
        'category_name', NEW.category_name,
        'customer_name', NEW.customer_name,
        'date', NEW.date,
        'time', NEW.time
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log transaction updates
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_user_action(
      NEW.added_by_user_id,
      NEW.added_by,
      'transaction_update',
      format('Updated %s transaction: ZMW %s for %s', NEW.type, NEW.amount, NEW.customer_name),
      jsonb_build_object(
        'transaction_id', NEW.id,
        'old_amount', OLD.amount,
        'new_amount', NEW.amount,
        'old_customer_name', OLD.customer_name,
        'new_customer_name', NEW.customer_name
      )
    );
    RETURN NEW;
  END IF;
  
  -- Log transaction deletions
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_user_action(
      OLD.added_by_user_id,
      OLD.added_by,
      'transaction_delete',
      format('Deleted %s transaction: ZMW %s for %s', OLD.type, OLD.amount, OLD.customer_name),
      jsonb_build_object(
        'transaction_id', OLD.id,
        'type', OLD.type,
        'amount', OLD.amount,
        'category_name', OLD.category_name,
        'customer_name', OLD.customer_name
      )
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic transaction logging
DROP TRIGGER IF EXISTS trigger_log_transaction_actions ON public.transactions;
CREATE TRIGGER trigger_log_transaction_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_action();

-- Insert some sample user logs for testing (optional)
-- These will be removed in production
INSERT INTO public.user_logs (user_id, username, action_type, action_description, details) 
SELECT 
  u.id,
  u.username,
  'system_init',
  'User logs system initialized',
  jsonb_build_object('version', '1.0', 'feature', 'user_action_logging')
FROM public.users u
WHERE u.role IN ('admin', 'user')
LIMIT 5;
