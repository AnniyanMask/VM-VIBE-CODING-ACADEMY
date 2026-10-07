-- MIGRATION: Fix waitlist status check constraint and improve payment status updates
-- This migration ensures the 'waitlist' status is valid in the database and adds missing columns if any.

-- 1. Fix registrations status check
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist'));

-- 2. Fix parent_requests status check (if missing 'waitlist' or 'in_review')
ALTER TABLE public.parent_requests DROP CONSTRAINT IF EXISTS parent_requests_status_check;
ALTER TABLE public.parent_requests ADD CONSTRAINT parent_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'in_review', 'closed'));

-- 3. Ensure payment_schedules has necessary columns
ALTER TABLE public.payment_schedules ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
