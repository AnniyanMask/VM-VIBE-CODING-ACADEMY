-- MIGRATION: Fix Relationship and Column Type between registrations and payment_plans
-- This migration ensures the column type is correct and the foreign key exists.

-- 1. Drop existing constraint if it exists
ALTER TABLE public.registrations
DROP CONSTRAINT IF EXISTS registrations_payment_plan_id_fkey;

-- 2. Convert column type to UUID (using USING clause to cast existing values)
-- We use NULLIF and trim to handle potential empty strings or invalid data
ALTER TABLE public.registrations
ALTER COLUMN payment_plan_id TYPE UUID 
USING (NULLIF(trim(payment_plan_id), '')::UUID);

-- 3. Add foreign key constraint
ALTER TABLE public.registrations
ADD CONSTRAINT registrations_payment_plan_id_fkey 
FOREIGN KEY (payment_plan_id) 
REFERENCES public.payment_plans(id)
ON DELETE SET NULL;

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
