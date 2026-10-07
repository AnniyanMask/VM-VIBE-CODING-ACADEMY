-- MIGRATION: Fix RLS for activity_logs table
-- Allows authenticated users to insert logs (needed for frontend activity logging)
-- and ensures admins can still view all logs.

-- 1. Ensure RLS is enabled
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Admin view logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.activity_logs;

-- 3. Policy: Only admins can view logs
CREATE POLICY "Admin view logs" ON public.activity_logs 
FOR SELECT 
USING (public.is_admin());

-- 4. Policy: Authenticated users can insert logs
-- This is required because the frontend calls logActivity() directly
CREATE POLICY "Allow insert for authenticated users" ON public.activity_logs 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 5. Fix RLS for consent_logs
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow parent insert consent logs" ON public.consent_logs;
CREATE POLICY "Allow parent insert consent logs" ON public.consent_logs 
FOR INSERT 
WITH CHECK (auth.uid() = parent_id);

-- 6. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
