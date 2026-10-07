-- MIGRATION: Revenue Forecasting, Idea Sandbox, and Badges
-- 1. Student Ideas (Sandbox)
CREATE TABLE IF NOT EXISTS public.student_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    instructor_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Achievement Badges
CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_key TEXT NOT NULL, -- Key for frontend icons
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    awarded_by UUID REFERENCES public.profiles(id),
    UNIQUE(registration_id, badge_id)
);

-- 3. Seed some badges
INSERT INTO public.badge_definitions (name, description, icon_key, category) VALUES
('Early Bird', 'Registered during the priority window.', 'Clock', 'milestone'),
('First App Launched', 'Successfully deployed their first live application.', 'Rocket', 'achievement'),
('AI Prompt Master', 'Demonstrated exceptional skill in AI prompt engineering.', 'Sparkles', 'skill'),
('Perfect Attendance', 'Attended all classes in a single month.', 'CheckCircle2', 'streak'),
('Team Player', 'Helped a fellow student with a coding bug.', 'Users', 'social')
ON CONFLICT (name) DO NOTHING;

-- 4. RLS Policies
ALTER TABLE public.student_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students manage own ideas" ON public.student_ideas;
CREATE POLICY "Students manage own ideas" ON public.student_ideas 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.registrations 
        WHERE registrations.id = student_ideas.registration_id 
        AND registrations.student_user_id = auth.uid()
    ) OR public.is_admin()
);

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read badges" ON public.student_badges;
CREATE POLICY "Public read badges" ON public.student_badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage student_badges" ON public.student_badges;
CREATE POLICY "Admin manage student_badges" ON public.student_badges FOR ALL USING (public.is_admin());

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read badge_definitions" ON public.badge_definitions;
CREATE POLICY "Public read badge_definitions" ON public.badge_definitions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage badge_definitions" ON public.badge_definitions;
CREATE POLICY "Admin manage badge_definitions" ON public.badge_definitions FOR ALL USING (public.is_admin());

-- 5. Notify PostgREST
NOTIFY pgrst, 'reload schema';
