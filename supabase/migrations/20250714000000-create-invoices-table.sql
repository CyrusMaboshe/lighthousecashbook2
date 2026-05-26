-- Create invoices table for storing invoice records
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT UNIQUE NOT NULL,
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
  created_by_user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_invoices_invoice_id ON public.invoices(invoice_id);
CREATE INDEX idx_invoices_customer_name ON public.invoices(customer_name);
CREATE INDEX idx_invoices_date ON public.invoices(date);
CREATE INDEX idx_invoices_created_by_user_id ON public.invoices(created_by_user_id);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all invoices" ON public.invoices
  FOR SELECT USING (true);

CREATE POLICY "Users can insert invoices" ON public.invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE USING (created_by_user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
