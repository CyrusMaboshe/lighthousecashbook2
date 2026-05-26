-- Create Tenant-Specific Tables for Reports and Exports
-- These tables are completely separate from the main system and store tenant-isolated data

-- =====================================================
-- TENANT REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenant_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_month INTEGER NOT NULL CHECK (report_month >= 1 AND report_month <= 12),
  report_year INTEGER NOT NULL CHECK (report_year >= 2020 AND report_year <= 2100),
  total_cash_in DECIMAL(15,2) DEFAULT 0,
  total_cash_out DECIMAL(15,2) DEFAULT 0,
  net_balance DECIMAL(15,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  total_pictures INTEGER DEFAULT 0,
  top_categories JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT unique_tenant_report_month UNIQUE (company_id, report_month, report_year)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tenant_reports_company_id ON public.tenant_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reports_date ON public.tenant_reports(report_year, report_month);
CREATE INDEX IF NOT EXISTS idx_tenant_reports_generated_at ON public.tenant_reports(generated_at);

-- =====================================================
-- TENANT EXPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenant_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  export_format TEXT NOT NULL DEFAULT 'csv',
  file_name TEXT NOT NULL,
  file_size INTEGER,
  record_count INTEGER,
  export_parameters JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  exported_by UUID REFERENCES public.mt_company_users(id),
  exported_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_export_type CHECK (export_type IN (
    'transactions',
    'users', 
    'reports',
    'analytics',
    'monthly_summary',
    'category_analysis',
    'customer_list',
    'financial_summary'
  )),
  CONSTRAINT valid_export_format CHECK (export_format IN ('csv', 'pdf', 'xlsx', 'json'))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tenant_exports_company_id ON public.tenant_exports(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_exports_type ON public.tenant_exports(export_type);
CREATE INDEX IF NOT EXISTS idx_tenant_exports_status ON public.tenant_exports(status);
CREATE INDEX IF NOT EXISTS idx_tenant_exports_exported_at ON public.tenant_exports(exported_at);
CREATE INDEX IF NOT EXISTS idx_tenant_exports_exported_by ON public.tenant_exports(exported_by);

-- =====================================================
-- TENANT ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  analytics_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  insights JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_analytics_type CHECK (analytics_type IN (
    'monthly_summary',
    'category_breakdown',
    'customer_analysis',
    'trend_analysis',
    'performance_metrics',
    'cash_flow_analysis'
  )),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_company_id ON public.tenant_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_type ON public.tenant_analytics(analytics_type);
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_period ON public.tenant_analytics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_generated_at ON public.tenant_analytics(generated_at);

-- =====================================================
-- TENANT EXPORT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenant_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  export_id UUID REFERENCES public.tenant_exports(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  user_id UUID REFERENCES public.mt_company_users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT valid_export_action CHECK (action IN (
    'export_requested',
    'export_started',
    'export_completed',
    'export_failed',
    'export_downloaded',
    'export_deleted'
  ))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tenant_export_logs_company_id ON public.tenant_export_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_export_logs_export_id ON public.tenant_export_logs(export_id);
CREATE INDEX IF NOT EXISTS idx_tenant_export_logs_action ON public.tenant_export_logs(action);
CREATE INDEX IF NOT EXISTS idx_tenant_export_logs_user_id ON public.tenant_export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_export_logs_created_at ON public.tenant_export_logs(created_at);

-- =====================================================
-- FUNCTIONS FOR TENANT REPORTS
-- =====================================================

-- Function to generate tenant monthly report
CREATE OR REPLACE FUNCTION public.generate_tenant_monthly_report(
  target_company_id UUID,
  target_year INTEGER,
  target_month INTEGER
)
RETURNS JSONB AS $$
DECLARE
  report_data JSONB;
  total_cash_in DECIMAL(15,2) := 0;
  total_cash_out DECIMAL(15,2) := 0;
  transaction_count INTEGER := 0;
  total_pictures INTEGER := 0;
  top_categories JSONB := '[]';
  category_data JSONB;
BEGIN
  -- Calculate totals from company transactions
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'cash_out' THEN amount ELSE 0 END), 0),
    COUNT(*),
    COALESCE(SUM(CASE WHEN pictures IS NOT NULL THEN jsonb_array_length(pictures) ELSE 0 END), 0)
  INTO total_cash_in, total_cash_out, transaction_count, total_pictures
  FROM public.mt_company_transactions
  WHERE company_id = target_company_id
    AND EXTRACT(YEAR FROM created_at) = target_year
    AND EXTRACT(MONTH FROM created_at) = target_month;

  -- Calculate top categories
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', category,
      'amount', total_amount,
      'count', transaction_count
    ) ORDER BY total_amount DESC
  )
  INTO top_categories
  FROM (
    SELECT 
      category,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM public.mt_company_transactions
    WHERE company_id = target_company_id
      AND EXTRACT(YEAR FROM created_at) = target_year
      AND EXTRACT(MONTH FROM created_at) = target_month
      AND category IS NOT NULL
    GROUP BY category
    ORDER BY total_amount DESC
    LIMIT 5
  ) cat_summary;

  -- Insert or update report
  INSERT INTO public.tenant_reports (
    company_id,
    report_month,
    report_year,
    total_cash_in,
    total_cash_out,
    net_balance,
    transaction_count,
    total_pictures,
    top_categories,
    generated_at
  ) VALUES (
    target_company_id,
    target_month,
    target_year,
    total_cash_in,
    total_cash_out,
    total_cash_in - total_cash_out,
    transaction_count,
    total_pictures,
    COALESCE(top_categories, '[]'),
    NOW()
  )
  ON CONFLICT (company_id, report_month, report_year)
  DO UPDATE SET
    total_cash_in = EXCLUDED.total_cash_in,
    total_cash_out = EXCLUDED.total_cash_out,
    net_balance = EXCLUDED.net_balance,
    transaction_count = EXCLUDED.transaction_count,
    total_pictures = EXCLUDED.total_pictures,
    top_categories = EXCLUDED.top_categories,
    generated_at = EXCLUDED.generated_at,
    updated_at = NOW();

  -- Return report data
  report_data := jsonb_build_object(
    'company_id', target_company_id,
    'month', target_month,
    'year', target_year,
    'total_cash_in', total_cash_in,
    'total_cash_out', total_cash_out,
    'net_balance', total_cash_in - total_cash_out,
    'transaction_count', transaction_count,
    'total_pictures', total_pictures,
    'top_categories', COALESCE(top_categories, '[]'),
    'generated_at', NOW()
  );

  RETURN report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log tenant export activity
CREATE OR REPLACE FUNCTION public.log_tenant_export(
  p_company_id UUID,
  p_export_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.tenant_export_logs (
    company_id,
    export_id,
    action,
    details,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    p_company_id,
    p_export_id,
    p_action,
    p_details,
    p_user_id,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tenant tables
ALTER TABLE public.tenant_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_export_logs ENABLE ROW LEVEL SECURITY;

-- Policies for tenant_reports
CREATE POLICY "Users can view their company reports" ON public.tenant_reports
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE auth_user_id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage reports" ON public.tenant_reports
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_admins WHERE auth_user_id = auth.uid()
    )
  );

-- Policies for tenant_exports
CREATE POLICY "Users can view their company exports" ON public.tenant_exports
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE auth_user_id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exports for their company" ON public.tenant_exports
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE auth_user_id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE auth_user_id = auth.uid()
    )
  );

-- Policies for tenant_analytics
CREATE POLICY "Users can view their company analytics" ON public.tenant_analytics
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_users WHERE auth_user_id = auth.uid()
      UNION
      SELECT company_id FROM public.mt_company_admins WHERE auth_user_id = auth.uid()
    )
  );

-- Policies for tenant_export_logs
CREATE POLICY "Company admins can view export logs" ON public.tenant_export_logs
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.mt_company_admins WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_exports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_analytics TO authenticated;
GRANT SELECT, INSERT ON public.tenant_export_logs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.generate_tenant_monthly_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_tenant_export TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.tenant_reports IS 'Stores monthly reports for each tenant company';
COMMENT ON TABLE public.tenant_exports IS 'Tracks all export operations for tenant companies';
COMMENT ON TABLE public.tenant_analytics IS 'Stores analytics data for tenant companies';
COMMENT ON TABLE public.tenant_export_logs IS 'Logs all export-related activities for auditing';

COMMENT ON FUNCTION public.generate_tenant_monthly_report IS 'Generates monthly report for a specific tenant company';
COMMENT ON FUNCTION public.log_tenant_export IS 'Logs export activities for auditing purposes';
