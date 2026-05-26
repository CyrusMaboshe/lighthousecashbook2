-- Row Level Security Policies for Separate Multi-Tenant System
-- These policies ensure complete data isolation between companies

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================

-- Function to get user's role from JWT
CREATE OR REPLACE FUNCTION public.get_mt_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.jwt() ->> 'role', 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's system type from JWT
CREATE OR REPLACE FUNCTION public.get_mt_system_type()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.jwt() ->> 'system_type', 'legacy');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is multi-tenant super admin
CREATE OR REPLACE FUNCTION public.is_mt_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(auth.jwt() ->> 'role', 'user') = 'super_admin' AND
    COALESCE(auth.jwt() ->> 'system_type', 'legacy') = 'multi_tenant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is company admin for a specific company
CREATE OR REPLACE FUNCTION public.is_mt_company_admin(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(auth.jwt() ->> 'role', 'user') = 'company_admin' AND
    COALESCE(auth.jwt() ->> 'system_type', 'legacy') = 'multi_tenant' AND
    EXISTS (
      SELECT 1 FROM public.company_admins 
      WHERE id = auth.uid() 
      AND company_id = company_uuid 
      AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is company user for a specific company
CREATE OR REPLACE FUNCTION public.is_mt_company_user(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(auth.jwt() ->> 'role', 'user') = 'company_user' AND
    COALESCE(auth.jwt() ->> 'system_type', 'legacy') = 'multi_tenant' AND
    EXISTS (
      SELECT 1 FROM public.company_users 
      WHERE id = auth.uid() 
      AND company_id = company_uuid 
      AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's company ID
CREATE OR REPLACE FUNCTION public.get_mt_user_company_id()
RETURNS UUID AS $$
DECLARE
  user_company_id UUID;
BEGIN
  -- Check if user is company admin
  SELECT company_id INTO user_company_id
  FROM public.company_admins
  WHERE id = auth.uid() AND is_active = true;
  
  IF user_company_id IS NOT NULL THEN
    RETURN user_company_id;
  END IF;
  
  -- Check if user is company user
  SELECT company_id INTO user_company_id
  FROM public.company_users
  WHERE id = auth.uid() AND is_active = true;
  
  RETURN user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUPER ADMINS TABLE POLICIES
-- =====================================================

-- Super admins can manage their own record
CREATE POLICY "Super admins manage own record" ON public.super_admins
  FOR ALL
  TO authenticated
  USING (id = auth.uid() AND public.is_mt_super_admin())
  WITH CHECK (id = auth.uid() AND public.is_mt_super_admin());

-- =====================================================
-- COMPANIES TABLE POLICIES
-- =====================================================

-- Super admins can do everything with companies
CREATE POLICY "Super admins full access to companies" ON public.companies
  FOR ALL
  TO authenticated
  USING (public.is_mt_super_admin())
  WITH CHECK (public.is_mt_super_admin());

-- Company admins can view their own company
CREATE POLICY "Company admins can view their company" ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(id)
  );

-- Company users can view their own company
CREATE POLICY "Company users can view their company" ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_user(id)
  );

-- =====================================================
-- COMPANY ADMINS TABLE POLICIES
-- =====================================================

-- Super admins can manage all company admins
CREATE POLICY "Super admins manage company admins" ON public.company_admins
  FOR ALL
  TO authenticated
  USING (public.is_mt_super_admin())
  WITH CHECK (public.is_mt_super_admin());

-- Company admins can view other admins in their company
CREATE POLICY "Company admins view company admins" ON public.company_admins
  FOR SELECT
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  );

-- Users can view their own admin record
CREATE POLICY "Users view own admin record" ON public.company_admins
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() AND 
    public.get_mt_system_type() = 'multi_tenant'
  );

-- =====================================================
-- COMPANY USERS TABLE POLICIES
-- =====================================================

-- Super admins can manage all company users
CREATE POLICY "Super admins manage company users" ON public.company_users
  FOR ALL
  TO authenticated
  USING (public.is_mt_super_admin())
  WITH CHECK (public.is_mt_super_admin());

-- Company admins can manage users in their company
CREATE POLICY "Company admins manage company users" ON public.company_users
  FOR ALL
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  )
  WITH CHECK (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  );

-- Users can view their own record
CREATE POLICY "Users view own record" ON public.company_users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() AND 
    public.get_mt_system_type() = 'multi_tenant'
  );

-- =====================================================
-- COMPANY TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Company admins can manage all transactions in their company
CREATE POLICY "Company admins manage transactions" ON public.company_transactions
  FOR ALL
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  )
  WITH CHECK (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  );

-- Company users can view transactions in their company (based on settings)
CREATE POLICY "Company users view transactions" ON public.company_transactions
  FOR SELECT
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_user(company_id)
  );

-- Company users can create transactions in their company
CREATE POLICY "Company users create transactions" ON public.company_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_user(company_id) AND
    user_id = auth.uid()
  );

-- Users can update their own transactions
CREATE POLICY "Users update own transactions" ON public.company_transactions
  FOR UPDATE
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    user_id = auth.uid()
  )
  WITH CHECK (
    public.get_mt_system_type() = 'multi_tenant' AND
    user_id = auth.uid()
  );

-- =====================================================
-- COMPANY CATEGORIES TABLE POLICIES
-- =====================================================

-- Company admins can manage categories in their company
CREATE POLICY "Company admins manage categories" ON public.company_categories
  FOR ALL
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  )
  WITH CHECK (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  );

-- Company users can view categories in their company
CREATE POLICY "Company users view categories" ON public.company_categories
  FOR SELECT
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_user(company_id)
  );

-- =====================================================
-- COMPANY NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Company admins can manage notifications in their company
CREATE POLICY "Company admins manage notifications" ON public.company_notifications
  FOR ALL
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  )
  WITH CHECK (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  );

-- Company users can view notifications in their company
CREATE POLICY "Company users view notifications" ON public.company_notifications
  FOR SELECT
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_user(company_id)
  );

-- =====================================================
-- COMPANY MESSAGES TABLE POLICIES
-- =====================================================

-- Company admins can manage messages in their company
CREATE POLICY "Company admins manage messages" ON public.company_messages
  FOR ALL
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  )
  WITH CHECK (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_admin(company_id)
  );

-- Company users can view and create messages in their company
CREATE POLICY "Company users view messages" ON public.company_messages
  FOR SELECT
  TO authenticated
  USING (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_user(company_id)
  );

CREATE POLICY "Company users create messages" ON public.company_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_mt_system_type() = 'multi_tenant' AND
    public.is_mt_company_user(company_id) AND
    sender_user_id = auth.uid()
  );

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for multi-tenant tables
ALTER TABLE public.super_admins REPLICA IDENTITY FULL;
ALTER TABLE public.companies REPLICA IDENTITY FULL;
ALTER TABLE public.company_admins REPLICA IDENTITY FULL;
ALTER TABLE public.company_users REPLICA IDENTITY FULL;
ALTER TABLE public.company_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.company_categories REPLICA IDENTITY FULL;
ALTER TABLE public.company_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.company_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.super_admins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_admins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_messages;
