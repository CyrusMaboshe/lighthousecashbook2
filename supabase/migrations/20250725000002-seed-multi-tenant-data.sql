-- Multi-Tenant Initial Data Seeding
-- This migration creates initial companies and default categories

-- =====================================================
-- CREATE DEFAULT COMPANIES
-- =====================================================

-- Insert Smart Savings as the default company
INSERT INTO public.companies (
  id,
  name,
  display_name,
  description,
  settings,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'smart-savings',
  'Smart Savings',
  'Default company for existing Smart Savings users',
  '{
    "show_full_balance_to_users": false,
    "current_visible_month": 0,
    "current_visible_year": 2025,
    "allow_user_transaction_creation": true,
    "allow_user_transaction_editing": false,
    "require_receipt_printing": false
  }'::JSONB,
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert a demo company for testing
INSERT INTO public.companies (
  id,
  name,
  display_name,
  description,
  settings,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000002'::UUID,
  'demo-company',
  'Demo Company',
  'Demo company for testing multi-tenant features',
  '{
    "show_full_balance_to_users": true,
    "current_visible_month": 0,
    "current_visible_year": 2025,
    "allow_user_transaction_creation": true,
    "allow_user_transaction_editing": true,
    "require_receipt_printing": true
  }'::JSONB,
  true
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CREATE DEFAULT CATEGORIES FOR COMPANIES
-- =====================================================

-- Default categories for Smart Savings
INSERT INTO public.company_categories (company_id, name, description) VALUES
('00000000-0000-0000-0000-000000000001'::UUID, 'Soft Copy', 'Digital photo services'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Processed Pictures', 'Printed photo services'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Loss Experienced', 'Business losses and damages'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Studio Expense', 'General studio operational expenses'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Personal Expense', 'Personal expenses'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Airtime', 'Mobile airtime purchases'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Airtime and Food', 'Combined airtime and food expenses'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Rent Reserved', 'Money set aside for rent'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Rent Paid', 'Actual rent payments'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Studio Member Benefits', 'Benefits for studio members'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Electricity Units', 'Electricity bill payments'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Transport', 'Transportation expenses'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Studio Equipment Bought', 'New equipment purchases')
ON CONFLICT (company_id, name) DO NOTHING;

-- Default categories for Demo Company
INSERT INTO public.company_categories (company_id, name, description) VALUES
('00000000-0000-0000-0000-000000000002'::UUID, 'Sales Revenue', 'Income from sales'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Service Revenue', 'Income from services'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Office Supplies', 'Office supply expenses'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Marketing', 'Marketing and advertising expenses'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Utilities', 'Utility bill payments'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Travel', 'Business travel expenses'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Equipment', 'Equipment purchases'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Professional Services', 'Legal, accounting, consulting fees'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Insurance', 'Insurance payments'),
('00000000-0000-0000-0000-000000000002'::UUID, 'Miscellaneous', 'Other business expenses')
ON CONFLICT (company_id, name) DO NOTHING;

-- =====================================================
-- CREATE SUPER ADMIN FUNCTIONS
-- =====================================================

-- Function to create a new company with default categories
CREATE OR REPLACE FUNCTION public.create_company_with_defaults(
  company_name TEXT,
  company_display_name TEXT,
  company_description TEXT DEFAULT NULL,
  company_settings JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_company_id UUID;
  default_settings JSONB;
BEGIN
  -- Set default settings if not provided
  default_settings := COALESCE(company_settings, '{
    "show_full_balance_to_users": false,
    "current_visible_month": 0,
    "current_visible_year": 2025,
    "allow_user_transaction_creation": true,
    "allow_user_transaction_editing": false,
    "require_receipt_printing": false
  }'::JSONB);

  -- Create the company
  INSERT INTO public.companies (name, display_name, description, settings)
  VALUES (company_name, company_display_name, company_description, default_settings)
  RETURNING id INTO new_company_id;

  -- Create default categories
  INSERT INTO public.company_categories (company_id, name, description) VALUES
  (new_company_id, 'Sales Revenue', 'Income from sales'),
  (new_company_id, 'Service Revenue', 'Income from services'),
  (new_company_id, 'Office Supplies', 'Office supply expenses'),
  (new_company_id, 'Marketing', 'Marketing and advertising expenses'),
  (new_company_id, 'Utilities', 'Utility bill payments'),
  (new_company_id, 'Travel', 'Business travel expenses'),
  (new_company_id, 'Equipment', 'Equipment purchases'),
  (new_company_id, 'Professional Services', 'Legal, accounting, consulting fees'),
  (new_company_id, 'Miscellaneous', 'Other business expenses');

  RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign user as company admin
CREATE OR REPLACE FUNCTION public.assign_company_admin(
  user_auth_id UUID,
  target_company_id UUID,
  admin_permissions JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_admin_id UUID;
  default_permissions JSONB;
BEGIN
  -- Set default permissions if not provided
  default_permissions := COALESCE(admin_permissions, '{
    "manage_users": true,
    "manage_transactions": true,
    "view_reports": true,
    "manage_categories": true,
    "manage_notifications": true,
    "export_data": true
  }'::JSONB);

  -- Check if user is already an admin for this company
  SELECT id INTO new_admin_id
  FROM public.company_admins
  WHERE auth_user_id = user_auth_id AND company_id = target_company_id;

  IF new_admin_id IS NOT NULL THEN
    -- Update existing admin record
    UPDATE public.company_admins
    SET permissions = default_permissions, is_active = true, updated_at = NOW()
    WHERE id = new_admin_id;
  ELSE
    -- Create new admin record
    INSERT INTO public.company_admins (auth_user_id, company_id, permissions)
    VALUES (user_auth_id, target_company_id, default_permissions)
    RETURNING id INTO new_admin_id;
  END IF;

  RETURN new_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign user as company user
CREATE OR REPLACE FUNCTION public.assign_company_user(
  user_auth_id UUID,
  target_company_id UUID,
  user_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  default_metadata JSONB;
BEGIN
  -- Set default metadata if not provided
  default_metadata := COALESCE(user_metadata, '{
    "can_create_transactions": true,
    "can_edit_own_transactions": false,
    "can_view_all_transactions": false
  }'::JSONB);

  -- Check if user is already a user for this company
  SELECT id INTO new_user_id
  FROM public.company_users
  WHERE auth_user_id = user_auth_id AND company_id = target_company_id;

  IF new_user_id IS NOT NULL THEN
    -- Update existing user record
    UPDATE public.company_users
    SET user_metadata = default_metadata, is_active = true, updated_at = NOW()
    WHERE id = new_user_id;
  ELSE
    -- Create new user record
    INSERT INTO public.company_users (auth_user_id, company_id, user_metadata)
    VALUES (user_auth_id, target_company_id, default_metadata)
    RETURNING id INTO new_user_id;
  END IF;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE SAMPLE NOTIFICATIONS
-- =====================================================

-- Sample notification for Smart Savings
INSERT INTO public.company_notifications (
  company_id,
  title,
  message,
  priority,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Welcome to Multi-Tenant Smart Savings',
  'Your Smart Savings has been upgraded with multi-tenant capabilities. All your existing data is preserved and accessible.',
  'moderate',
  'System'
) ON CONFLICT DO NOTHING;

-- Sample notification for Demo Company
INSERT INTO public.company_notifications (
  company_id,
  title,
  message,
  priority,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000002'::UUID,
  'Demo Company Setup Complete',
  'Welcome to the demo company! You can test all multi-tenant features here.',
  'moderate',
  'System'
) ON CONFLICT DO NOTHING;
