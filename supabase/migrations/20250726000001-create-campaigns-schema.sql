-- Campaign System Database Schema
-- This creates campaign tables within the MAIN SYSTEM (not multi-tenant)
-- Campaigns are created by super admins and operate as separate instances of the main system

-- =====================================================
-- CAMPAIGNS TABLE
-- =====================================================
-- Master table for all campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Campaign settings (same structure as main system settings)
  settings JSONB DEFAULT '{
    "show_full_balance_to_users": false,
    "current_visible_month": 1,
    "current_visible_year": 2024,
    "allow_user_transaction_creation": true,
    "allow_user_transaction_editing": false,
    "require_receipt_printing": false,
    "currency": "ZMW"
  }'::jsonb,
  
  -- Campaign status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by_user_id UUID, -- Reference to main system user who created it
  created_by_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN USERS TABLE
-- =====================================================
-- Users within each campaign (separate from main system users)
CREATE TABLE IF NOT EXISTS public.campaign_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  -- User details (same structure as main system users)
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  is_admin BOOLEAN DEFAULT false,
  
  -- User status
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  
  -- Metadata
  created_by_user_id UUID, -- Reference to who created this user
  created_by_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique usernames and emails per campaign
  UNIQUE(campaign_id, username),
  UNIQUE(campaign_id, email)
);

-- =====================================================
-- CAMPAIGN TRANSACTIONS TABLE
-- =====================================================
-- Transactions within each campaign (exact replica of main system)
CREATE TABLE IF NOT EXISTS public.campaign_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  
  -- Transaction details (EXACT same structure as main system)
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
  added_by_user_id UUID, -- Reference to campaign_users.id
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN CATEGORIES TABLE
-- =====================================================
-- Categories within each campaign (exact replica of main system)
CREATE TABLE IF NOT EXISTS public.campaign_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique category names per campaign
  UNIQUE(campaign_id, name)
);

-- =====================================================
-- CAMPAIGN ADMIN LOGS TABLE
-- =====================================================
-- Admin logs within each campaign (exact replica of main system)
CREATE TABLE IF NOT EXISTS public.campaign_admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID, -- Reference to campaign_users.id
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN USER LOGS TABLE
-- =====================================================
-- User logs within each campaign (exact replica of main system)
CREATE TABLE IF NOT EXISTS public.campaign_user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID, -- Reference to campaign_users.id
  username TEXT NOT NULL,
  action_type TEXT NOT NULL,
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
-- Notifications within each campaign (exact replica of main system)
CREATE TABLE IF NOT EXISTS public.campaign_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('serious', 'not-serious', 'moderate', 'very-urgent', 'very-serious', 'appointment', 'todo', 'future-plans', 'schedule')),
  created_by_user_id UUID, -- Reference to campaign_users.id
  created_by_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- CAMPAIGN INVOICES TABLE
-- =====================================================
-- Invoices within each campaign (exact replica of main system)
CREATE TABLE IF NOT EXISTS public.campaign_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
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
  created_by_user_id UUID, -- Reference to campaign_users.id
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique invoice IDs per campaign
  UNIQUE(campaign_id, invoice_id)
);

-- =====================================================
-- CAMPAIGN CASH VAULT TABLE
-- =====================================================
-- Cash vault within each campaign (exact replica of main system)
CREATE TABLE IF NOT EXISTS public.campaign_cashvault_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME WITHOUT TIME ZONE DEFAULT CURRENT_TIME,
  action_type TEXT NOT NULL CHECK (action_type IN ('deposit', 'withdrawal')),
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  initiating_user TEXT NOT NULL,
  initiating_user_id UUID, -- Reference to campaign_users.id
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON public.campaigns(name);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON public.campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at);

-- Campaign users indexes
CREATE INDEX IF NOT EXISTS idx_campaign_users_campaign_id ON public.campaign_users(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_users_username ON public.campaign_users(username);
CREATE INDEX IF NOT EXISTS idx_campaign_users_email ON public.campaign_users(email);
CREATE INDEX IF NOT EXISTS idx_campaign_users_is_active ON public.campaign_users(is_active);

-- Campaign transactions indexes
CREATE INDEX IF NOT EXISTS idx_campaign_transactions_campaign_id ON public.campaign_transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_transactions_date ON public.campaign_transactions(date);
CREATE INDEX IF NOT EXISTS idx_campaign_transactions_type ON public.campaign_transactions(type);
CREATE INDEX IF NOT EXISTS idx_campaign_transactions_created_at ON public.campaign_transactions(created_at);

-- Campaign categories indexes
CREATE INDEX IF NOT EXISTS idx_campaign_categories_campaign_id ON public.campaign_categories(campaign_id);

-- Campaign admin logs indexes
CREATE INDEX IF NOT EXISTS idx_campaign_admin_logs_campaign_id ON public.campaign_admin_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_admin_logs_timestamp ON public.campaign_admin_logs(timestamp);

-- Campaign user logs indexes
CREATE INDEX IF NOT EXISTS idx_campaign_user_logs_campaign_id ON public.campaign_user_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_user_logs_user_id ON public.campaign_user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_user_logs_timestamp ON public.campaign_user_logs(timestamp);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all campaign tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_cashvault_transactions ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be refined based on authentication system)
-- For now, allow all operations (will be restricted later)
CREATE POLICY "Allow all operations on campaigns" ON public.campaigns FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_users" ON public.campaign_users FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_transactions" ON public.campaign_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_categories" ON public.campaign_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_admin_logs" ON public.campaign_admin_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_user_logs" ON public.campaign_user_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_notifications" ON public.campaign_notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_invoices" ON public.campaign_invoices FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_cashvault_transactions" ON public.campaign_cashvault_transactions FOR ALL USING (true);
