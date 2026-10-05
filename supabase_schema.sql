-- FULL SQL SCHEMA FOR VM VIBE CODING ACADEMY (v2)

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Site Settings (Flat Key-Value for configuration)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Website Content (Hero, Safety, etc.)
CREATE TABLE IF NOT EXISTS public.site_content (
    section_id TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Project Examples
CREATE TABLE IF NOT EXISTS public.project_examples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    gradient TEXT NOT NULL, -- e.g., "from-blue-500 to-indigo-600"
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    num_classes INTEGER NOT NULL,
    class_duration_minutes INTEGER NOT NULL,
    syllabus JSONB, -- Array of objects {week, topic}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Age Groups
CREATE TABLE IF NOT EXISTS public.age_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Payment Plans
CREATE TABLE IF NOT EXISTS public.payment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    installment_count INTEGER DEFAULT 1,
    children_count INTEGER DEFAULT 1,
    effective_from DATE,
    effective_to DATE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Class Slots
CREATE TABLE IF NOT EXISTS public.class_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    age_group_id UUID REFERENCES public.age_groups(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL,
    start_date DATE NOT NULL,
    capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Registrations
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id),
    group_id UUID, -- For linking siblings together
    enquiry_id UUID REFERENCES public.enquiries(id), -- Link to originating lead
    student_name TEXT NOT NULL,
    student_dob DATE NOT NULL,
    school TEXT,
    experience_level TEXT,
    slot_id UUID REFERENCES public.class_slots(id),
    payment_plan_id UUID REFERENCES public.payment_plans(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist')),
    lead_source TEXT,
    terms_accepted_at TIMESTAMPTZ,
    media_consent BOOLEAN DEFAULT false,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Sibling Requests
CREATE TABLE IF NOT EXISTS public.sibling_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    message TEXT,
    admin_remarks TEXT,
    offered_slot_id UUID REFERENCES public.class_slots(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Payments
CREATE TABLE IF NOT EXISTS public.payment_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    group_id UUID,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partially_paid')),
    installment_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID REFERENCES public.payment_schedules(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.profiles(id),
    amount DECIMAL(10, 2) NOT NULL,
    slip_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'replacement_requested')),
    admin_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    class_date DATE NOT NULL,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Student Progress
CREATE TABLE IF NOT EXISTS public.student_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    milestone_name TEXT,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'parent', 'student')),
    target_age_group_id UUID REFERENCES public.age_groups(id),
    publish_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Enquiries (Free Trial)
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    student_name TEXT,
    student_age INTEGER,
    message TEXT,
    source TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'trial_booked', 'registered', 'closed', 'incomplete')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL, -- e.g., 'registration_status_update'
    entity_type TEXT NOT NULL, -- e.g., 'registrations'
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage enquiries" ON public.enquiries FOR ALL USING (public.is_admin());

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view logs" ON public.activity_logs FOR SELECT USING (public.is_admin());

-- Seed Message Templates & Registration Status
INSERT INTO public.site_settings (key, value) VALUES
('registration_control', '{"status": "open"}'),
('message_templates', '{
    "whatsapp_welcome": "Hi {{parent_name}}! Welcome to VM Vibe Academy. We have received your registration for {{student_name}}.",
    "whatsapp_approved": "Good news! {{student_name}}''s registration has been approved. Please proceed to payment in your dashboard.",
    "email_trial_invite": "Hi {{parent_name}}, thank you for your enquiry. We would like to invite you for a free trial session.",
    "whatsapp_waitlist": "Hi {{parent_name}}, {{student_name}} has been placed on the waitlist for the {{slot_name}} slot. We will notify you once a seat opens up."
}')
ON CONFLICT (key) DO NOTHING;

-- Automated Activity Logging Function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    auth.uid(),
    TG_OP || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    NEW.id,
    row_to_json(OLD)::jsonb,
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log Registration updates
CREATE TRIGGER on_registration_update
  AFTER UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- 19. Parent Requests (Slot change, make-up, withdrawal, data changes)
CREATE TABLE IF NOT EXISTS public.parent_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('slot_change', 'makeup_class', 'withdrawal', 'data_correction')),
    details JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
    admin_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'alert', 'success', 'info'
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Consent Logs
CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id),
    media_consent BOOLEAN NOT NULL,
    action TEXT NOT NULL, -- 'initial', 'updated'
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Payment Accounts (Bank details)
CREATE TABLE IF NOT EXISTS public.payment_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    duitnow_id TEXT,
    reference_note TEXT,
    payment_notes TEXT,
    qr_path TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE public.parent_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents manage own requests" ON public.parent_requests FOR ALL USING (auth.uid() = parent_id OR public.is_admin());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id OR public.is_admin());

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents view own consent logs" ON public.consent_logs FOR SELECT USING (auth.uid() = parent_id OR public.is_admin());

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logged in users can view active payment accounts" ON public.payment_accounts FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
CREATE POLICY "Admins can manage payment accounts" ON public.payment_accounts FOR ALL USING (public.is_admin());

-- Storage Policies for payment-qr bucket
-- (Bucket 'payment-qr' must be created in Supabase Dashboard)
CREATE POLICY "Allow logged in users to view QR codes" ON storage.objects FOR SELECT USING (bucket_id = 'payment-qr' AND auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage QR codes" ON storage.objects FOR ALL USING (bucket_id = 'payment-qr' AND public.is_admin());

-- Seed Additional Settings
INSERT INTO public.site_settings (key, value) VALUES
('bank_info', '{
    "bank_name": "Maybank",
    "account_name": "VM VIBE ACADEMY SDN BHD",
    "account_number": "564012345678",
    "qr_url": "https://example.com/qr-sample.png",
    "instructions": "Please include your child''s name in the reference field."
}'),
('course_checklist', '[
    {"item": "Laptop (Windows/Mac/Chromebook)", "required": true},
    {"item": "Charger", "required": true},
    {"item": "Google Account (Parent-managed or student''s own)", "required": true},
    {"item": "Water bottle & Jacket (Venue is air-conditioned)", "required": false}
]')
ON CONFLICT (key) DO NOTHING;

-- Trigger to notify parent on status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status <> NEW.status) THEN
    INSERT INTO public.notifications (user_id, title, content, type)
    VALUES (
      NEW.parent_id,
      'Registration Update: ' || NEW.student_name,
      'Status changed to ' || NEW.status || '. Check your dashboard for details.',
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_registration_status_notify
  AFTER UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();

-- General helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Admin see all, Users see only own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View profile" ON public.profiles;
DROP POLICY IF EXISTS "Update profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;

CREATE POLICY "View profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Update profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Payment Schedules
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View schedules" ON public.payment_schedules;
DROP POLICY IF EXISTS "Admin manage schedules" ON public.payment_schedules;
CREATE POLICY "View schedules" ON public.payment_schedules FOR SELECT USING (auth.uid() = parent_id OR public.is_admin());
CREATE POLICY "Admin manage schedules" ON public.payment_schedules FOR ALL USING (public.is_admin());

-- Payments: Parent see own, Admin see all, Parent insert
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View payments" ON public.payments;
DROP POLICY IF EXISTS "Insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
CREATE POLICY "View payments" ON public.payments FOR SELECT USING (auth.uid() = parent_id OR public.is_admin());
CREATE POLICY "Insert payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL USING (public.is_admin());

-- Prevent non-admins from changing roles
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (NOT public.is_admin()) THEN
    NEW.role := OLD.role; -- Force role to stay same if not admin
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

-- Auth Trigger: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    'parent'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pending Registrations (for email confirmation flow)
CREATE TABLE IF NOT EXISTS public.pending_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    registration_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert pending_registrations" ON public.pending_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage pending_registrations" ON public.pending_registrations FOR ALL USING (public.is_admin());

-- Seat Availability View
CREATE OR REPLACE VIEW public.slot_availability AS
SELECT 
    s.id as slot_id,
    s.capacity,
    (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as confirmed_count,
    s.capacity - (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as seats_left
FROM public.class_slots s;

-- Storage: payment-slips
-- Note: Buckets must be created via UI or RPC, but policies can be SQL
-- Policy: Parents upload to their own folder (auth.uid()/filename)
-- Policy: Parents read their own folder
-- Policy: Admin read all

CREATE POLICY "Allow parent upload slips" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'payment-slips' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow parent view own slips" ON storage.objects FOR SELECT USING (
    bucket_id = 'payment-slips' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow admin view all slips" ON storage.objects FOR SELECT USING (
    bucket_id = 'payment-slips' 
    AND public.is_admin()
);

-- Site Settings & Content: Public read, Admin write
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin write site_settings" ON public.site_settings FOR ALL USING (public.is_admin());

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admin write site_content" ON public.site_content FOR ALL USING (public.is_admin());

-- FAQs, Testimonials, Projects: Public read active, Admin write all
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin write faqs" ON public.faqs FOR ALL USING (public.is_admin());

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin write testimonials" ON public.testimonials FOR ALL USING (public.is_admin());

ALTER TABLE public.project_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read project_examples" ON public.project_examples FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin write project_examples" ON public.project_examples FOR ALL USING (public.is_admin());

-- Courses, Age Groups, Plans, Slots: Public read active, Admin write all
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin write courses" ON public.courses FOR ALL USING (public.is_admin());

ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read age_groups" ON public.age_groups FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin write age_groups" ON public.age_groups FOR ALL USING (public.is_admin());

ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read payment_plans" ON public.payment_plans FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin write payment_plans" ON public.payment_plans FOR ALL USING (public.is_admin());

ALTER TABLE public.class_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read class_slots" ON public.class_slots FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin write class_slots" ON public.class_slots FOR ALL USING (public.is_admin());

-- Registrations: Parent see own, Admin see all, Parent insert
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View registrations" ON public.registrations FOR SELECT USING (auth.uid() = parent_id OR public.is_admin());
CREATE POLICY "Insert registrations" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Admin manage registrations" ON public.registrations FOR ALL USING (public.is_admin());

-- Payments: Parent see own, Admin see all, Parent insert
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View payments" ON public.payments FOR SELECT USING (auth.uid() = parent_id OR public.is_admin());
CREATE POLICY "Insert payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL USING (public.is_admin());

-- Attendance, Progress, Sibling Requests, Announcements: User see relevant, Admin write
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View attendance" ON public.attendance FOR SELECT USING (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = attendance.registration_id AND (registrations.parent_id = auth.uid())) OR public.is_admin());
CREATE POLICY "Admin manage attendance" ON public.attendance FOR ALL USING (public.is_admin());

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View progress" ON public.student_progress FOR SELECT USING (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = student_progress.registration_id AND (registrations.parent_id = auth.uid())) OR public.is_admin());
CREATE POLICY "Admin manage progress" ON public.student_progress FOR ALL USING (public.is_admin());

ALTER TABLE public.sibling_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View siblings" ON public.sibling_requests FOR SELECT USING (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = sibling_requests.registration_id AND (registrations.parent_id = auth.uid())) OR public.is_admin());
CREATE POLICY "Insert siblings" ON public.sibling_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = registration_id AND registrations.parent_id = auth.uid()));
CREATE POLICY "Admin manage siblings" ON public.sibling_requests FOR ALL USING (public.is_admin());

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View announcements" ON public.announcements FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "Admin manage announcements" ON public.announcements FOR ALL USING (public.is_admin());

-- SEED DATA UPDATE

-- 1. Site Settings
INSERT INTO public.site_settings (key, value) VALUES
('contact', '{
    "phone": "+60 12-345 6789",
    "whatsapp": "+60123456789",
    "email": "hello@vmvibe.my",
    "address": "123 Jalan Ampang, Kuala Lumpur, 50450, Malaysia",
    "maps_link": "https://goo.gl/maps/example",
    "facebook": "https://facebook.com/vmvibe",
    "instagram": "https://instagram.com/vmvibe",
    "operating_hours": "Mon-Fri: 9am - 6pm, Sat-Sun: 10am - 4pm",
    "venue_note": "Free basement parking for parents during drop-off and pick-up.",
    "privacy_policy": "Your privacy is important to us. We follow PDPA standards in Malaysia."
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Age Groups
DELETE FROM public.age_groups;
INSERT INTO public.age_groups (name, min_age, max_age) VALUES
('Junior', 10, 12),
('Teen', 13, 17);

-- 3. Courses
DELETE FROM public.courses;
INSERT INTO public.courses (name, description, duration_weeks, num_classes, class_duration_minutes, syllabus) VALUES
('AI Foundations & App Building', 'Learn the basics of AI and build your first apps.', 8, 8, 90, '[
    {"week": 1, "topic": "Intro to AI"},
    {"week": 2, "topic": "Planning"},
    {"week": 3, "topic": "Build V1"},
    {"week": 4, "topic": "Improve V2"},
    {"week": 5, "topic": "Features V3"},
    {"week": 6, "topic": "Testing"},
    {"week": 7, "topic": "GitHub"},
    {"week": 8, "topic": "Final Demo"}
]');

-- 4. Payment Plans
DELETE FROM public.payment_plans;
INSERT INTO public.payment_plans (course_id, name, amount, installment_count, children_count, description, sort_order)
SELECT id, 'Monthly', 140.00, 2, 1, 'RM140 x 2 months.', 1
FROM public.courses WHERE name = 'AI Foundations & App Building';

INSERT INTO public.payment_plans (course_id, name, amount, installment_count, children_count, description, sort_order)
SELECT id, 'Pay in Full', 250.00, 1, 1, 'Standard single student fee.', 2
FROM public.courses WHERE name = 'AI Foundations & App Building';

INSERT INTO public.payment_plans (course_id, name, amount, installment_count, children_count, description, sort_order)
SELECT id, 'Family', 450.00, 1, 2, 'Special rate for 2 children.', 3
FROM public.courses WHERE name = 'AI Foundations & App Building';

-- 5. Class Slots (Update with new dates/venues)
DELETE FROM public.class_slots;
INSERT INTO public.class_slots (course_id, age_group_id, day_of_week, start_time, end_time, venue, start_date, capacity)
SELECT c.id, a.id, 'Saturday', '10:00:00', '11:30:00', 'KL Center', '2026-10-10', 12
FROM public.courses c, public.age_groups a
WHERE c.name = 'AI Foundations & App Building' AND a.name = 'Junior';

INSERT INTO public.class_slots (course_id, age_group_id, day_of_week, start_time, end_time, venue, start_date, capacity)
SELECT c.id, a.id, 'Sunday', '14:00:00', '15:30:00', 'KL Center', '2026-10-11', 12
FROM public.courses c, public.age_groups a
WHERE c.name = 'AI Foundations & App Building' AND a.name = 'Teen';
