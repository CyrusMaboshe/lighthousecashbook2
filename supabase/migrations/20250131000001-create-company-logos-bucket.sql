-- Create storage bucket for company logos
-- This allows companies to upload and store their custom logos

-- Create the company-logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the company-logos bucket
CREATE POLICY "Company admins can upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Company logos are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Company admins can update their logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Company admins can delete their logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-logos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Add branding settings to company settings if not already present
-- This ensures existing companies have the new branding fields
DO $$
BEGIN
  -- Update existing companies to include branding settings
  UPDATE public.mt_companies 
  SET settings = settings || jsonb_build_object(
    'business_type', 'general',
    'primary_color', '#3B82F6',
    'secondary_color', '#8B5CF6',
    'accent_color', '#10B981',
    'business_icon', 'Briefcase',
    'show_business_metrics', true,
    'metric_name', 'items',
    'metric_icon', 'Building2'
  )
  WHERE NOT (settings ? 'business_type');
  
  RAISE NOTICE 'Updated existing companies with branding settings';
END $$;
