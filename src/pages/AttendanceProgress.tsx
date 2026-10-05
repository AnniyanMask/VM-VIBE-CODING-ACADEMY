import { useEffect, useState } from 'react';
import { supabase, type Registration, type Attendance, type StudentProgress } from '../lib/supabase';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, MessageSquare, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AttendanceProgress() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedReg, setSelectedReg] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegs();
  }, []);

  useEffect(() => {
    if (selectedReg) fetchDetails(selectedReg);
  }, [selectedReg]);

  async function fetchRegs() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('parent_id', session.user.id)
      .eq('status', 'approved');

    if (data && data.length > 0) {
      setRegistrations(data);
      setSelectedReg(data[0].id);
    }
    setLoading(false);
  }

  async function fetchDetails(regId: string) {
    setDataLoading(true);
    const [attRes, progRes] = await Promise.all([
      supabase.from('attendance').select('*').eq('registration_id', regId).order('class_date', { ascending: false }),
      supabase.from('student_progress').select('*').eq('registration_id', regId).order('week_number', { ascending: true })
    ]);
    if (attRes.data) setAttendance(attRes.data);
    if (progRes.data) setProgress(progRes.data);
    setDataLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-20 max-w-2xl">
        <div className="space-y-8">
          <header className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Progress & Attendance</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Learning Records</p>
            </div>
          </header>

          {registrations.length > 1 && (
            <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
              {registrations.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReg(r.id)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                    selectedReg === r.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {r.student_name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : registrations.length > 0 ? (
            <div className="space-y-12">
              {/* Progress Milestones */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 px-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Course Milestones
                </h2>
                <div className="space-y-4">
                  {dataLoading ? (
                    <div className="h-40 bg-white rounded-[32px] animate-pulse" />
                  ) : progress.length > 0 ? (
                    progress.map(p => (
                      <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded tracking-widest mb-1 inline-block">Week {p.week_number}</span>
                            <h4 className="font-bold text-slate-900">{p.milestone_name}</h4>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            p.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                            p.status === 'in_progress' ? "bg-amber-50 text-amber-600" :
                            "bg-slate-50 text-slate-400"
                          )}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </div>
                        {p.feedback && (
                          <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 italic flex gap-3">
                            <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            "{p.feedback}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 bg-white rounded-[32px] text-center text-slate-400 italic">No progress logs yet. Classes start soon!</div>
                  )}
                </div>
              </div>

              {/* Attendance List */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 px-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Attendance History
                </h2>
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {dataLoading ? (
                    <div className="h-40 animate-pulse" />
                  ) : attendance.length > 0 ? (
                    attendance.map(a => (
                      <div key={a.id} className="p-6 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{format(new Date(a.class_date), 'EEEE, dd MMM yyyy')}</p>
                          {a.remarks && <p className="text-xs text-slate-500 mt-1">{a.remarks}</p>}
                        </div>
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          a.status === 'present' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                        )}>
                          {a.status === 'present' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-400 italic">No attendance records found.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
              <p className="text-slate-400 italic">No active registrations found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
