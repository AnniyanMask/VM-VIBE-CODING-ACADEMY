import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase, type Profile } from './lib/supabase';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentPayments from './pages/ParentPayments';
import AdminPayments from './pages/AdminPayments';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminSiblingRequests from './pages/AdminSiblingRequests';
import AdminRegistrations from './pages/AdminRegistrations';
import AdminRequests from './pages/AdminRequests';
import AdminCourses from './pages/AdminCourses';
import AdminSlots from './pages/AdminSlots';
import AdminAgeGroups from './pages/AdminAgeGroups';
import AdminPricing from './pages/AdminPricing';
import AdminPaymentAccounts from './pages/AdminPaymentAccounts';
import AdminContent from './pages/AdminContent';
import AdminSettings from './pages/AdminSettings';
import AdminUsers from './pages/AdminUsers';
import AdminEnquiries from './pages/AdminEnquiries';
import AdminProgress from './pages/AdminProgress';
import AdminLogs from './pages/AdminLogs';
import AdminFAQs from './pages/AdminFAQs';
import AdminTestimonials from './pages/AdminTestimonials';
import AdminProjects from './pages/AdminProjects';
import MyChildren from './pages/MyChildren';
import Schedule from './pages/Schedule';
import AttendanceProgress from './pages/AttendanceProgress';
import Requests from './pages/Requests';
import Notifications from './pages/Notifications';
import ProfilePage from './pages/Profile';
import Help from './pages/Help';
import AddChild from './pages/AddChild';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import FAQPage from './pages/FAQPage';
import AdminLayout from './components/admin/AdminLayout';
import ParentLayout from './components/parent/ParentLayout';

// Shared Admin Wrapper to check role
const AdminRoute = ({ children, role }: { children: React.ReactNode, role: string | undefined }) => {
  if (role !== 'admin') return <Navigate to="/admin-login" />;
  return <AdminLayout>{children}</AdminLayout>;
};

// Shared Parent Wrapper
const ParentRoute = ({ children, profile }: { children: React.ReactNode, profile: Profile | null }) => {
  if (!profile) return <Navigate to="/login" />;
  if (profile.role === 'admin') return <Navigate to="/admin" />;
  if (profile.role === 'student') return <Navigate to="/dashboard" />; // Student dashboard is direct
  return <ParentLayout>{children}</ParentLayout>;
};

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // 1. Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        setProfile(profileData as Profile);

        // 2. Check for pending registration
        if (profileData) {
          const { data: pending } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (pending) {
            const { registrations, selectedPlan, groupId } = pending.registration_data;
            
            // 1. Create the registrations
            const { data: regData } = await supabase.from('registrations').insert(
              registrations.map((r: any) => ({ ...r, parent_id: session.user.id }))
            ).select();

            // 2. Sibling Request Logic
            if (regData && regData.length > 1) {
              const uniqueSlots = new Set(regData.map(r => r.slot_id));
              if (uniqueSlots.size > 1) {
                await supabase.from('sibling_requests').insert({
                  registration_id: regData[0].id,
                  message: `Sibling group (${regData.length} children) registered in different slots.`,
                });
              }
            }

            // 3. Create Payment Schedule
            if (selectedPlan) {
              const scheduleEntries = [];
              for (let i = 0; i < selectedPlan.installment_count; i++) {
                const dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i);
                scheduleEntries.push({
                  parent_id: session.user.id,
                  registration_id: regData ? regData[0].id : null, // Link to first child or handle differently
                  group_id: groupId,
                  amount: selectedPlan.fee / selectedPlan.installment_count,
                  due_date: dueDate.toISOString().split('T')[0],
                  installment_number: i + 1,
                  status: 'pending'
                });
              }
              await supabase.from('payment_schedules').insert(scheduleEntries);
            }

            // Clean up
            await supabase.from('pending_registrations').delete().eq('id', pending.id);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    getProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        setProfile(data as Profile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={profile ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute role={profile?.role}><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/registrations" element={<AdminRoute role={profile?.role}><AdminRegistrations /></AdminRoute>} />
        <Route path="/admin/progress" element={<AdminRoute role={profile?.role}><AdminProgress /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute role={profile?.role}><AdminPayments /></AdminRoute>} />
        <Route path="/admin/siblings" element={<AdminRoute role={profile?.role}><AdminSiblingRequests /></AdminRoute>} />
        <Route path="/admin/requests" element={<AdminRoute role={profile?.role}><AdminRequests /></AdminRoute>} />
        <Route path="/admin/courses" element={<AdminRoute role={profile?.role}><AdminCourses /></AdminRoute>} />
        <Route path="/admin/slots" element={<AdminRoute role={profile?.role}><AdminSlots /></AdminRoute>} />
        <Route path="/admin/age-groups" element={<AdminRoute role={profile?.role}><AdminAgeGroups /></AdminRoute>} />
        <Route path="/admin/pricing" element={<AdminRoute role={profile?.role}><AdminPricing /></AdminRoute>} />
        <Route path="/admin/payment-accounts" element={<AdminRoute role={profile?.role}><AdminPaymentAccounts /></AdminRoute>} />
        <Route path="/admin/content" element={<AdminRoute role={profile?.role}><AdminContent /></AdminRoute>} />
        <Route path="/admin/faqs" element={<AdminRoute role={profile?.role}><AdminFAQs /></AdminRoute>} />
        <Route path="/admin/testimonials" element={<AdminRoute role={profile?.role}><AdminTestimonials /></AdminRoute>} />
        <Route path="/admin/projects" element={<AdminRoute role={profile?.role}><AdminProjects /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute role={profile?.role}><AdminSettings /></AdminRoute>} />
        <Route path="/admin/announcements" element={<AdminRoute role={profile?.role}><AdminAnnouncements /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute role={profile?.role}><AdminUsers /></AdminRoute>} />
        <Route path="/admin/enquiries" element={<AdminRoute role={profile?.role}><AdminEnquiries /></AdminRoute>} />
        <Route path="/admin/logs" element={<AdminRoute role={profile?.role}><AdminLogs /></AdminRoute>} />

        {/* Parent Routes */}
        <Route path="/dashboard" element={<ParentRoute profile={profile}><ParentDashboard /></ParentRoute>} />
        <Route path="/dashboard/payments" element={<ParentRoute profile={profile}><ParentPayments /></ParentRoute>} />
        <Route path="/dashboard/children" element={<ParentRoute profile={profile}><MyChildren /></ParentRoute>} />
        <Route path="/dashboard/schedule" element={<ParentRoute profile={profile}><Schedule /></ParentRoute>} />
        <Route path="/dashboard/attendance" element={<ParentRoute profile={profile}><AttendanceProgress /></ParentRoute>} />
        <Route path="/dashboard/learning-progress" element={<ParentRoute profile={profile}><AttendanceProgress /></ParentRoute>} />
        <Route path="/dashboard/requests" element={<ParentRoute profile={profile}><Requests /></ParentRoute>} />
        <Route path="/dashboard/notifications" element={<ParentRoute profile={profile}><Notifications /></ParentRoute>} />
        <Route path="/dashboard/profile" element={<ParentRoute profile={profile}><ProfilePage /></ParentRoute>} />
        <Route path="/dashboard/help" element={<ParentRoute profile={profile}><Help /></ParentRoute>} />
        <Route path="/dashboard/add-child" element={<ParentRoute profile={profile}><AddChild /></ParentRoute>} />
        
        {/* Legacy Redirects */}
        <Route path="/payments" element={<Navigate to="/dashboard/payments" replace />} />
        <Route path="/children" element={<Navigate to="/dashboard/children" replace />} />
        <Route path="/schedule" element={<Navigate to="/dashboard/schedule" replace />} />
        <Route path="/attendance" element={<Navigate to="/dashboard/attendance" replace />} />
        <Route path="/requests" element={<Navigate to="/dashboard/requests" replace />} />
        <Route path="/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
        <Route path="/help" element={<Navigate to="/dashboard/help" replace />} />
        <Route path="/add-child" element={<Navigate to="/dashboard/add-child" replace />} />
        <Route path="/dashboard/add-student" element={<Navigate to="/dashboard/add-child" replace />} />
        
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/faq" element={<FAQPage />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
