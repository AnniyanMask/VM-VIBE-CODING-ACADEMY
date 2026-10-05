-- MIGRATION: Fix Class Slot seat logic
-- Run this in your Supabase SQL Editor

-- 1. Add seats_left column if it doesn't exist
ALTER TABLE public.class_slots 
ADD COLUMN IF NOT EXISTS seats_left INTEGER;

-- 2. Data Repair: Calculate seats_left accurately for existing rows
UPDATE public.class_slots s
SET seats_left = total_seats - (
    SELECT count(*) 
    FROM public.registrations r 
    WHERE r.slot_id = s.id 
    AND r.status IN ('pending', 'approved')
);

-- 3. Enforce NOT NULL constraint
ALTER TABLE public.class_slots 
ALTER COLUMN seats_left SET NOT NULL;

-- 4. Create trigger function for slot creation safety
CREATE OR REPLACE FUNCTION public.set_initial_seats_left()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.seats_left IS NULL THEN
    NEW.seats_left := NEW.total_seats;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Attach slot creation trigger
DROP TRIGGER IF EXISTS trg_set_initial_seats_left
ON public.class_slots;

CREATE TRIGGER trg_set_initial_seats_left
BEFORE INSERT ON public.class_slots
FOR EACH ROW
EXECUTE FUNCTION public.set_initial_seats_left();

-- 6. Trigger to update seats_left when registration status changes or new registration added
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

DROP TRIGGER IF EXISTS trg_update_slot_seats_left ON public.registrations;
CREATE TRIGGER trg_update_slot_seats_left
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.update_slot_seats_left();

-- 7. Update view to use seats_left column directly
CREATE OR REPLACE VIEW public.slot_availability AS
SELECT 
    s.id as slot_id,
    s.total_seats,
    (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as confirmed_count,
    s.seats_left as seats_left
FROM public.class_slots s;
