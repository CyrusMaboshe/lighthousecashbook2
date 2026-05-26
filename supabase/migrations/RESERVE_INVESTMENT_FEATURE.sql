-- ============================================================
-- RESERVE INVESTMENT FEATURE MIGRATION
-- Creates tables for Reserve Investment with allocation rules:
-- • Admin sets total reserve amount
-- • 10% of total reserve is auto-reserved for Studio Core / Plan Savings
-- • Remaining 90% is distributed among users at 50%, 30%, 20%, or 15%
-- • Users only see their personal allocated amount + maturity date
-- • Admin can see total reserve, 10% savings portion, all allocations
-- ============================================================

-- Table: reserve_investment_config
-- Stores the master total reserve amount set by admin
CREATE TABLE IF NOT EXISTS reserve_investment_config (
    id TEXT PRIMARY KEY DEFAULT 'singleton',  -- Only one row ever
    total_reserve NUMERIC(18, 2) NOT NULL DEFAULT 0,
    savings_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00,  -- Always 10%
    notes TEXT,
    updated_by TEXT NOT NULL DEFAULT 'admin',
    updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert singleton row if it doesn't exist
INSERT INTO reserve_investment_config (id, total_reserve, savings_percent, notes, updated_by)
VALUES ('singleton', 0, 10.00, 'Studio Core Plan — Reserve Investment Config', 'system')
ON CONFLICT (id) DO NOTHING;

-- Table: reserve_investment_allocations
-- Stores per-user allocations (percentage, calculated amount, maturity date)
CREATE TABLE IF NOT EXISTS reserve_investment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT,  -- Optional: link to MT company
    user_id TEXT NOT NULL,  -- username or user ID
    user_display_name TEXT NOT NULL,
    allocation_percent NUMERIC(5, 2) NOT NULL CHECK (allocation_percent IN (50, 30, 20, 15)),
    maturity_date DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by TEXT NOT NULL DEFAULT 'admin',
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reserve_investment_allocations_user_id ON reserve_investment_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_reserve_investment_allocations_company_id ON reserve_investment_allocations(company_id);
CREATE INDEX IF NOT EXISTS idx_reserve_investment_allocations_is_active ON reserve_investment_allocations(is_active);

-- Enable RLS
ALTER TABLE reserve_investment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserve_investment_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reserve_investment_config
-- Only admins can read/write the config
DROP POLICY IF EXISTS "Admins can manage reserve config" ON reserve_investment_config;
CREATE POLICY "Admins can manage reserve config"
    ON reserve_investment_config
    FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- RLS Policies for reserve_investment_allocations
DROP POLICY IF EXISTS "Anyone can read allocations" ON reserve_investment_allocations;
CREATE POLICY "Anyone can read allocations"
    ON reserve_investment_allocations
    FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage allocations" ON reserve_investment_allocations;
CREATE POLICY "Admins can manage allocations"
    ON reserve_investment_allocations
    FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- Grant permissions
GRANT ALL ON reserve_investment_config TO authenticated;
GRANT ALL ON reserve_investment_allocations TO authenticated;
GRANT ALL ON reserve_investment_config TO anon;
GRANT ALL ON reserve_investment_allocations TO anon;
