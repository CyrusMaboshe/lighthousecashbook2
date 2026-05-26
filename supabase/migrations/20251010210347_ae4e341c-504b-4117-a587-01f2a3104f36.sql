-- Create targets table for multi-tenant system
CREATE TABLE IF NOT EXISTS public.mt_company_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.mt_companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  target_date DATE,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_by_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Create todos table for multi-tenant system
CREATE TABLE IF NOT EXISTS public.mt_company_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.mt_companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  assigned_to TEXT,
  created_by_username TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.mt_company_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt_company_todos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for targets
CREATE POLICY "Allow all operations on company targets"
ON public.mt_company_targets
FOR ALL
USING (true);

-- RLS Policies for todos
CREATE POLICY "Allow all operations on company todos"
ON public.mt_company_todos
FOR ALL
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_mt_targets_company ON public.mt_company_targets(company_id);
CREATE INDEX idx_mt_targets_status ON public.mt_company_targets(status);
CREATE INDEX idx_mt_todos_company ON public.mt_company_todos(company_id);
CREATE INDEX idx_mt_todos_status ON public.mt_company_todos(status);

-- Trigger for updated_at
CREATE TRIGGER update_mt_targets_updated_at
BEFORE UPDATE ON public.mt_company_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mt_todos_updated_at
BEFORE UPDATE ON public.mt_company_todos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();