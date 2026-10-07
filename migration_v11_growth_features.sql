-- MIGRATION: Growth & Marketing Features
-- 1. Add referral system to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

-- 2. Add project URL to registrations for sharing
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS project_url TEXT;

-- 3. Function to generate referral code if missing
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Update existing profiles with referral codes
UPDATE public.profiles SET referral_code = UPPER(SUBSTRING(MD5(id::TEXT), 1, 8)) WHERE referral_code IS NULL;

-- Update handle_new_user trigger to handle referrals
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_by UUID;
BEGIN
  -- Look up referrer if code provided
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    SELECT id INTO ref_by FROM public.profiles WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    'parent',
    ref_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed Referral Program Settings
INSERT INTO public.site_settings (key, value) VALUES
('referral_program', '{"reward_amount": 50, "is_active": true, "description": "Reward given to both referrer and referee on successful signup and payment."}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. Notify PostgREST
NOTIFY pgrst, 'reload schema';
