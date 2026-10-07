-- MIGRATION: Additional Features (Revenue Forecasting, Idea Sandbox, Badge System)

-- 1. Idea Sandbox
CREATE TABLE IF NOT EXISTS public.student_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructor_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Achievement Badge System
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Lucide icon name or emoji
    criteria TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(registration_id, badge_id)
);

-- 3. Revenue Forecasting View
CREATE OR REPLACE VIEW public.revenue_stats AS
WITH expected AS (
    SELECT 
        DATE_TRUNC('month', due_date) as month,
        SUM(amount) as expected_amount
    FROM public.payment_schedules
    GROUP BY 1
),
received AS (
    SELECT 
        DATE_TRUNC('month', p.created_at) as month,
        SUM(p.amount) as actual_amount
    FROM public.payments p
    WHERE p.status = 'verified'
    GROUP BY 1
)
SELECT 
    COALESCE(e.month, r.month) as month,
    COALESCE(e.expected_amount, 0) as expected,
    COALESCE(r.actual_amount, 0) as actual
FROM expected e
FULL OUTER JOIN received r ON e.month = r.month
ORDER BY month DESC;

-- RLS Policies
ALTER TABLE public.student_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own ideas" ON public.student_ideas 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM registrations 
        WHERE registrations.id = student_ideas.registration_id 
        AND (registrations.parent_id = auth.uid() OR registrations.student_user_id = auth.uid())
    ) 
    OR public.is_admin()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admin manage badges" ON public.badges FOR ALL USING (public.is_admin());

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone view student_badges" ON public.student_badges FOR SELECT USING (true);
CREATE POLICY "Admin award badges" ON public.student_badges FOR ALL USING (public.is_admin());

-- Seed initial badges
INSERT INTO public.badges (name, description, icon, criteria) VALUES
('Attendance Streak', 'Attended 4 classes in a row', 'Zap', '4 consecutive attendances'),
('AI Prompt Master', 'Mastered the art of engineering prompts', 'Brain', 'Complete AI module'),
('First App Launched', 'Successfully deployed first project', 'Rocket', 'First project URL added'),
('Helpful Peer', 'Helped others in class', 'Heart', 'Instructor nomination')
ON CONFLICT DO NOTHING;
