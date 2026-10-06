-- MIGRATION: Unified Robust Seat Management System
-- This migration replaces all existing seat triggers with a single authoritative recalculation system.

-- 1. DROP OBSOLETE TRIGGERS AND FUNCTIONS
DROP TRIGGER IF EXISTS trg_update_slot_seats_left ON public.registrations;
DROP FUNCTION IF EXISTS public.update_slot_seats_left();
DROP TRIGGER IF EXISTS trg_set_initial_seats_left ON public.class_slots;
DROP TRIGGER IF EXISTS trg_sync_registration_seats ON public.registrations;
DROP FUNCTION IF EXISTS public.handle_registration_seat_sync();
DROP TRIGGER IF EXISTS trg_check_registration_seats_before_insert ON public.registrations;
DROP FUNCTION IF EXISTS public.check_seat_availability();

-- 2. ROBUST RECALCULATION FUNCTION
-- This function is the ONLY place where seats_left is calculated.
CREATE OR REPLACE FUNCTION public.recalculate_slot_seats(p_slot_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_seats INTEGER;
    v_occupied_seats INTEGER;
BEGIN
    -- LOCK the row to prevent concurrent updates and ensure latest total_seats
    SELECT total_seats INTO v_total_seats 
    FROM public.class_slots 
    WHERE id = p_slot_id 
    FOR UPDATE;

    IF v_total_seats IS NULL THEN
        RETURN;
    END IF;

    -- Count actual registrations that consume seats (pending or approved)
    SELECT count(*) INTO v_occupied_seats
    FROM public.registrations
    WHERE slot_id = p_slot_id
    AND status IN ('pending', 'approved');

    -- UPDATE seats_left column, clamping to minimum 0
    UPDATE public.class_slots
    SET seats_left = GREATEST(0, v_total_seats - v_occupied_seats)
    WHERE id = p_slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GLOBAL RECALCULATION RPC (For Admin UI)
CREATE OR REPLACE FUNCTION public.recalculate_all_seats()
RETURNS VOID AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.class_slots LOOP
        PERFORM public.recalculate_slot_seats(r.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REGISTRATION CHANGE TRIGGER (AFTER)
-- Syncs seats whenever a registration is created, updated (slot/status change), or deleted.
CREATE OR REPLACE FUNCTION public.handle_registration_seat_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.slot_id IS NOT NULL THEN
            PERFORM public.recalculate_slot_seats(NEW.slot_id);
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only sync if slot or status changed
        IF (OLD.slot_id IS DISTINCT FROM NEW.slot_id OR OLD.status IS DISTINCT FROM NEW.status) THEN
            IF (OLD.slot_id IS NOT NULL) THEN
                PERFORM public.recalculate_slot_seats(OLD.slot_id);
            END IF;
            IF (NEW.slot_id IS NOT NULL) THEN
                PERFORM public.recalculate_slot_seats(NEW.slot_id);
            END IF;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.slot_id IS NOT NULL) THEN
            PERFORM public.recalculate_slot_seats(OLD.slot_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_registration_seats
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.handle_registration_seat_sync();

-- 5. PRE-REGISTRATION SEAT VALIDATION (BEFORE INSERT)
-- Enforces the seat limit at the database level to prevent over-subscription.
CREATE OR REPLACE FUNCTION public.check_seat_availability()
RETURNS TRIGGER AS $$
DECLARE
    v_seats_left INTEGER;
BEGIN
    -- Skip check for waitlisted or rejected
    IF NEW.status NOT IN ('pending', 'approved') THEN
        RETURN NEW;
    END IF;

    -- LOCK and get latest seats_left
    SELECT seats_left INTO v_seats_left
    FROM public.class_slots
    WHERE id = NEW.slot_id
    FOR UPDATE;

    IF v_seats_left IS NULL THEN
        RAISE EXCEPTION 'Class slot not found';
    END IF;

    IF v_seats_left <= 0 THEN
        RAISE EXCEPTION 'No seats available for this class slot';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_registration_seats_before_insert
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.check_seat_availability();

CREATE OR REPLACE FUNCTION public.check_seat_availability_update()
RETURNS TRIGGER AS $$
DECLARE
    v_seats_left INTEGER;
BEGIN
    -- Only check if status is changing TO a seat-consuming state
    -- OR if slot is changing while in a seat-consuming state
    IF (NEW.status IN ('pending', 'approved')) THEN
        IF (OLD.status NOT IN ('pending', 'approved') OR OLD.slot_id IS DISTINCT FROM NEW.slot_id) THEN
            -- LOCK and get latest seats_left
            SELECT seats_left INTO v_seats_left
            FROM public.class_slots
            WHERE id = NEW.slot_id
            FOR UPDATE;

            IF v_seats_left <= 0 THEN
                RAISE EXCEPTION 'No seats available for the selected slot';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_registration_seats_before_update
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.check_seat_availability_update();

-- 6. SLOT INITIALIZATION / UPDATE TRIGGER
-- Ensures seats_left is correct when a slot is created or total_seats is changed.
CREATE OR REPLACE FUNCTION public.sync_slot_on_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If new slot, initial seats_left = total_seats
    IF (TG_OP = 'INSERT') THEN
        NEW.seats_left := NEW.total_seats;
    -- If total_seats changed, we need to recalculate
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.total_seats IS DISTINCT FROM NEW.total_seats) THEN
             -- We can't call recalculate_slot_seats here because it updates the same table
             -- Instead we do it in an AFTER trigger or just let the handle_registration_seat_sync handle it?
             -- Actually, handle_registration_seat_sync only triggers on registrations.
             -- Let's use an AFTER UPDATE trigger for total_seats changes.
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_slot_on_insert
BEFORE INSERT ON public.class_slots
FOR EACH ROW EXECUTE FUNCTION public.sync_slot_on_change();

CREATE OR REPLACE FUNCTION public.handle_slot_update_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.total_seats IS DISTINCT FROM NEW.total_seats) THEN
        PERFORM public.recalculate_slot_seats(NEW.id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_slot_on_update
AFTER UPDATE ON public.class_slots
FOR EACH ROW EXECUTE FUNCTION public.handle_slot_update_sync();

-- 7. INITIAL SYNC OF ALL EXISTING DATA
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.class_slots LOOP
        PERFORM public.recalculate_slot_seats(r.id);
    END LOOP;
END;
$$;

-- 8. REFRESH VIEW
CREATE OR REPLACE VIEW public.slot_availability AS
SELECT 
    s.id as slot_id,
    s.total_seats,
    (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as confirmed_count,
    s.seats_left as seats_left
FROM public.class_slots s;
