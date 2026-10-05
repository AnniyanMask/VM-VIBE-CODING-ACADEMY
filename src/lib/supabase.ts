import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'parent' | 'student' | 'admin';
  created_at: string;
};

export type SiteSettings = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  maps_link: string;
  facebook: string;
  instagram: string;
  operating_hours: string;
  venue_note: string;
  privacy_policy: string;
  bank_info?: {
    bank_name: string;
    account_name: string;
    account_number: string;
    qr_url: string;
    instructions: string;
  };
};

export type SiteContent = {
  section_id: string;
  content: any;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

export type Testimonial = {
  id: string;
  name: string;
  text: string;
  sort_order: number;
  is_active: boolean;
};

export type ProjectExample = {
  id: string;
  title: string;
  category: string;
  description: string;
  gradient: string;
  sort_order: number;
  is_active: boolean;
};

export type Course = {
  id: string;
  name: string;
  description: string;
  duration_weeks: number;
  num_classes: number;
  class_duration_minutes: number;
  syllabus: { week: number; topic: string }[];
  is_active: boolean;
};

export type ClassSlot = {
  id: string;
  course_id: string;
  age_group_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  venue: string;
  online_meeting_url: string | null;
  start_date: string;
  capacity: number;
  is_active: boolean;
  age_group?: AgeGroup;
  courses?: Course;
  registrations?: { count: number }[]; // For count aggregation if needed
};

export type AgeGroup = {
  id: string;
  name: string;
  min_age: number;
  max_age: number;
  is_active: boolean;
};

export type PaymentPlan = {
  id: string;
  course_id: string;
  name: string;
  description: string;
  amount: number;
  installment_count: number;
  children_count: number;
  effective_from: string | null;
  effective_to: string | null;
  sort_order: number;
  is_active: boolean;
  courses?: Course;
};

export type Registration = {
  id: string;
  parent_id: string;
  group_id: string | null;
  student_name: string;
  student_dob: string;
  school: string | null;
  experience_level: string | null;
  slot_id: string;
  payment_plan_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'waitlist';
  student_user_id: string | null;
  lead_source: string | null;
  terms_accepted_at: string | null;
  media_consent: boolean;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  student_profile?: Profile;
  class_slots?: ClassSlot & { courses?: Course; age_groups?: AgeGroup };
  payments?: Payment[];
  payment_plans?: PaymentPlan;
};

export type PaymentSchedule = {
  id: string;
  parent_id: string;
  registration_id: string | null;
  group_id: string | null;
  amount: number;
  due_date: string | null;
  status: 'pending' | 'paid' | 'partially_paid';
  installment_number: number;
  created_at: string;
  updated_at: string;
  payments?: Payment[];
  profiles?: Profile;
};

export type SiblingRequest = {
  id: string;
  registration_id: string;
  status: 'pending' | 'resolved' | 'rejected';
  message: string;
  admin_remarks: string | null;
  offered_slot_id: string | null;
  created_at: string;
  registrations?: Registration;
};

export type Payment = {
  id: string;
  schedule_id: string | null;
  registration_id: string;
  parent_id: string;
  amount: number;
  slip_url: string;
  status: 'pending' | 'verified' | 'rejected' | 'replacement_requested';
  admin_remarks: string | null;
  created_at: string;
  updated_at: string;
  registrations?: Registration;
  profiles?: Profile;
};

export type Attendance = {
  id: string;
  registration_id: string;
  class_date: string;
  status: 'present' | 'absent' | 'excused';
  remarks: string | null;
  created_at: string;
};

export type StudentProgress = {
  id: string;
  registration_id: string;
  week_number: number;
  milestone_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  feedback: string | null;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  target_role: 'all' | 'parent' | 'student';
  target_age_group_id: string | null;
  publish_date: string;
  is_active: boolean;
  created_at: string;
};

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  student_name: string | null;
  student_age: number | null;
  message: string | null;
  status: 'new' | 'contacted' | 'trial_booked' | 'registered' | 'closed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: any;
  new_value: any;
  description: string | null;
  created_at: string;
  profiles?: Profile;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'alert' | 'success' | 'info';
  is_read: boolean;
  link: string | null;
  created_at: string;
};

export type ParentRequest = {
  id: string;
  parent_id: string;
  registration_id: string;
  type: 'slot_change' | 'makeup_class' | 'withdrawal' | 'data_correction';
  details: any;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  admin_remarks: string | null;
  created_at: string;
  updated_at: string;
  registrations?: Registration;
};

export type ConsentLog = {
  id: string;
  parent_id: string;
  media_consent: boolean;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export async function logActivity(params: {
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  description?: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const actor_id = session?.user?.id;

  try {
    const { error } = await supabase.from('activity_logs').insert({
      actor_id,
      ...params
    });
    if (error) console.error('Failed to log activity:', error);
  } catch (err) {
    console.error('Activity logging error:', err);
  }
}
