import { useEffect, useState } from 'react';
import { supabase, type Announcement, type Attendance, type StudentProgress } from '../lib/supabase';
import { LogOut, Calendar, Clock, BookOpen, Target, CheckCircle2, MessageSquare, Megaphone, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';

export default function StudentDashboard() {
  const [reg, setReg] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    // Load registration linked directly to this student account
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*, class_slots(*, courses(*), age_groups(*))')
      .eq('student_user_id', session.user.id)
      .maybeSingle();

    if (regError) {
      console.error('Error fetching student registration:', regError);
      setLoading(false);
      return;
    }

    if (registration) {
      setReg(registration);
      
      const announcementQuery = supabase.from('announcements').select('*').eq('is_active', true).in('target_role', ['all', 'student']);
      
      // Filter by age group if available
      if (registration.class_slots?.age_group_id) {
        announcementQuery.or(`target_age_group_id.is.null,target_age_group_id.eq.${registration.class_slots.age_group_id}`);
      }

      const [annRes, attRes, progRes] = await Promise.all([
        announcementQuery.order('created_at', { ascending: false }).limit(2),
        supabase.from('attendance').select('*').eq('registration_id', registration.id).order('class_date', { ascending: false }),
        supabase.from('student_progress').select('*').eq('registration_id', registration.id).order('week_number', { ascending: true })
      ]);

      if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
      if (attRes.data) setAttendance(attRes.data as Attendance[]);
      if (progRes.data) setProgress(progRes.data as StudentProgress[]);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 md:px-6 pt-32 pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Dashboard</h1>
              <p className="text-slate-500">Ready to build something amazing, {reg?.student_name}?</p>
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : reg ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Announcements */}
                {announcements.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-6 bg-slate-900 text-white rounded-[32px] shadow-xl shadow-slate-200 flex gap-4">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                          <Megaphone className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{ann.title}</h4>
                          <p className="text-slate-400 text-sm leading-relaxed mt-1">{ann.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress Tracking */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Target className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Learning Progress</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {progress.length > 0 ? progress.map(p => (
                      <div key={p.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          p.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                          p.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-200 text-slate-500'
                        }`}>
                          W{p.week_number}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-sm">{p.milestone_name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.status.replace('_', ' ')}</p>
                        </div>
                        {p.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </div>
                    )) : (
                      <div className="col-span-2 py-8 text-center text-slate-400 italic text-sm">
                        Course starts soon! Your progress will appear here.
                      </div>
                    )}
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Attendance Log</h2>
                  </div>
                  <div className="space-y-3">
                    {attendance.map(att => (
                      <div key={att.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <p className="font-bold text-slate-900 text-sm">{new Date(att.class_date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
                          {att.status}
                        </span>
                      </div>
                    ))}
                    {attendance.length === 0 && (
                      <p className="text-center py-4 text-slate-400 text-sm italic">Attendance will be marked after each class.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-blue-600 p-8 rounded-[32px] text-white space-y-6 shadow-xl shadow-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-100" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Next Class</p>
                      <h3 className="font-bold">{reg.class_slots?.day_of_week}s @ {reg.class_slots?.start_time?.slice(0, 5)}</h3>
                    </div>
                  </div>
                  <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 text-sm">
                      <BookOpen className="w-4 h-4 text-blue-300" />
                      <span>{reg.class_slots?.courses?.name}</span>
                    </div>
                    {reg.class_slots?.venue && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-blue-300" />
                        <span>{reg.class_slots.venue}</span>
                      </div>
                    )}
                  </div>
                  {reg.class_slots?.online_meeting_url && (
                    <a 
                      href={reg.class_slots.online_meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-white text-blue-600 py-3 rounded-xl font-bold text-sm text-center hover:bg-blue-50 transition-colors"
                    >
                      Join Online Lab
                    </a>
                  )}
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-900">Support</h3>
                  <a 
                    href="https://wa.me/60123456789" 
                    target="_blank"
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Ask Instructor</p>
                      <p className="text-xs text-slate-500">Fast response via WA</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <p className="text-slate-500">Account setup pending. Please check with your parent.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
