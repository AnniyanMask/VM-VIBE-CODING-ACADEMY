-- Robust DBA Migration: Schema Alignment & Dependency Handling
-- Run this in your Supabase SQL Editor

-- 1. Drop dependent objects that block schema changes
-- This prevents the "cannot drop column because other objects depend on it" error
DROP VIEW IF EXISTS public.slot_availability;

-- 2. Atomic Schema Adjustments
DO $$ 
BEGIN
    -- Handle class_slots.capacity -> total_seats
    -- This handles the specific constraint error you encountered
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class_slots' AND column_name='capacity') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class_slots' AND column_name='total_seats') THEN
            ALTER TABLE public.class_slots RENAME COLUMN capacity TO total_seats;
        ELSE
            -- Both exist (e.g. if previous run partially failed)
            -- Sync data from old column to new column before dropping
            UPDATE public.class_slots SET total_seats = capacity WHERE total_seats IS NULL;
            ALTER TABLE public.class_slots DROP COLUMN capacity;
        END IF;
    END IF;

    -- Handle payments.schedule_id -> payment_schedule_id
    -- This fixes the payment relationship error
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='schedule_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='payment_schedule_id') THEN
            ALTER TABLE public.payments RENAME COLUMN schedule_id TO payment_schedule_id;
        ELSE
            -- Both exist
            UPDATE public.payments SET payment_schedule_id = schedule_id WHERE payment_schedule_id IS NULL;
            ALTER TABLE public.payments DROP COLUMN schedule_id;
        END IF;
    END IF;
END $$;

-- 3. Restore Views with new column names
CREATE OR REPLACE VIEW public.slot_availability AS
SELECT 
    s.id as slot_id,
    s.total_seats,
    (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as confirmed_count,
    s.total_seats - (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as seats_left
FROM public.class_slots s;

-- 4. Feature: Student Dashboard Linkage
-- Add student_user_id to registrations if missing
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS student_user_id UUID REFERENCES public.profiles(id);

-- 5. Permissions (RLS Policy Refresh)
-- Ensures students can view their own data
DROP POLICY IF EXISTS "View registrations" ON public.registrations;
CREATE POLICY "View registrations" ON public.registrations FOR SELECT 
USING (auth.uid() = parent_id OR auth.uid() = student_user_id OR public.is_admin());

DROP POLICY IF EXISTS "View attendance" ON public.attendance;
CREATE POLICY "View attendance" ON public.attendance FOR SELECT 
USING (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = attendance.registration_id AND (registrations.parent_id = auth.uid() OR registrations.student_user_id = auth.uid())) OR public.is_admin());

DROP POLICY IF EXISTS "View progress" ON public.student_progress;
CREATE POLICY "View progress" ON public.student_progress FOR SELECT 
USING (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = student_progress.registration_id AND (registrations.parent_id = auth.uid() OR registrations.student_user_id = auth.uid())) OR public.is_admin());

-- 6. Fix Payment Plans amount -> fee rename (matches user DB error)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_plans' AND column_name='amount') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_plans' AND column_name='fee') THEN
            ALTER TABLE public.payment_plans RENAME COLUMN amount TO fee;
        ELSE
            -- Both exist
            UPDATE public.payment_plans SET fee = amount WHERE fee IS NULL;
            ALTER TABLE public.payment_plans DROP COLUMN amount;
        END IF;
    END IF;
END $$;
