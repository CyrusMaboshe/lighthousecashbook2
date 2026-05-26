
-- SAFE MIGRATION: Fix Studio Documents visibility without deadlock
-- This version avoids DROP TABLE CASCADE which often causes deadlocks on active systems

-- 1. Ensure table exists with correct schema
CREATE TABLE IF NOT EXISTS public.studio_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('editor', 'file')),
  content JSONB, 
  file_url TEXT, 
  file_name TEXT,
  file_size BIGINT,
  author_id TEXT, 
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Relaxed Security Policies
-- First, disable and re-enable RLS to clear any "stuck" states
ALTER TABLE public.studio_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_documents ENABLE ROW LEVEL SECURITY;

-- Create/Update a truly universal policy
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow all" ON public.studio_documents;
    DROP POLICY IF EXISTS "Public access" ON public.studio_documents;
    DROP POLICY IF EXISTS "Users can view all studio documents" ON public.studio_documents;
    DROP POLICY IF EXISTS "Admins can insert studio documents" ON public.studio_documents;
    
    CREATE POLICY "Universal Access" ON public.studio_documents 
    FOR ALL TO public 
    USING (true) 
    WITH CHECK (true);
END $$;

-- 3. Explicit permissions for legacy users
GRANT ALL ON TABLE public.studio_documents TO anon;
GRANT ALL ON TABLE public.studio_documents TO authenticated;

-- 4. Storage Bucket Setup (Safe Insert)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('studio-documents', 'studio-documents', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Universal Storage Policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
    DROP POLICY IF EXISTS "Studio documents storage access" ON storage.objects;
    
    CREATE POLICY "Studio Universal Storage" ON storage.objects 
    FOR ALL TO public 
    USING (bucket_id = 'studio-documents') 
    WITH CHECK (bucket_id = 'studio-documents');
END $$;

-- 6. Real-time (Safe check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'studio_documents'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.studio_documents;
    END IF;
END $$;
