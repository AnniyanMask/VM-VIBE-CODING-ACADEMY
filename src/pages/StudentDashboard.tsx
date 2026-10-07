import { useEffect, useState } from 'react';
import { supabase, type Announcement, type Attendance, type StudentProgress, type StudentIdea, type StudentBadge } from '../lib/supabase';
import { LogOut, Calendar, Clock, BookOpen, Target, CheckCircle2, MessageSquare, Megaphone, MapPin, Loader2, AlertCircle, Sparkles, Lightbulb, Save, Trophy, Rocket, Users, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const MILESTONES = [
  'Idea', 'Plan', 'App V1', 'App V2', 'Features', 'Testing', 'GitHub', 'Final'
];

const ICON_MAP: Record<string, any> = {
  Clock, Rocket, Sparkles, CheckCircle2, Users, Award
};

export default function StudentDashboard() {
  const [reg, setReg] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [ideas, setIdeas] = useState<StudentIdea[]>([]);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIdea, setSavingIdea] = useState(false);
  const [newIdea, setNewIdea] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

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
      if (registration.class_slots?.age_group_id) {
        announcementQuery.or(`target_age_group_id.is.null,target_age_group_id.eq.${registration.class_slots.age_group_id}`);
      }

      const [annRes, attRes, progRes, ideaRes, badgeRes] = await Promise.all([
        announcementQuery.order('created_at', { ascending: false }).limit(2),
        supabase.from('attendance').select('*').eq('registration_id', registration.id).order('class_date', { ascending: false }),
        supabase.from('student_progress').select('*').eq('registration_id', registration.id),
        supabase.from('student_ideas').select('*').eq('registration_id', registration.id).order('created_at', { ascending: false }),
        supabase.from('student_badges').select('*, badge:badge_id(*)').eq('registration_id', registration.id)
      ]);

      if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
      if (attRes.data) setAttendance(attRes.data as Attendance[]);
      if (progRes.data) setProgress(progRes.data as StudentProgress[]);
      if (ideaRes.data) setIdeas(ideaRes.data as StudentIdea[]);
      if (badgeRes.data) setBadges(badgeRes.data as any[]);
    }
    setLoading(false);
  }

  async function handleSaveIdea() {
    if (!newIdea.trim() || !reg) return;
    setSavingIdea(true);
    try {
      const { data, error } = await supabase.from('student_ideas').insert({
        registration_id: reg.id,
        content: newIdea
      }).select().single();
      
      if (error) throw error;
      setIdeas([data, ...ideas]);
      setNewIdea('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingIdea(false);
    }
  }

  const getStatus = (milestone: string) => {
    return progress.find(p => p.milestone_name === milestone)?.status || 'not_started';
  };

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
              <div className="lg:col-span-2 space-y-8">
                {/* Badges */}
                {badges.length > 0 && (
                  <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Trophy className="w-32 h-32 rotate-12" />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">Your Achievements</h3>
                        <p className="text-indigo-100 text-sm">Keep building to unlock more!</p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {badges.map(sb => {
                          const Icon = ICON_MAP[sb.badge?.icon_key || 'Award'] || Award;
                          return (
                            <div key={sb.id} className="group relative">
                              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 hover:scale-110 transition-all cursor-help shadow-lg">
                                <Icon className="w-8 h-8 text-white" />
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                                <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-xl">
                                  {sb.badge?.name}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Idea Sandbox */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Idea Sandbox</h2>
                      <p className="text-xs text-slate-400">Jot down features or app ideas for your next project.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm min-h-[100px]"
                        placeholder="I want to add a high score system to my game..."
                        value={newIdea}
                        onChange={e => setNewIdea(e.target.value)}
                      />
                      <button 
                        onClick={handleSaveIdea}
                        disabled={savingIdea || !newIdea.trim()}
                        className="absolute bottom-4 right-4 bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {savingIdea ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {ideas.map(idea => (
                        <div key={idea.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-left">
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{idea.content}</p>
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(idea.created_at), 'dd MMM yyyy')}</p>
                            {idea.instructor_feedback && (
                              <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-lg">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase text-xs">Feedback</span>
                              </div>
                            )}
                          </div>
                          {idea.instructor_feedback && (
                            <div className="mt-2 p-3 bg-white rounded-xl border border-blue-100 text-xs text-slate-600 italic">
                              "{idea.instructor_feedback}" — Instructor
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Tracking */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <Target className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Learning Progress</h2>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {MILESTONES.map(m => {
                      const status = getStatus(m);
                      return (
                        <div key={m} className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3",
                          status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                          status === 'in_progress' ? "bg-amber-50 border-amber-100 text-amber-600 animate-pulse" :
                          "bg-white border-slate-50 text-slate-200"
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            status === 'completed' ? "bg-emerald-100" :
                            status === 'in_progress' ? "bg-amber-100" :
                            "bg-slate-50"
                          )}>
                            {status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                             status === 'in_progress' ? <AlertCircle className="w-4 h-4" /> : 
                             <div className="w-2 h-2 rounded-full bg-current" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-center">{m}</span>
                        </div>
                      );
                    })}
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
                          <p className="font-bold text-slate-900 text-sm">{format(new Date(att.class_date), 'EEEE, dd MMM')}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
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
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-blue-300" />
                      <span>{reg.class_slots?.class_type === 'online' ? "Online Classroom" : (reg.class_slots?.venue || "Venue TBD")}</span>
                    </div>
                  </div>
                  {reg.class_slots?.online_meeting_url && (
                    <a 
                      href={reg.class_slots.online_meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-white text-blue-600 py-3 rounded-xl font-bold text-sm text-center hover:bg-blue-50 transition-colors"
                    >
                      Join Online Class
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
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm group-hover:scale-110 transition-all">
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
              <p className="text-slate-500 font-medium">Account setup pending. Please check with your parent.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
