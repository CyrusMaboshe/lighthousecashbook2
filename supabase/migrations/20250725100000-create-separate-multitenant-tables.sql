-- Separate Multi-Tenant System Tables
-- These tables are completely separate from the existing system
-- They handle the new multi-tenant companies without affecting existing data

-- =====================================================
-- SUPER ADMINS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_super_admin_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- COMPANIES TABLE (SEPARATE FROM EXISTING SYSTEM)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{
    "show_full_balance_to_users": false,
    "current_visible_month": 0,
    "current_visible_year": 2025,
    "allow_user_transaction_creation": true,
    "allow_user_transaction_editing": false,
    "require_receipt_printing": false
  }',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_company_name CHECK (name ~ '^[a-zA-Z0-9_-]{3,50}$'),
  CONSTRAINT valid_display_name CHECK (length(display_name) >= 2 AND length(display_name) <= 100)
);

-- =====================================================
-- COMPANY ADMINS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.company_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{
    "manage_users": true,
    "manage_transactions": true,
    "view_reports": true,
    "manage_categories": true,
    "manage_notifications": true,
    "export_data": true
  }',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  UNIQUE(email, company_id),
  CONSTRAINT valid_company_admin_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- COMPANY USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_metadata JSONB DEFAULT '{
    "can_create_transactions": true,
    "can_edit_own_transactions": false,
    "can_view_all_transactions": false
  }',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  UNIQUE(email, company_id),
  UNIQUE(username, company_id),
  CONSTRAINT valid_company_user_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_username CHECK (length(username) >= 2 AND length(username) <= 50)
);

-- =====================================================
-- COMPANY TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.company_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.company_admins(id) ON DELETE SET NULL,
  
  -- Transaction details (same structure as existing transactions)
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  type TEXT NOT NULL CHECK (type IN ('cash-in', 'cash-out')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  category_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  number_of_pictures INTEGER DEFAULT 0,
  whatsapp_number TEXT,
  details TEXT,
  
  -- Metadata
  added_by TEXT NOT NULL, -- Username for display
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_details CHECK (length(details) <= 1000),
  CONSTRAINT valid_customer_name CHECK (length(customer_name) >= 1 AND length(customer_name) <= 200),
  CONSTRAINT valid_category_name CHECK (length(category_name) >= 1 AND length(category_name) <= 100),
  CONSTRAINT valid_added_by CHECK (length(added_by) >= 1 AND length(added_by) <= 100),
  CONSTRAINT user_or_admin_check CHECK (
    (user_id IS NOT NULL AND admin_id IS NULL) OR 
    (user_id IS NULL AND admin_id IS NOT NULL)
  )
);

-- =====================================================
-- COMPANY CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.company_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  UNIQUE(company_id, name),
  CONSTRAINT valid_category_name CHECK (length(name) >= 1 AND length(name) <= 100)
);

-- =====================================================
-- COMPANY NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.company_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'moderate' CHECK (
    priority IN ('serious', 'not-serious', 'moderate', 'very-urgent', 'very-serious', 'appointment', 'todo', 'future-plans', 'schedule')
  ),
  created_by_admin_id UUID REFERENCES public.company_admins(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL, -- Username for display
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_title CHECK (length(title) >= 1 AND length(title) <= 200),
  CONSTRAINT valid_message CHECK (length(message) >= 1)
);

-- =====================================================
-- COMPANY MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.company_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  sender_admin_id UUID REFERENCES public.company_admins(id) ON DELETE SET NULL,
  sender_user_id UUID REFERENCES public.company_users(id) ON DELETE SET NULL,
  sender TEXT NOT NULL, -- Username for display
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'user')),
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT sender_check CHECK (
    (sender_admin_id IS NOT NULL AND sender_user_id IS NULL) OR 
    (sender_admin_id IS NULL AND sender_user_id IS NOT NULL)
  ),
  CONSTRAINT valid_message CHECK (length(message) >= 1),
  CONSTRAINT valid_sender CHECK (length(sender) >= 1 AND length(sender) <= 100)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Super admins indexes
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON public.super_admins(email);

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(is_active);

-- Company admins indexes
CREATE INDEX IF NOT EXISTS idx_company_admins_email ON public.company_admins(email);
CREATE INDEX IF NOT EXISTS idx_company_admins_company ON public.company_admins(company_id);
CREATE INDEX IF NOT EXISTS idx_company_admins_active ON public.company_admins(is_active);

-- Company users indexes
CREATE INDEX IF NOT EXISTS idx_company_users_email ON public.company_users(email);
CREATE INDEX IF NOT EXISTS idx_company_users_username ON public.company_users(username);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_active ON public.company_users(is_active);

-- Company transactions indexes
CREATE INDEX IF NOT EXISTS idx_company_transactions_company ON public.company_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_transactions_date ON public.company_transactions(date);
CREATE INDEX IF NOT EXISTS idx_company_transactions_type ON public.company_transactions(type);
CREATE INDEX IF NOT EXISTS idx_company_transactions_user ON public.company_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_company_transactions_admin ON public.company_transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_company_transactions_category ON public.company_transactions(category_name);

-- Company categories indexes
CREATE INDEX IF NOT EXISTS idx_company_categories_company ON public.company_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_company_categories_name ON public.company_categories(name);

-- Company notifications indexes
CREATE INDEX IF NOT EXISTS idx_company_notifications_company ON public.company_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_company_notifications_created_at ON public.company_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_company_notifications_priority ON public.company_notifications(priority);

-- Company messages indexes
CREATE INDEX IF NOT EXISTS idx_company_messages_company ON public.company_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_company_messages_conversation ON public.company_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_company_messages_created_at ON public.company_messages(created_at);

-- =====================================================
-- CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Create or update the trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON public.super_admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_admins_updated_at
    BEFORE UPDATE ON public.company_admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at
    BEFORE UPDATE ON public.company_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_transactions_updated_at
    BEFORE UPDATE ON public.company_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
