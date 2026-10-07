-- MIGRATION: Add custom installment breakdown to payment plans
-- This allows for non-equal installment amounts (e.g. RM 160 then RM 320)

ALTER TABLE public.payment_plans 
ADD COLUMN IF NOT EXISTS installment_breakdown TEXT;

COMMENT ON COLUMN public.payment_plans.installment_breakdown IS 'Comma-separated amounts for each installment, e.g. "160, 320". If empty, total fee is split equally.';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
