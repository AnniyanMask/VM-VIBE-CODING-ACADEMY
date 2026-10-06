-- SEAT SAFETY MIGRATION
-- This migration ensures seats_left is accurate and adds a strict check before registration.

-- 1. Function to recalculate seats_left for a slot
CREATE OR REPLACE FUNCTION public.recalculate_slot_seats(target_slot_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.class_slots s
    SET seats_left = s.total_seats - (
        SELECT count(*) 
        FROM public.registrations r 
        WHERE r.slot_id = s.id 
        AND r.status IN ('pending', 'approved')
    )
    WHERE s.id = target_slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.recalculate_slot_seats_all()
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

-- 2. Force recalculate ALL slots now
UPDATE public.class_slots s
SET seats_left = s.total_seats - (
    SELECT count(*) 
    FROM public.registrations r 
    WHERE r.slot_id = s.id 
    AND r.status IN ('pending', 'approved')
);

-- 3. Strict Before-Registration Check
-- This ensures we never even try to insert if seats are full
CREATE OR REPLACE FUNCTION public.check_registration_seats()
RETURNS trigger AS $$
DECLARE
    v_seats_left INTEGER;
BEGIN
    SELECT seats_left INTO v_seats_left
    FROM public.class_slots
    WHERE id = NEW.slot_id;

    IF v_seats_left <= 0 THEN
        RAISE EXCEPTION 'This class slot is already full. Please select another slot.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_registration_seats ON public.registrations;
CREATE TRIGGER trg_check_registration_seats
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.check_registration_seats();

-- 4. Improved After-Registration Update
CREATE OR REPLACE FUNCTION public.update_slot_seats_left()
RETURNS trigger AS $$
BEGIN
  -- Handle Insert
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status IN ('pending', 'approved')) THEN
      UPDATE public.class_slots 
      SET seats_left = seats_left - 1
      WHERE id = NEW.slot_id;
    END IF;
  -- Handle Update
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Status changed TO confirmed
    IF (NEW.status IN ('pending', 'approved') AND OLD.status NOT IN ('pending', 'approved')) THEN
      UPDATE public.class_slots 
      SET seats_left = seats_left - 1
      WHERE id = NEW.slot_id;
    -- Status changed FROM confirmed
    ELSIF (OLD.status IN ('pending', 'approved') AND NEW.status NOT IN ('pending', 'approved')) THEN
      UPDATE public.class_slots 
      SET seats_left = seats_left + 1
      WHERE id = NEW.slot_id;
    -- Slot changed
    ELSIF (OLD.slot_id <> NEW.slot_id) THEN
      -- Remove from old slot if it was confirmed
      IF (OLD.status IN ('pending', 'approved')) THEN
        UPDATE public.class_slots SET seats_left = seats_left + 1 WHERE id = OLD.slot_id;
      END IF;
      -- Add to new slot if it is confirmed
      IF (NEW.status IN ('pending', 'approved')) THEN
        UPDATE public.class_slots SET seats_left = seats_left - 1 WHERE id = NEW.slot_id;
      END IF;
    END IF;
  -- Handle Delete
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.status IN ('pending', 'approved')) THEN
      UPDATE public.class_slots 
      SET seats_left = seats_left + 1
      WHERE id = OLD.slot_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
