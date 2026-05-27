-- ================================================================
-- MULTI-TENANT SUBSCRIPTION & PAYROLL MANAGEMENT
-- Migration: 20260528000000-add-subscription-payroll-tables.sql
-- ================================================================

-- ---------------------------------------------------------------
-- 1. COMPANY SUBSCRIPTIONS TABLE
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mt_company_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES public.mt_companies(id) ON DELETE CASCADE,

  -- Plan details
  plan_name    TEXT NOT NULL DEFAULT 'Basic',
  plan_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'ZMW',

  -- Billing cycle
  billing_period TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_period IN ('monthly','quarterly','annually','custom')),
  start_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date  DATE,              -- NULL = never expires

  -- Status
  status       TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','expired','cancelled','trial')),

  -- Notes
  notes        TEXT,

  -- Timestamps
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- 2. SUBSCRIPTION PAYMENT HISTORY TABLE
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mt_subscription_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  UUID NOT NULL REFERENCES public.mt_company_subscriptions(id) ON DELETE CASCADE,
  company_id       UUID NOT NULL REFERENCES public.mt_companies(id) ON DELETE CASCADE,

  amount           NUMERIC(12,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'ZMW',
  payment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method   TEXT DEFAULT 'manual',
  reference        TEXT,
  recorded_by      TEXT,          -- super admin email or name
  notes            TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- 3. COMPANY PAYROLL TABLE
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mt_company_payroll (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.mt_companies(id) ON DELETE CASCADE,

  employee_name   TEXT NOT NULL,
  position        TEXT,
  salary          NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'ZMW',

  -- Pay period
  pay_period      TEXT NOT NULL DEFAULT 'monthly'
    CHECK (pay_period IN ('weekly','bi-weekly','monthly','custom')),
  period_label    TEXT,           -- e.g. "May 2026"
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Status
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','cancelled')),

  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- 4. INDEXES
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_mt_subs_company_id   ON public.mt_company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_mt_subs_status        ON public.mt_company_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_mt_subs_expiry        ON public.mt_company_subscriptions(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mt_payments_company   ON public.mt_subscription_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_mt_payroll_company    ON public.mt_company_payroll(company_id);

-- ---------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------
ALTER TABLE public.mt_company_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt_subscription_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt_company_payroll        ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (app handles auth in JS layer just like all other mt_ tables)
CREATE POLICY "Allow all on mt_company_subscriptions"
  ON public.mt_company_subscriptions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on mt_subscription_payments"
  ON public.mt_subscription_payments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on mt_company_payroll"
  ON public.mt_company_payroll FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------
-- 6. UPDATED_AT TRIGGERS
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mt_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mt_subs_updated_at   ON public.mt_company_subscriptions;
CREATE TRIGGER trg_mt_subs_updated_at
  BEFORE UPDATE ON public.mt_company_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.mt_set_updated_at();

DROP TRIGGER IF EXISTS trg_mt_payroll_updated_at ON public.mt_company_payroll;
CREATE TRIGGER trg_mt_payroll_updated_at
  BEFORE UPDATE ON public.mt_company_payroll
  FOR EACH ROW EXECUTE FUNCTION public.mt_set_updated_at();

-- ---------------------------------------------------------------
-- 7. HELPER: CHECK COMPANY ACCESS (used by login flow)
-- ---------------------------------------------------------------
-- Returns the active subscription for a company, or NULL if blocked/expired
CREATE OR REPLACE FUNCTION public.check_company_subscription_access(p_company_id UUID)
RETURNS JSONB AS $$
DECLARE
  sub RECORD;
BEGIN
  SELECT * INTO sub
  FROM public.mt_company_subscriptions
  WHERE company_id = p_company_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- No subscription row = allow (legacy / unmanaged companies)
  IF NOT FOUND THEN
    RETURN jsonb_build_object('has_access', true, 'reason', 'no_subscription');
  END IF;

  IF sub.status = 'suspended' OR sub.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', sub.status,
      'plan_name', sub.plan_name
    );
  END IF;

  IF sub.expiry_date IS NOT NULL AND sub.expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'reason', 'subscription_expired',
      'expired_on', sub.expiry_date,
      'plan_name', sub.plan_name
    );
  END IF;

  RETURN jsonb_build_object(
    'has_access', true,
    'reason', 'active',
    'plan_name', sub.plan_name,
    'expiry_date', sub.expiry_date,
    'status', sub.status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- 8. COMMENTS
-- ---------------------------------------------------------------
COMMENT ON TABLE public.mt_company_subscriptions IS 'Subscription plans per company tenant – managed manually by super admin';
COMMENT ON TABLE public.mt_subscription_payments IS 'Manual payment records for each subscription period';
COMMENT ON TABLE public.mt_company_payroll       IS 'Employee payroll records per company tenant';
