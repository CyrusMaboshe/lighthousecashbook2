-- Add missing access_expires_at column to mt_company_admins table
-- This fixes the schema cache error when updating company users

-- =====================================================
-- ADD ACCESS CONTROL COLUMNS TO MT_COMPANY_ADMINS
-- =====================================================

-- Add access control columns to mt_company_admins table
ALTER TABLE public.mt_company_admins 
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

-- =====================================================
-- CREATE ADMIN ACCESS LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.mt_company_admins(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_admin_event_type CHECK (event_type IN (
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

-- =====================================================
-- FUNCTIONS FOR ADMIN ACCESS CONTROL
-- =====================================================

-- Function to check admin access
CREATE OR REPLACE FUNCTION public.check_admin_access(admin_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Get admin record
  SELECT * INTO admin_record
  FROM public.mt_company_admins
  WHERE id = admin_id_param;
  
  -- Admin not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'admin_not_found'
    );
  END IF;
  
  -- Check if admin is active
  IF NOT admin_record.is_active THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'admin_inactive'
    );
  END IF;
  
  -- Check if access is manually revoked
  IF admin_record.access_revoked THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'access_revoked',
      'revoked_at', admin_record.access_revoked_at,
      'revoked_reason', admin_record.access_revoked_reason
    );
  END IF;
  
  -- Check if access has expired
  IF admin_record.access_expires_at IS NOT NULL AND admin_record.access_expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'access_expired',
      'expired_at', admin_record.access_expires_at
    );
  END IF;
  
  -- Check payment requirements
  IF admin_record.payment_required AND admin_record.payment_due_date IS NOT NULL THEN
    IF admin_record.payment_due_date + INTERVAL '1 day' * COALESCE(admin_record.grace_period_days, 7) < NOW() THEN
      RETURN jsonb_build_object(
        'has_access', false,
        'reason', 'payment_overdue',
        'payment_due_date', admin_record.payment_due_date,
        'grace_period_ends', admin_record.payment_due_date + INTERVAL '1 day' * COALESCE(admin_record.grace_period_days, 7)
      );
    END IF;
  END IF;
  
  -- Admin has access
  RETURN jsonb_build_object(
    'has_access', true,
    'reason', 'active',
    'expires_at', admin_record.access_expires_at,
    'payment_due_date', admin_record.payment_due_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR EFFICIENT ACCESS CONTROL QUERIES
-- =====================================================

-- Indexes for efficient access control queries
CREATE INDEX IF NOT EXISTS idx_mt_company_admins_access_expires_at ON public.mt_company_admins(access_expires_at) WHERE access_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mt_company_admins_payment_due_date ON public.mt_company_admins(payment_due_date) WHERE payment_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mt_company_admins_access_revoked ON public.mt_company_admins(access_revoked) WHERE access_revoked = true;
CREATE INDEX IF NOT EXISTS idx_mt_company_admins_auto_blocked ON public.mt_company_admins(auto_blocked) WHERE auto_blocked = true;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Set default access granted time for existing admins
UPDATE public.mt_company_admins 
SET access_granted_at = created_at 
WHERE access_granted_at IS NULL;

-- Log initial setup for admins
INSERT INTO public.admin_access_logs (admin_id, event_type, metadata)
SELECT 
  id,
  'access_granted',
  jsonb_build_object(
    'reason', 'initial_setup',
    'granted_at', access_granted_at
  )
FROM public.mt_company_admins
WHERE access_granted_at IS NOT NULL;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.admin_access_logs IS 'Logs all admin access control events for auditing and monitoring';
COMMENT ON FUNCTION public.check_admin_access IS 'Checks if an admin has access based on all access control rules';
COMMENT ON COLUMN public.mt_company_admins.access_revoked IS 'Whether admin access has been manually revoked by super admin';
COMMENT ON COLUMN public.mt_company_admins.access_expires_at IS 'When admin access expires (automatic blocking)';
COMMENT ON COLUMN public.mt_company_admins.payment_required IS 'Whether admin must pay to maintain access';
