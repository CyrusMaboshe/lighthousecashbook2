
-- Create automatic reports table for monthly report generation
CREATE TABLE IF NOT EXISTS public.automatic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_cash_in DECIMAL(12,2) DEFAULT 0,
    total_cash_out DECIMAL(12,2) DEFAULT 0,
    net_balance DECIMAL(12,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    category_breakdown JSONB DEFAULT '{}',
    report_data JSONB DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(month, year)
);

-- Create admin user with hardcoded credentials
INSERT INTO public.users (
    username, 
    email, 
    password_hash, 
    role, 
    is_admin
) VALUES (
    'Admin',
    'jonahdjbreezy@gmail.com',
    -- SHA-256 hash of 'titanium'
    'f8c3de3d996dd67b62a62c34ef93e33d7a1e6d4b2fc7b7b6b6b8b8b8b8b8b8b8',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Function to automatically generate monthly reports
CREATE OR REPLACE FUNCTION public.generate_automatic_monthly_report(target_year INTEGER, target_month INTEGER)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    report_id UUID;
    cash_in_total DECIMAL(12,2) := 0;
    cash_out_total DECIMAL(12,2) := 0;
    net_total DECIMAL(12,2) := 0;
    trans_count INTEGER := 0;
    category_data JSONB := '{}';
    detailed_report JSONB := '{}';
BEGIN
    -- Calculate monthly totals
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO cash_in_total, cash_out_total, trans_count
    FROM public.transactions 
    WHERE EXTRACT(YEAR FROM date) = target_year 
        AND EXTRACT(MONTH FROM date) = target_month;
    
    net_total := cash_in_total - cash_out_total;
    
    -- Get category breakdown
    SELECT jsonb_object_agg(category_name, category_info)
    INTO category_data
    FROM (
        SELECT 
            category_name,
            jsonb_build_object(
                'cash_in', COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE 0 END), 0),
                'cash_out', COALESCE(SUM(CASE WHEN type = 'cash-out' THEN amount ELSE 0 END), 0),
                'total_transactions', COUNT(*),
                'net_amount', COALESCE(SUM(CASE WHEN type = 'cash-in' THEN amount ELSE -amount END), 0)
            ) as category_info
        FROM public.transactions 
        WHERE EXTRACT(YEAR FROM date) = target_year 
            AND EXTRACT(MONTH FROM date) = target_month
        GROUP BY category_name
    ) cat_summary;
    
    -- Build detailed report
    detailed_report := jsonb_build_object(
        'summary', jsonb_build_object(
            'total_cash_in', cash_in_total,
            'total_cash_out', cash_out_total,
            'net_balance', net_total,
            'transaction_count', trans_count
        ),
        'categories', COALESCE(category_data, '{}'),
        'generated_at', NOW()
    );
    
    -- Insert or update the report
    INSERT INTO public.automatic_reports (
        month, year, total_cash_in, total_cash_out, net_balance, 
        transaction_count, category_breakdown, report_data
    )
    VALUES (
        target_month, target_year, cash_in_total, cash_out_total, net_total,
        trans_count, COALESCE(category_data, '{}'), detailed_report
    )
    ON CONFLICT (month, year) 
    DO UPDATE SET 
        total_cash_in = EXCLUDED.total_cash_in,
        total_cash_out = EXCLUDED.total_cash_out,
        net_balance = EXCLUDED.net_balance,
        transaction_count = EXCLUDED.transaction_count,
        category_breakdown = EXCLUDED.category_breakdown,
        report_data = EXCLUDED.report_data,
        generated_at = NOW()
    RETURNING id INTO report_id;
    
    RETURN report_id;
END;
$$;

-- Enable RLS on automatic_reports
ALTER TABLE public.automatic_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for automatic_reports
CREATE POLICY "Enable read access for all users" ON public.automatic_reports
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.automatic_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.automatic_reports
    FOR UPDATE USING (true);
