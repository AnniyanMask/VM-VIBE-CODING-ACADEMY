-- RESTORED AND REORDERED SCHEMA FOR VM VIBE CODING ACADEMY (v2)

-- =========================================================
-- 1. EXTENSIONS & FUNCTIONS (Helpers First)
-- =========================================================

-- General helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 2. CORE TABLES (Dependency Order)
-- =========================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings (Flat Key-Value for configuration)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website Content (Hero, Safety, etc.)
CREATE TABLE IF NOT EXISTS public.site_content (
    section_id TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Examples
CREATE TABLE IF NOT EXISTS public.project_examples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    gradient TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    num_classes INTEGER NOT NULL,
    class_duration_minutes INTEGER NOT NULL,
    syllabus JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Age Groups
CREATE TABLE IF NOT EXISTS public.age_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Plans
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

-- Class Slots
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
    online_meeting_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enquiries (Free Trial)
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

-- Registrations
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
    student_user_id UUID REFERENCES public.profiles(id), -- Linked student account
    lead_source TEXT,
    terms_accepted_at TIMESTAMPTZ,
    media_consent BOOLEAN DEFAULT false,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sibling Requests
CREATE TABLE IF NOT EXISTS public.sibling_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    message TEXT,
    admin_remarks TEXT,
    offered_slot_id UUID REFERENCES public.class_slots(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Schedules
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

-- Payments
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

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    class_date DATE NOT NULL,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Progress
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

-- Announcements
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

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent Requests
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

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consent Logs
CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id),
    media_consent BOOLEAN NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Accounts (Bank details)
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

-- Pending Registrations
CREATE TABLE IF NOT EXISTS public.pending_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    registration_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 3. VIEWS
-- =========================================================

CREATE OR REPLACE VIEW public.slot_availability AS
SELECT 
    s.id as slot_id,
    s.capacity,
    (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as confirmed_count,
    s.capacity - (SELECT count(*) FROM public.registrations r WHERE r.slot_id = s.id AND r.status IN ('pending', 'approved')) as seats_left
FROM public.class_slots s;

-- =========================================================
-- 4. RLS POLICIES
-- =========================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View profile" ON public.profiles;
CREATE POLICY "View profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Update profile" ON public.profiles;
CREATE POLICY "Update profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Site Settings & Content
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write site_settings" ON public.site_settings;
CREATE POLICY "Admin write site_settings" ON public.site_settings FOR ALL USING (public.is_admin());

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site_content" ON public.site_content;
CREATE POLICY "Public read site_content" ON public.site_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write site_content" ON public.site_content;
CREATE POLICY "Admin write site_content" ON public.site_content FOR ALL USING (public.is_admin());

-- FAQs, Testimonials, Projects
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admin write faqs" ON public.faqs;
CREATE POLICY "Admin write faqs" ON public.faqs FOR ALL USING (public.is_admin());

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admin write testimonials" ON public.testimonials;
CREATE POLICY "Admin write testimonials" ON public.testimonials FOR ALL USING (public.is_admin());

ALTER TABLE public.project_examples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read project_examples" ON public.project_examples;
CREATE POLICY "Public read project_examples" ON public.project_examples FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admin write project_examples" ON public.project_examples;
CREATE POLICY "Admin write project_examples" ON public.project_examples FOR ALL USING (public.is_admin());

-- Courses, Age Groups, Plans, Slots
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read courses" ON public.courses;
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admin write courses" ON public.courses;
CREATE POLICY "Admin write courses" ON public.courses FOR ALL USING (public.is_admin());

ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read age_groups" ON public.age_groups;
CREATE POLICY "Public read age_groups" ON public.age_groups FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admin write age_groups" ON public.age_groups;
CREATE POLICY "Admin write age_groups" ON public.age_groups FOR ALL USING (public.is_admin());

ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read payment_plans" ON public.payment_plans;
CREATE POLICY "Public read payment_plans" ON public.payment_plans FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admin write payment_plans" ON public.payment_plans;
CREATE POLICY "Admin write payment_plans" ON public.payment_plans FOR ALL USING (public.is_admin());

ALTER TABLE public.class_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read class_slots" ON public.class_slots;
CREATE POLICY "Public read class_slots" ON public.class_slots FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admin write class_slots" ON public.class_slots;
CREATE POLICY "Admin write class_slots" ON public.class_slots FOR ALL USING (public.is_admin());

-- Enquiries
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert enquiries" ON public.enquiries;
CREATE POLICY "Public insert enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage enquiries" ON public.enquiries;
CREATE POLICY "Admin manage enquiries" ON public.enquiries FOR ALL USING (public.is_admin());

-- Registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View registrations" ON public.registrations;
CREATE POLICY "View registrations" ON public.registrations FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = student_user_id OR public.is_admin());
DROP POLICY IF EXISTS "Insert registrations" ON public.registrations;
CREATE POLICY "Insert registrations" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = parent_id);
DROP POLICY IF EXISTS "Admin manage registrations" ON public.registrations;
CREATE POLICY "Admin manage registrations" ON public.registrations FOR ALL USING (public.is_admin());

-- Payments & Schedules
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View schedules" ON public.payment_schedules;
CREATE POLICY "View schedules" ON public.payment_schedules FOR SELECT USING (auth.uid() = parent_id OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage schedules" ON public.payment_schedules;
CREATE POLICY "Admin manage schedules" ON public.payment_schedules FOR ALL USING (public.is_admin());

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View payments" ON public.payments;
CREATE POLICY "View payments" ON public.payments FOR SELECT USING (auth.uid() = parent_id OR public.is_admin());
DROP POLICY IF EXISTS "Insert payments" ON public.payments;
CREATE POLICY "Insert payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = parent_id);
DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL USING (public.is_admin());

-- Other Parent/Student related
ALTER TABLE public.parent_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents manage own requests" ON public.parent_requests;
CREATE POLICY "Parents manage own requests" ON public.parent_requests FOR ALL USING (auth.uid() = parent_id OR public.is_admin());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id OR public.is_admin());

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents view own consent logs" ON public.consent_logs;
CREATE POLICY "Parents view own consent logs" ON public.consent_logs FOR SELECT USING (auth.uid() = parent_id OR public.is_admin());

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View attendance" ON public.attendance;
CREATE POLICY "View attendance" ON public.attendance FOR SELECT USING (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = attendance.registration_id AND (registrations.parent_id = auth.uid() OR registrations.student_user_id = auth.uid())) OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage attendance" ON public.attendance;
CREATE POLICY "Admin manage attendance" ON public.attendance FOR ALL USING (public.is_admin());

ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View progress" ON public.student_progress;
CREATE POLICY "View progress" ON public.student_progress FOR SELECT USING (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = student_progress.registration_id AND (registrations.parent_id = auth.uid() OR registrations.student_user_id = auth.uid())) OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage progress" ON public.student_progress;
CREATE POLICY "Admin manage progress" ON public.student_progress FOR ALL USING (public.is_admin());

ALTER TABLE public.sibling_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View siblings" ON public.sibling_requests;
CREATE POLICY "View siblings" ON public.sibling_requests FOR SELECT USING (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = sibling_requests.registration_id AND (registrations.parent_id = auth.uid())) OR public.is_admin());
DROP POLICY IF EXISTS "Insert siblings" ON public.sibling_requests;
CREATE POLICY "Insert siblings" ON public.sibling_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM registrations WHERE registrations.id = registration_id AND registrations.parent_id = auth.uid()));
DROP POLICY IF EXISTS "Admin manage siblings" ON public.sibling_requests;
CREATE POLICY "Admin manage siblings" ON public.sibling_requests FOR ALL USING (public.is_admin());

-- Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View announcements" ON public.announcements;
CREATE POLICY "View announcements" ON public.announcements FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage announcements" ON public.announcements;
CREATE POLICY "Admin manage announcements" ON public.announcements FOR ALL USING (public.is_admin());

-- Payment Accounts
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Logged in users can view active payment accounts" ON public.payment_accounts;
CREATE POLICY "Logged in users can view active payment accounts" ON public.payment_accounts FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
DROP POLICY IF EXISTS "Admins can manage payment accounts" ON public.payment_accounts;
CREATE POLICY "Admins can manage payment accounts" ON public.payment_accounts FOR ALL USING (public.is_admin());

-- Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin view logs" ON public.activity_logs;
CREATE POLICY "Admin view logs" ON public.activity_logs FOR SELECT USING (public.is_admin());

-- Pending Registrations
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert pending_registrations" ON public.pending_registrations;
CREATE POLICY "Public insert pending_registrations" ON public.pending_registrations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage pending_registrations" ON public.pending_registrations;
CREATE POLICY "Admin manage pending_registrations" ON public.pending_registrations FOR ALL USING (public.is_admin());

-- Storage Policies
-- Note: Buckets must exist
DROP POLICY IF EXISTS "Allow parent upload slips" ON storage.objects;
CREATE POLICY "Allow parent upload slips" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'payment-slips' 
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS "Allow parent view own slips" ON storage.objects;
CREATE POLICY "Allow parent view own slips" ON storage.objects FOR SELECT USING (
    bucket_id = 'payment-slips' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
DROP POLICY IF EXISTS "Allow admin view all slips" ON storage.objects;
CREATE POLICY "Allow admin view all slips" ON storage.objects FOR SELECT USING (
    bucket_id = 'payment-slips' 
    AND public.is_admin()
);
DROP POLICY IF EXISTS "Allow logged in users to view QR codes" ON storage.objects;
CREATE POLICY "Allow logged in users to view QR codes" ON storage.objects FOR SELECT USING (bucket_id = 'payment-qr' AND auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow admins to manage QR codes" ON storage.objects;
CREATE POLICY "Allow admins to manage QR codes" ON storage.objects FOR ALL USING (bucket_id = 'payment-qr' AND public.is_admin());

-- =========================================================
-- 5. TRIGGERS & AUTOMATION
-- =========================================================

-- Automated Activity Logging Function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    ent_id TEXT;
BEGIN
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        old_val := row_to_json(OLD)::jsonb;
    END IF;
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        new_val := row_to_json(NEW)::jsonb;
    END IF;

    -- Safely extract ID based on common primary key names
    ent_id := COALESCE(
        new_val->>'id', 
        old_val->>'id', 
        new_val->>'key', 
        old_val->>'key', 
        new_val->>'section_id', 
        old_val->>'section_id'
    );

    INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (
        auth.uid(),
        TG_OP || '_' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        ent_id,
        old_val,
        new_val
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activity triggers for major tables
DROP TRIGGER IF EXISTS on_registration_activity ON public.registrations;
CREATE TRIGGER on_registration_activity AFTER INSERT OR UPDATE OR DELETE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_payment_activity ON public.payments;
CREATE TRIGGER on_payment_activity AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_profile_activity ON public.profiles;
CREATE TRIGGER on_profile_activity AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_course_activity ON public.courses;
CREATE TRIGGER on_course_activity AFTER INSERT OR UPDATE OR DELETE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_slot_activity ON public.class_slots;
CREATE TRIGGER on_slot_activity AFTER INSERT OR UPDATE OR DELETE ON public.class_slots FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_pricing_activity ON public.payment_plans;
CREATE TRIGGER on_pricing_activity AFTER INSERT OR UPDATE OR DELETE ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_bank_activity ON public.payment_accounts;
CREATE TRIGGER on_bank_activity AFTER INSERT OR UPDATE OR DELETE ON public.payment_accounts FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_setting_activity ON public.site_settings;
CREATE TRIGGER on_setting_activity AFTER UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_announcement_activity ON public.announcements;
CREATE TRIGGER on_announcement_activity AFTER INSERT OR UPDATE OR DELETE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS on_content_activity ON public.site_content;
CREATE TRIGGER on_content_activity AFTER UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Prevent non-admins from changing roles
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (NOT public.is_admin()) THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

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
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

DROP TRIGGER IF EXISTS on_registration_status_notify ON public.registrations;
CREATE TRIGGER on_registration_status_notify AFTER UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();

-- =========================================================
-- 6. SEED DATA
-- =========================================================

-- Site Settings
INSERT INTO public.site_settings (key, value) VALUES
('registration_control', '{"status": "open"}'),
('message_templates', '{
    "whatsapp_welcome": "Hi {{parent_name}}! Welcome to VM Vibe Academy. We have received your registration for {{student_name}}.",
    "whatsapp_approved": "Good news! {{student_name}}''s registration has been approved. Please proceed to payment in your dashboard.",
    "email_trial_invite": "Hi {{parent_name}}, thank you for your enquiry. We would like to invite you for a free trial session.",
    "whatsapp_waitlist": "Hi {{parent_name}}, {{student_name}} has been placed on the waitlist for the {{slot_name}} slot. We will notify you once a seat opens up."
}'),
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
}'),
('course_checklist', '[
    {"item": "Laptop (Windows/Mac/Chromebook)", "required": true},
    {"item": "Charger", "required": true},
    {"item": "Google Account (Parent-managed or student''s own)", "required": true},
    {"item": "Water bottle & Jacket (Venue is air-conditioned)", "required": false}
]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Website Content
INSERT INTO public.site_content (section_id, content) VALUES
('hero', '{
    "intake_text": "Next Intake: October 2026",
    "headline": "Your child has an idea.",
    "subheadline": "Let AI help them build it.",
    "subtext": "No coding experience needed. Small classes, hands-on learning."
}'),
('benefits', '{
    "title": "Why Choose VM Vibe Academy?",
    "subtitle": "We provide more than just coding classes; we build future creators.",
    "items": [
        {"title": "AI-First Approach", "description": "We don''t just teach code; we teach how to leverage AI tools to build real products faster.", "icon": "Rocket"},
        {"title": "Project-Based", "description": "Every student leaves with a portfolio of real applications they built themselves.", "icon": "Palette"},
        {"title": "Small Classes", "description": "Maximum 8 students per class ensures personalized attention for every child.", "icon": "Target"},
        {"title": "Industry Skills", "description": "Curriculum designed by professionals to align with real-world tech standards.", "icon": "ShieldCheck"}
    ]
}'),
('safety', '{
    "title": "A Safe, Inspiring Space",
    "subtitle": "Your child''s safety and comfort are our top priorities.",
    "items": [
        {"title": "Moderated AI", "text": "Strictly moderated AI environments with safety filters.", "icon": "Lock"},
        {"title": "Safe Staff", "text": "Experienced instructors background-checked for child safety.", "icon": "Shield"},
        {"title": "Secure Lab", "text": "Air-conditioned, modern learning lab with 24/7 security.", "icon": "Eye"},
        {"title": "Supportive", "text": "A kind, encouraging atmosphere where failure is part of learning.", "icon": "HeartHandshake"}
    ]
}')
ON CONFLICT (section_id) DO UPDATE SET content = EXCLUDED.content;

-- Age Groups
INSERT INTO public.age_groups (name, min_age, max_age) VALUES
('Junior', 10, 12),
('Teen', 13, 17)
ON CONFLICT DO NOTHING;

-- Enterprise FAQs Seed
INSERT INTO public.faqs (question, answer, sort_order) VALUES
('How does VM Vibe Academy handle AI ethics and student safety?', 'We prioritize responsible AI use. Our curriculum includes modules on AI ethics, bias detection, and digital citizenship. We use strictly moderated AI environments (LLMs with safety filters) and provide 1:1 instructor supervision to ensure students interact with technology in a constructive and safe manner.', 1),
('Is the curriculum aligned with international coding standards?', 'Yes, our syllabus is designed around the K-12 Computer Science Framework and integrates modern industry practices. We focus on foundational computational thinking, logic, and problem-solving skills that are transferable to any programming language or professional enterprise environment.', 2),
('What are the technical requirements for hardware used in class?', 'Students are required to bring a laptop (Windows 10+, macOS 11+, or latest ChromeOS) with at least 8GB of RAM and a reliable browser. For AI-intensive modules, we provide cloud-based computing environments, so high-end GPUs are not required on the student''s machine.', 3),
('Do you offer corporate or family enrollment packages?', 'We offer a structured Sibling Discount (RM450 for 2 children) and bespoke Corporate Enrollment packages for enterprise partners. Please contact our corporate relations team for group registrations exceeding 5 students.', 4),
('Does my child need prior coding experience to enroll?', 'No prior experience is necessary for our introductory tracks. Our Junior (Ages 10-12) and Teen (Ages 13-17) programs are designed to accommodate beginners, while offering advanced modules for students who have previously explored Scratch or Python.', 5),
('Will my child receive a certificate upon completion of the course?', 'Yes, students who complete at least 80% of the course and successfully present their Capstone Project will receive a VM Vibe Academy Certificate of Excellence, detailing the specific AI and coding competencies they have mastered.', 6),
('What are the qualifications of your instructors?', 'Our lead instructors are industry professionals with backgrounds in Software Engineering, Data Science, and Education. All staff undergo rigorous background checks and are certified in our specific "AI-First" pedagogical approach.', 7),
('What is the policy for withdrawals or missed sessions?', 'We offer one excused make-up class per month subject to slot availability. For withdrawals, notice must be given 14 days before the next billing cycle. Detailed terms are available in our Terms of Service linked at the footer.', 8)
ON CONFLICT DO NOTHING;
