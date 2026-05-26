-- Add User Access Control Features
-- This migration adds columns and tables for user access control, time-based restrictions, and automatic blocking

-- =====================================================
-- ADD ACCESS CONTROL COLUMNS TO COMPANY USERS
-- =====================================================

-- Add access control columns to mt_company_users table
ALTER TABLE public.mt_company_users 
ADD COLUMN IF NOT EXISTS access_revoked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS access_revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_revoked_reason TEXT,
ADD COLUMN IF NOT EXISTS access_restored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS auto_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS last_access_check TIMESTAMPTZ;

-- Add similar columns to companies table for company-level access control
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS access_revoked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7;

-- =====================================================
-- CREATE USER ACCESS LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.mt_company_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'access_granted',
    'access_revoked', 
    'access_restored',
    'access_expired',
    'payment_required',
    'payment_received',
    'auto_blocked',
    'manual_blocked',
    'expiry_updated',
    'payment_requirement_updated'
  ))
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_access_logs_user_id ON public.user_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_event_type ON public.user_access_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_created_at ON public.user_access_logs(created_at);

-- =====================================================
-- CREATE ACCESS CONTROL FUNCTIONS
-- =====================================================

-- Function to check if a user has access
CREATE OR REPLACE FUNCTION public.check_user_access(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  result JSONB;
BEGIN
  -- Get user record
  SELECT * INTO user_record 
  FROM public.mt_company_users 
  WHERE id = user_id_param;
  
  -- User not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'user_not_found'
    );
  END IF;
  
  -- Check if access is revoked
  IF user_record.access_revoked THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'access_revoked',
      'revoked_at', user_record.access_revoked_at,
      'revoked_reason', user_record.access_revoked_reason
    );
  END IF;
  
  -- Check if user is inactive
  IF NOT user_record.is_active THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'inactive'
    );
  END IF;
  
  -- Check if access has expired
  IF user_record.access_expires_at IS NOT NULL AND user_record.access_expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'expired',
      'expired_at', user_record.access_expires_at
    );
  END IF;
  
  -- Check payment requirements
  IF user_record.payment_required AND user_record.payment_due_date IS NOT NULL THEN
    IF user_record.payment_due_date + INTERVAL '1 day' * COALESCE(user_record.grace_period_days, 7) < NOW() THEN
      RETURN jsonb_build_object(
        'has_access', false,
        'reason', 'payment_overdue',
        'payment_due_date', user_record.payment_due_date,
        'grace_period_ends', user_record.payment_due_date + INTERVAL '1 day' * COALESCE(user_record.grace_period_days, 7)
      );
    END IF;
  END IF;
  
  -- User has access
  RETURN jsonb_build_object(
    'has_access', true,
    'reason', 'active',
    'expires_at', user_record.access_expires_at,
    'payment_due_date', user_record.payment_due_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically block expired users
CREATE OR REPLACE FUNCTION public.auto_block_expired_users()
RETURNS INTEGER AS $$
DECLARE
  blocked_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Block users with expired access
  FOR user_record IN 
    SELECT id, username, email, access_expires_at
    FROM public.mt_company_users 
    WHERE is_active = true 
      AND access_revoked = false
      AND access_expires_at IS NOT NULL 
      AND access_expires_at < NOW()
      AND (auto_blocked = false OR auto_blocked IS NULL)
  LOOP
    -- Block the user
    UPDATE public.mt_company_users 
    SET 
      is_active = false,
      auto_blocked = true,
      auto_blocked_at = NOW(),
      auto_blocked_reason = 'Access expired',
      updated_at = NOW()
    WHERE id = user_record.id;
    
    -- Log the event
    INSERT INTO public.user_access_logs (user_id, event_type, metadata)
    VALUES (
      user_record.id,
      'auto_blocked',
      jsonb_build_object(
        'reason', 'access_expired',
        'expired_at', user_record.access_expires_at,
        'auto_blocked_at', NOW()
      )
    );
    
    blocked_count := blocked_count + 1;
  END LOOP;
  
  -- Block users with overdue payments
  FOR user_record IN 
    SELECT id, username, email, payment_due_date, grace_period_days
    FROM public.mt_company_users 
    WHERE is_active = true 
      AND access_revoked = false
      AND payment_required = true
      AND payment_due_date IS NOT NULL 
      AND payment_due_date + INTERVAL '1 day' * COALESCE(grace_period_days, 7) < NOW()
      AND (auto_blocked = false OR auto_blocked IS NULL)
  LOOP
    -- Block the user
    UPDATE public.mt_company_users 
    SET 
      is_active = false,
      auto_blocked = true,
      auto_blocked_at = NOW(),
      auto_blocked_reason = 'Payment overdue',
      updated_at = NOW()
    WHERE id = user_record.id;
    
    -- Log the event
    INSERT INTO public.user_access_logs (user_id, event_type, metadata)
    VALUES (
      user_record.id,
      'auto_blocked',
      jsonb_build_object(
        'reason', 'payment_overdue',
        'payment_due_date', user_record.payment_due_date,
        'grace_period_days', user_record.grace_period_days,
        'auto_blocked_at', NOW()
      )
    );
    
    blocked_count := blocked_count + 1;
  END LOOP;
  
  RETURN blocked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE AUTOMATIC CLEANUP TRIGGER
-- =====================================================

-- Function to run on user login to check access
CREATE OR REPLACE FUNCTION public.check_user_access_on_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last access check timestamp
  NEW.last_access_check = NOW();
  
  -- If user has expired access, block them
  IF NEW.access_expires_at IS NOT NULL AND NEW.access_expires_at < NOW() THEN
    NEW.is_active = false;
    NEW.auto_blocked = true;
    NEW.auto_blocked_at = NOW();
    NEW.auto_blocked_reason = 'Access expired on login';
    
    -- Log the event
    INSERT INTO public.user_access_logs (user_id, event_type, metadata)
    VALUES (
      NEW.id,
      'auto_blocked',
      jsonb_build_object(
        'reason', 'access_expired_on_login',
        'expired_at', NEW.access_expires_at,
        'blocked_at', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for access check on user updates
DROP TRIGGER IF EXISTS trigger_check_access_on_login ON public.mt_company_users;
CREATE TRIGGER trigger_check_access_on_login
  BEFORE UPDATE ON public.mt_company_users
  FOR EACH ROW
  WHEN (OLD.last_access_check IS DISTINCT FROM NEW.last_access_check)
  EXECUTE FUNCTION public.check_user_access_on_login();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for the new tables and functions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_access_logs TO public;
GRANT EXECUTE ON FUNCTION public.check_user_access TO public;
GRANT EXECUTE ON FUNCTION public.auto_block_expired_users TO public;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for efficient access control queries
CREATE INDEX IF NOT EXISTS idx_mt_company_users_access_expires_at ON public.mt_company_users(access_expires_at) WHERE access_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mt_company_users_payment_due_date ON public.mt_company_users(payment_due_date) WHERE payment_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mt_company_users_access_revoked ON public.mt_company_users(access_revoked) WHERE access_revoked = true;
CREATE INDEX IF NOT EXISTS idx_mt_company_users_auto_blocked ON public.mt_company_users(auto_blocked) WHERE auto_blocked = true;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Set default access granted time for existing users
UPDATE public.mt_company_users 
SET access_granted_at = created_at 
WHERE access_granted_at IS NULL;

-- Log initial setup
INSERT INTO public.user_access_logs (user_id, event_type, metadata)
SELECT 
  id,
  'access_granted',
  jsonb_build_object(
    'reason', 'initial_setup',
    'granted_at', access_granted_at
  )
FROM public.mt_company_users
WHERE access_granted_at IS NOT NULL;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.user_access_logs IS 'Logs all user access control events for auditing and monitoring';
COMMENT ON FUNCTION public.check_user_access IS 'Checks if a user has access based on all access control rules';
COMMENT ON FUNCTION public.auto_block_expired_users IS 'Automatically blocks users with expired access or overdue payments';
COMMENT ON COLUMN public.mt_company_users.access_revoked IS 'Whether user access has been manually revoked by admin';
COMMENT ON COLUMN public.mt_company_users.access_expires_at IS 'When user access expires (automatic blocking)';
COMMENT ON COLUMN public.mt_company_users.payment_required IS 'Whether user must pay to maintain access';
COMMENT ON COLUMN public.mt_company_users.payment_due_date IS 'When payment is due (triggers blocking after grace period)';
COMMENT ON COLUMN public.mt_company_users.grace_period_days IS 'Days after payment due date before auto-blocking';
COMMENT ON COLUMN public.mt_company_users.auto_blocked IS 'Whether user was automatically blocked by the system';
