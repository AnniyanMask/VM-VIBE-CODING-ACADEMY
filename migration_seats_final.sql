-- SENIOR PROGRAMMER DEFINITIVE SEAT FIX
-- This migration unifies seat logic, repairs data, and ensures UI/DB consistency.

-- 1. DROP OLD/CONFLICTING OBJECTS
-- Drop triggers that might be using old logic or wrong messages
DROP TRIGGER IF EXISTS trg_check_registration_seats ON public.registrations;
DROP TRIGGER IF EXISTS trg_update_slot_seats_left ON public.registrations;
DROP TRIGGER IF EXISTS trg_set_initial_seats_left ON public.class_slots;

-- 2. REPAIR DATA
-- Recalculate seats_left column based on actual approved/pending registrations
UPDATE public.class_slots s
SET seats_left = s.total_seats - (
    SELECT count(*) 
    FROM public.registrations r 
    WHERE r.slot_id = s.id 
    AND r.status IN ('pending', 'approved')
);

-- 3. UNIFIED TRIGGER FUNCTION
-- This function handles all registration changes to keep seats_left in sync
CREATE OR REPLACE FUNCTION public.sync_slot_seats()
RETURNS trigger AS $$
BEGIN
  -- Handle NEW registrations or STATUS changes to confirmed
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status IN ('pending', 'approved')) THEN
      UPDATE public.class_slots SET seats_left = seats_left - 1 WHERE id = NEW.slot_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If slot changed, adjust both
    IF (OLD.slot_id <> NEW.slot_id) THEN
      IF (OLD.status IN ('pending', 'approved')) THEN
        UPDATE public.class_slots SET seats_left = seats_left + 1 WHERE id = OLD.slot_id;
      END IF;
      IF (NEW.status IN ('pending', 'approved')) THEN
        UPDATE public.class_slots SET seats_left = seats_left - 1 WHERE id = NEW.slot_id;
      END IF;
    -- If status changed
    ELSIF (OLD.status <> NEW.status) THEN
      IF (NEW.status IN ('pending', 'approved') AND OLD.status NOT IN ('pending', 'approved')) THEN
        UPDATE public.class_slots SET seats_left = seats_left - 1 WHERE id = NEW.slot_id;
      ELSIF (OLD.status IN ('pending', 'approved') AND NEW.status NOT IN ('pending', 'approved')) THEN
        UPDATE public.class_slots SET seats_left = seats_left + 1 WHERE id = NEW.slot_id;
      END IF;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.status IN ('pending', 'approved')) THEN
      UPDATE public.class_slots SET seats_left = seats_left + 1 WHERE id = OLD.slot_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_slot_seats
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.sync_slot_seats();

-- 4. STRICT SAFETY CHECK (BEFORE INSERT)
-- This is where the error message the user wants should be handled
CREATE OR REPLACE FUNCTION public.validate_registration_seats()
RETURNS trigger AS $$
DECLARE
    v_seats_left INTEGER;
BEGIN
    -- Get current seats_left directly from the table
    SELECT seats_left INTO v_seats_left
    FROM public.class_slots
    WHERE id = NEW.slot_id
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF v_seats_left <= 0 THEN
        -- Using the EXACT error message seen in the user's report to ensure we overwrite any old ones
        RAISE EXCEPTION 'No seats available for this class slot';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_registration_seats
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_registration_seats();

-- 5. ROBUST VIEW (Security Definer)
-- This view is used by the UI to show availability
CREATE OR REPLACE VIEW public.slot_availability WITH (security_barrier) AS
SELECT 
    s.id as slot_id,
    s.total_seats,
    (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as confirmed_count,
    s.seats_left
FROM public.class_slots s;

-- Ensure public access to the view
GRANT SELECT ON public.slot_availability TO anon, authenticated;

-- 6. SYNC UTILITY FOR ADMIN
CREATE OR REPLACE FUNCTION public.recalculate_all_seats()
RETURNS void AS $$
BEGIN
    UPDATE public.class_slots s
    SET seats_left = s.total_seats - (
        SELECT count(*) 
        FROM public.registrations r 
        WHERE r.slot_id = s.id 
        AND r.status IN ('pending', 'approved')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
