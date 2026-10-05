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

// Shared Admin Wrapper to check role
const AdminRoute = ({ children, role }: { children: React.ReactNode, role: string | undefined }) => {
  if (role !== 'admin') return <Navigate to="/admin-login" />;
  return <AdminLayout>{children}</AdminLayout>;
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
          .single();
        
        setProfile(profileData as Profile);

        // 2. Check for pending registration
        if (profileData) {
          const { data: pending } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('email', session.user.email)
            .single();

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
                  amount: selectedPlan.amount / selectedPlan.installment_count,
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
          .single();
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
        <Route 
          path="/dashboard" 
          element={
            profile?.role === 'admin' ? <Navigate to="/admin" /> :
            profile?.role === 'student' ? <StudentDashboard /> :
            profile ? <ParentDashboard /> : <Navigate to="/login" />
          } 
        />
        <Route path="/payments" element={profile ? <ParentPayments /> : <Navigate to="/login" />} />
        <Route path="/children" element={profile ? <MyChildren /> : <Navigate to="/login" />} />
        <Route path="/schedule" element={profile ? <Schedule /> : <Navigate to="/login" />} />
        <Route path="/attendance" element={profile ? <AttendanceProgress /> : <Navigate to="/login" />} />
        <Route path="/requests" element={profile ? <Requests /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={profile ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/profile" element={profile ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/help" element={profile ? <Help /> : <Navigate to="/login" />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/add-child" element={profile ? <AddChild /> : <Navigate to="/login" />} />
        <Route path="/dashboard/add-student" element={<Navigate to="/add-child" replace />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
