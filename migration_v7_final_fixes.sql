-- MIGRATION: Comprehensive Fix for registrations table columns and relationships
-- This migration fixes missing columns and type mismatches that are preventing admin views from loading.

-- 1. Ensure all expected columns exist on registrations
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS lead_source TEXT;

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 2. Fix payment_plan_id relationship
-- Drop if exists to avoid conflicts
ALTER TABLE public.registrations 
DROP CONSTRAINT IF EXISTS registrations_payment_plan_id_fkey;

-- Convert type to UUID. We handle cases where data might be 'undefined' or empty strings.
-- Also handle cases where it's already UUID but currently viewed as TEXT.
ALTER TABLE public.registrations 
ALTER COLUMN payment_plan_id TYPE UUID 
USING (
  CASE 
    WHEN payment_plan_id IS NULL OR trim(payment_plan_id::text) = '' OR trim(payment_plan_id::text) = 'undefined' THEN NULL
    ELSE payment_plan_id::UUID 
  END
);

-- Re-add the foreign key
ALTER TABLE public.registrations 
ADD CONSTRAINT registrations_payment_plan_id_fkey 
FOREIGN KEY (payment_plan_id) 
REFERENCES public.payment_plans(id) 
ON DELETE SET NULL;

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
