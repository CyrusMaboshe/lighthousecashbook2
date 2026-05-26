
-- Remove multi-tenant structure from database - Fixed Version
-- Drop foreign key constraints and organization-related columns using CASCADE

-- Step 1: Remove organization_id from tables using CASCADE
-- This will also drop the dependent RLS policies automatically.
ALTER TABLE public.transactions DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE public.categories DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE public.admin_logs DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE public.messages DROP COLUMN IF EXISTS organization_id CASCADE;

-- Step 2: Drop organization-related tables completely
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Step 3: Drop any organization-related functions
DROP FUNCTION IF EXISTS public.get_current_user_organization_id() CASCADE;

-- Step 4: Drop existing policies and recreate simple RLS policies for our tables
-- Transactions - Drop all existing policies first
DROP POLICY IF EXISTS "Users can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete transactions" ON public.transactions;

-- Recreate transaction policies
CREATE POLICY "Users can view transactions" ON public.transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update transactions" ON public.transactions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete transactions" ON public.transactions FOR DELETE USING (auth.role() = 'authenticated');

-- Categories - Drop existing policies first
DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories" ON public.categories;

-- Recreate category policies
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert categories" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 5: Ensure realtime is enabled on main tables
-- This might already be set, but we'll ensure it is.
DO $$
BEGIN
    ALTER TABLE public.transactions REPLICA IDENTITY FULL;
    ALTER TABLE public.categories REPLICA IDENTITY FULL;
    ALTER TABLE public.users REPLICA IDENTITY FULL;
EXCEPTION
    WHEN duplicate_object THEN
        -- Already set, ignore
        NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
EXCEPTION
    WHEN duplicate_object THEN
        -- Table is already in publication, ignore
        NULL;
END $$;
