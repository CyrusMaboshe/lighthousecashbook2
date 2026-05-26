-- Multi-Tenant Transaction System Database Schema
-- This creates transaction tables for the multi-tenant company system
-- Real-time transactions with cash-in/cash-out functionality

-- =====================================================
-- MT COMPANY TRANSACTIONS TABLE
-- =====================================================
-- Main transactions table for multi-tenant companies
CREATE TABLE IF NOT EXISTS public.mt_company_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Transaction details (EXACT requirements)
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME WITHOUT TIME ZONE DEFAULT CURRENT_TIME,
  type TEXT NOT NULL CHECK (type IN ('cash-in', 'cash-out')),
  category_name TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  
  -- Cash-in specific fields
  customer_name TEXT, -- Required for cash-in
  whatsapp_number TEXT, -- Required for cash-in
  number_of_pictures INTEGER DEFAULT 0 CHECK (number_of_pictures >= 0),
  details TEXT,
  
  -- Cash-out specific fields
  withdrawn_by TEXT, -- Auto-set for cash-out (username)
  withdrawn_by_user_id UUID, -- Reference to mt_company_users.id
  
  -- User tracking (who added the transaction)
  added_by TEXT NOT NULL, -- Username of who added it
  added_by_user_id UUID NOT NULL, -- Reference to mt_company_users.id
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- MT COMPANY CATEGORIES TABLE
-- =====================================================
-- Categories for each multi-tenant company
CREATE TABLE IF NOT EXISTS public.mt_company_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash-in', 'cash-out', 'both')) DEFAULT 'both',
  created_by_user_id UUID, -- Reference to mt_company_users.id
  created_by_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Ensure unique category names per company
  UNIQUE(company_id, name)
);

-- =====================================================
-- MT COMPANY ADMIN LOGS TABLE (Enhanced)
-- =====================================================
-- Enhanced admin logs for transaction tracking
CREATE TABLE IF NOT EXISTS public.mt_company_admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID, -- Reference to mt_company_users.id
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  transaction_id UUID, -- Reference to mt_company_transactions.id
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- MT Company Transactions indexes
CREATE INDEX IF NOT EXISTS idx_mt_company_transactions_company_id ON public.mt_company_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_mt_company_transactions_date ON public.mt_company_transactions(date);
CREATE INDEX IF NOT EXISTS idx_mt_company_transactions_type ON public.mt_company_transactions(type);
CREATE INDEX IF NOT EXISTS idx_mt_company_transactions_created_at ON public.mt_company_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_mt_company_transactions_added_by_user_id ON public.mt_company_transactions(added_by_user_id);

-- MT Company Categories indexes
CREATE INDEX IF NOT EXISTS idx_mt_company_categories_company_id ON public.mt_company_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_mt_company_categories_type ON public.mt_company_categories(type);

-- MT Company Admin Logs indexes
CREATE INDEX IF NOT EXISTS idx_mt_company_admin_logs_company_id ON public.mt_company_admin_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_mt_company_admin_logs_user_id ON public.mt_company_admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mt_company_admin_logs_timestamp ON public.mt_company_admin_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_mt_company_admin_logs_transaction_id ON public.mt_company_admin_logs(transaction_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all MT transaction tables
ALTER TABLE public.mt_company_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt_company_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt_company_admin_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies (allow all for now - will be refined based on authentication)
CREATE POLICY "Allow all operations on mt_company_transactions" ON public.mt_company_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on mt_company_categories" ON public.mt_company_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on mt_company_admin_logs" ON public.mt_company_admin_logs FOR ALL USING (true);

-- =====================================================
-- FUNCTIONS FOR DEFAULT CATEGORIES
-- =====================================================

-- Function to create default categories for a new multi-tenant company
CREATE OR REPLACE FUNCTION public.create_default_mt_company_categories(p_company_id UUID, p_created_by_username TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.mt_company_categories (company_id, name, type, created_by_username) VALUES
    -- Cash-in categories
    (p_company_id, 'Wedding Photography', 'cash-in', p_created_by_username),
    (p_company_id, 'Portrait Photography', 'cash-in', p_created_by_username),
    (p_company_id, 'Corporate Photography', 'cash-in', p_created_by_username),
    (p_company_id, 'Event Photography', 'cash-in', p_created_by_username),
    (p_company_id, 'Soft Copy', 'cash-in', p_created_by_username),
    (p_company_id, 'Processed Pictures', 'cash-in', p_created_by_username),
    (p_company_id, 'Studio Services', 'cash-in', p_created_by_username),
    
    -- Cash-out categories
    (p_company_id, 'Studio Expense', 'cash-out', p_created_by_username),
    (p_company_id, 'Personal Expense', 'cash-out', p_created_by_username),
    (p_company_id, 'Equipment Purchase', 'cash-out', p_created_by_username),
    (p_company_id, 'Rent Paid', 'cash-out', p_created_by_username),
    (p_company_id, 'Electricity Units', 'cash-out', p_created_by_username),
    (p_company_id, 'Airtime', 'cash-out', p_created_by_username),
    (p_company_id, 'Transport', 'cash-out', p_created_by_username),
    (p_company_id, 'Marketing', 'cash-out', p_created_by_username),
    (p_company_id, 'Loss Experienced', 'cash-out', p_created_by_username),
    
    -- Both categories
    (p_company_id, 'Studio Member Benefits', 'both', p_created_by_username),
    (p_company_id, 'Miscellaneous', 'both', p_created_by_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTIONS FOR REAL-TIME STATS
-- =====================================================

-- Function to calculate company transaction stats in real-time
CREATE OR REPLACE FUNCTION public.get_mt_company_transaction_stats(p_company_id UUID)
RETURNS TABLE(
  total_cash_in NUMERIC,
  total_cash_out NUMERIC,
  net_balance NUMERIC,
  total_pictures INTEGER,
  total_transactions INTEGER,
  this_month_transactions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN t.type = 'cash-in' THEN t.amount ELSE 0 END), 0) as total_cash_in,
    COALESCE(SUM(CASE WHEN t.type = 'cash-out' THEN t.amount ELSE 0 END), 0) as total_cash_out,
    COALESCE(SUM(CASE WHEN t.type = 'cash-in' THEN t.amount ELSE -t.amount END), 0) as net_balance,
    COALESCE(SUM(t.number_of_pictures), 0)::INTEGER as total_pictures,
    COUNT(*)::INTEGER as total_transactions,
    COUNT(CASE WHEN DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::INTEGER as this_month_transactions
  FROM public.mt_company_transactions t
  WHERE t.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for mt_company_transactions
CREATE TRIGGER update_mt_company_transactions_updated_at
  BEFORE UPDATE ON public.mt_company_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS SETUP
-- =====================================================

-- Enable real-time for transaction tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.mt_company_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mt_company_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mt_company_admin_logs;
