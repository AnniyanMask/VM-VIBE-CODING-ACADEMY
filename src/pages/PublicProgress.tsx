import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, type Registration, type StudentProgress, type Attendance } from '../lib/supabase';
import { 
  CheckCircle2, Target, Calendar, BookOpen, MapPin, 
  Loader2, Trophy, Sparkles, Star, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const MILESTONES = [
  'Idea', 'Plan', 'App V1', 'App V2', 'Features', 'Testing', 'GitHub', 'Final'
];

export default function PublicProgress() {
  const { registrationId } = useParams();
  const [reg, setReg] = useState<Registration | null>(null);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (registrationId) {
      fetchData();
    }
  }, [registrationId]);

  async function fetchData() {
    try {
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('*, class_slots(*, courses(*), age_groups(*))')
        .eq('id', registrationId)
        .maybeSingle();

      if (regError || !registration) throw new Error('Registration not found');

      const [progRes, attRes] = await Promise.all([
        supabase.from('student_progress').select('*').eq('registration_id', registrationId).order('week_number', { ascending: true }),
        supabase.from('attendance').select('*').eq('registration_id', registrationId).order('class_date', { ascending: false })
      ]);

      setReg(registration as any);
      if (progRes.data) setProgress(progRes.data as StudentProgress[]);
      if (attRes.data) setAttendance(attRes.data as Attendance[]);
    } catch (err) {
      console.error('Error fetching public progress:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStatus = (milestone: string) => {
    return progress.find(p => p.milestone_name === milestone)?.status || 'not_started';
  };

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const progressPercentage = (completedCount / MILESTONES.length) * 100;

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!reg) return <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8 text-center"><h2 className="text-2xl font-bold">Progress Not Found</h2><p>This student's progress might be private or the link is invalid.</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Branded Header */}
      <div className="bg-white border-b border-slate-100 py-6 px-4 md:px-8 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
               <Trophy className="w-6 h-6" />
             </div>
             <div>
               <h1 className="font-black text-slate-900 tracking-tight leading-none uppercase text-lg">VM VIBE</h1>
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Academy Showcase</p>
             </div>
          </div>
          <button 
            onClick={() => navigate('/register')}
            className="hidden md:block bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
          >
            Join the Academy
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-8 mt-12 space-y-12">
        {/* Profile Card */}
        <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <Sparkles className="w-48 h-48 rotate-12" />
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-32 h-32 bg-blue-50 rounded-[40px] flex items-center justify-center text-blue-600 font-black text-5xl shadow-inner">
              {reg.student_name[0]}
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Learning Journey</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{reg.student_name}</h2>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">{reg.class_slots?.courses?.name}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-slate-600">{completedCount} Milestones Mastered</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex justify-between items-end px-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Course Progress</span>
              <span className="text-lg font-black text-blue-600">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-6 bg-slate-50 rounded-full border border-slate-100 p-1">
              <div 
                className="h-full bg-blue-600 rounded-full shadow-lg shadow-blue-200 transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Milestones Grid */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 px-4">
            <Target className="w-6 h-6 text-blue-600" />
            Skill Mastery
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MILESTONES.map((m, idx) => {
              const status = getStatus(m);
              const isCompleted = status === 'completed';
              const isInProgress = status === 'in_progress';
              
              return (
                <div key={m} className={cn(
                  "p-8 rounded-[32px] border-2 flex flex-col items-center justify-center gap-4 transition-all duration-500",
                  isCompleted ? "bg-white border-emerald-100 shadow-xl shadow-emerald-500/5 text-emerald-600" :
                  isInProgress ? "bg-white border-amber-100 shadow-xl shadow-amber-500/5 text-amber-600" :
                  "bg-slate-50 border-slate-100 text-slate-300 opacity-50"
                )}>
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                    isCompleted ? "bg-emerald-50" :
                    isInProgress ? "bg-amber-50 animate-pulse" :
                    "bg-white"
                  )}>
                    {isCompleted ? <Award className="w-8 h-8" /> : 
                     isInProgress ? <Target className="w-7 h-7" /> : 
                     <span className="text-xl font-bold">{idx + 1}</span>}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">{m}</p>
                    <p className="text-[9px] font-bold uppercase tracking-tighter opacity-60">
                      {isCompleted ? "Mastered" : isInProgress ? "In Training" : "Upcoming"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Link */}
        {reg.project_url && (
          <div className="bg-slate-900 p-8 md:p-12 rounded-[48px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Sparkles className="w-48 h-48 -rotate-12" />
            </div>
            <div className="space-y-4 text-center md:text-left relative z-10 flex-1">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Live Project</p>
              <h3 className="text-3xl font-black tracking-tight leading-none">Try my child's app!</h3>
              <p className="text-slate-400 text-sm max-w-md font-medium leading-relaxed">
                Click below to open the real, functional application {reg.student_name} is currently building in the academy.
              </p>
            </div>
            <a 
              href={reg.project_url} 
              target="_blank" 
              className="bg-white text-slate-900 px-12 py-5 rounded-full font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-50 transition-all flex items-center gap-3 shrink-0 active:scale-95"
            >
              Launch Project
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        )}

        {/* CTA Footer */}
        <div className="text-center py-20 space-y-6">
           <h3 className="text-2xl font-black text-slate-900">Want your child to build like {reg.student_name}?</h3>
           <p className="text-slate-500 max-w-sm mx-auto font-medium">Join VM Vibe Academy and start the journey from idea to functional app.</p>
           <button 
             onClick={() => navigate('/register')}
             className="bg-blue-600 text-white px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
           >
             Get Started Today
           </button>
        </div>
      </main>
    </div>
  );
}
