-- Campaign Database Schema - Complete Replica of Existing System
-- This creates separate tables for campaign data with exact same structure

-- =====================================================
-- CAMPAIGN TRANSACTIONS TABLE
-- =====================================================
-- Exact replica of the existing transactions table but campaign-scoped
CREATE TABLE IF NOT EXISTS public.campaign_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Transaction details (exact same structure as existing system)
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  type TEXT NOT NULL CHECK (type IN ('cash-in', 'cash-out')),
  category_name TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  customer_name TEXT NOT NULL,
  number_of_pictures INTEGER DEFAULT 0,
  whatsapp_number TEXT,
  details TEXT,
  
  -- User tracking (who added the transaction)
  added_by TEXT NOT NULL, -- Username of who added it
  added_by_user_id UUID, -- Reference to the user who added it
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN CATEGORIES TABLE
-- =====================================================
-- Exact replica of categories table but campaign-scoped
CREATE TABLE IF NOT EXISTS public.campaign_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique category names per company
  UNIQUE(company_id, name)
);

-- =====================================================
-- CAMPAIGN ADMIN LOGS TABLE
-- =====================================================
-- Exact replica of admin_logs table but campaign-scoped
CREATE TABLE IF NOT EXISTS public.campaign_admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID, -- Reference to the user who performed the action
  username TEXT NOT NULL, -- Username for display
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN USER LOGS TABLE
-- =====================================================
-- Exact replica of user_logs table but campaign-scoped
CREATE TABLE IF NOT EXISTS public.campaign_user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID, -- Reference to the user
  username TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'login', 'logout', 'transaction_create', etc.
  action_description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN NOTIFICATIONS TABLE
-- =====================================================
-- Exact replica of notifications table but campaign-scoped
CREATE TABLE IF NOT EXISTS public.campaign_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('serious', 'not-serious', 'moderate', 'very-urgent', 'very-serious', 'appointment', 'todo', 'future-plans', 'schedule')),
  created_by_user_id UUID,
  created_by_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN INVOICES TABLE
-- =====================================================
-- Exact replica of invoices table but campaign-scoped
CREATE TABLE IF NOT EXISTS public.campaign_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('booking', 'payment')),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique invoice IDs per company
  UNIQUE(company_id, invoice_id)
);

-- =====================================================
-- CAMPAIGN CASH VAULT TABLE
-- =====================================================
-- Exact replica of cashvault_transactions table but campaign-scoped
CREATE TABLE IF NOT EXISTS public.campaign_cashvault_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME WITHOUT TIME ZONE DEFAULT CURRENT_TIME,
  action_type TEXT NOT NULL CHECK (action_type IN ('deposit', 'withdrawal')),
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  initiating_user TEXT NOT NULL,
  initiating_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN SYSTEM SETTINGS TABLE
-- =====================================================
-- Campaign-specific settings (like system_settings but per campaign)
CREATE TABLE IF NOT EXISTS public.campaign_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique setting keys per company
  UNIQUE(company_id, setting_key)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Campaign transactions indexes
CREATE INDEX IF NOT EXISTS idx_campaign_transactions_company_id ON public.campaign_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_transactions_date ON public.campaign_transactions(date);
CREATE INDEX IF NOT EXISTS idx_campaign_transactions_type ON public.campaign_transactions(type);
CREATE INDEX IF NOT EXISTS idx_campaign_transactions_created_at ON public.campaign_transactions(created_at);

-- Campaign categories indexes
CREATE INDEX IF NOT EXISTS idx_campaign_categories_company_id ON public.campaign_categories(company_id);

-- Campaign admin logs indexes
CREATE INDEX IF NOT EXISTS idx_campaign_admin_logs_company_id ON public.campaign_admin_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_admin_logs_timestamp ON public.campaign_admin_logs(timestamp);

-- Campaign user logs indexes
CREATE INDEX IF NOT EXISTS idx_campaign_user_logs_company_id ON public.campaign_user_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_user_logs_user_id ON public.campaign_user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_user_logs_timestamp ON public.campaign_user_logs(timestamp);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all campaign tables
ALTER TABLE public.campaign_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_cashvault_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_settings ENABLE ROW LEVEL SECURITY;

-- Campaign transactions policies
CREATE POLICY "Users can view their company transactions" ON public.campaign_transactions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions for their company" ON public.campaign_transactions
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions for their company" ON public.campaign_transactions
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions for their company" ON public.campaign_transactions
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE id = auth.uid()
    )
  );

-- Similar policies for other tables (categories, logs, etc.)
-- Campaign categories policies
CREATE POLICY "Users can view their company categories" ON public.campaign_categories
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their company categories" ON public.campaign_categories
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE id = auth.uid()
    )
  );

-- =====================================================
-- DEFAULT CATEGORIES FOR NEW CAMPAIGNS
-- =====================================================

-- Function to create default categories for a new campaign
CREATE OR REPLACE FUNCTION public.create_default_campaign_categories(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.campaign_categories (company_id, name) VALUES
    (p_company_id, 'Soft Copy'),
    (p_company_id, 'Processed Pictures'),
    (p_company_id, 'Loss Experienced'),
    (p_company_id, 'Studio Expense'),
    (p_company_id, 'Personal Expense'),
    (p_company_id, 'Airtime'),
    (p_company_id, 'Airtime and Food'),
    (p_company_id, 'Rent Reserved'),
    (p_company_id, 'Rent Paid'),
    (p_company_id, 'Studio Member Benefits'),
    (p_company_id, 'Electricity Units'),
    (p_company_id, 'Transport'),
    (p_company_id, 'Studio Equipment Bought'),
    (p_company_id, 'Wedding Photography'),
    (p_company_id, 'Portrait Photography'),
    (p_company_id, 'Corporate Photography'),
    (p_company_id, 'Event Photography'),
    (p_company_id, 'Equipment Purchase'),
    (p_company_id, 'Marketing'),
    (p_company_id, 'Travel Expenses');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default settings for a new campaign
CREATE OR REPLACE FUNCTION public.create_default_campaign_settings(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.campaign_settings (company_id, setting_key, setting_value) VALUES
    (p_company_id, 'show_full_balance_to_users', 'false'),
    (p_company_id, 'current_visible_month', EXTRACT(MONTH FROM CURRENT_DATE)::TEXT),
    (p_company_id, 'current_visible_year', EXTRACT(YEAR FROM CURRENT_DATE)::TEXT),
    (p_company_id, 'currency', 'ZMW'),
    (p_company_id, 'allow_user_transaction_creation', 'true'),
    (p_company_id, 'allow_user_transaction_editing', 'false'),
    (p_company_id, 'require_receipt_printing', 'false');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
