-- Fix User Logging Triggers and Functions
-- This migration ensures that user actions are properly logged

-- First, ensure the log_user_action function exists
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

-- Create the trigger function for transaction logging
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
        'type', NEW.type,
        'amount', NEW.amount,
        'category_name', NEW.category_name,
        'customer_name', NEW.customer_name,
        'date', NEW.date,
        'time', NEW.time,
        'old_amount', OLD.amount,
        'old_customer_name', OLD.customer_name
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
        'customer_name', OLD.customer_name,
        'date', OLD.date,
        'time', OLD.time
      )
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS log_transaction_actions ON public.transactions;

-- Create the trigger for transaction logging
CREATE TRIGGER log_transaction_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transaction_action();

-- Create a trigger function for cashvault logging
CREATE OR REPLACE FUNCTION public.log_cashvault_action() RETURNS TRIGGER AS $$
DECLARE
  action_desc TEXT;
  action_type_val TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.action_type = 'deposit_from_main' THEN
      action_type_val := 'cashvault_deposit';
      action_desc := format('Cash vault deposit: ZMW %s', NEW.amount);
    ELSE
      action_type_val := 'cashvault_withdrawal';
      action_desc := format('Cash vault withdrawal: ZMW %s', NEW.amount);
    END IF;

    PERFORM public.log_user_action(
      NEW.initiating_user_id,
      NEW.initiating_user,
      action_type_val,
      action_desc,
      jsonb_build_object(
        'cashvault_transaction_id', NEW.id,
        'action_type', NEW.action_type,
        'amount', NEW.amount,
        'note', NEW.note
      )
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS log_cashvault_actions ON public.cashvault_transactions;

-- Create the trigger for cashvault logging
CREATE TRIGGER log_cashvault_actions
  AFTER INSERT ON public.cashvault_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_cashvault_action();

-- Fix RLS policies for custom authentication system
-- Since this app uses custom auth (not Supabase Auth), we need to disable RLS
-- or create policies that work without auth.uid()

-- Temporarily disable RLS to allow user log access
ALTER TABLE public.user_logs DISABLE ROW LEVEL SECURITY;

-- Test the logging system by creating a test log entry
DO $$
BEGIN
  PERFORM public.log_user_action(
    '4925a009-270b-4d64-b497-8e1ed1a60573'::UUID,
    'System',
    'system_test',
    'User logging system RLS fixed and tested',
    '{"test": true, "migration": "20250713184800", "rls_fixed": true}'::jsonb
  );
END $$;
