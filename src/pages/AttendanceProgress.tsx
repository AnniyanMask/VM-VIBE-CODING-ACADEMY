import { useEffect, useState } from 'react';
import { supabase, type Registration, type Attendance, type StudentProgress } from '../lib/supabase';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, MessageSquare, Target, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const MILESTONES = [
  'Idea', 'Plan', 'App V1', 'App V2', 'Features', 'Testing', 'GitHub', 'Final'
];

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
      supabase.from('student_progress').select('*').eq('registration_id', regId)
    ]);
    if (attRes.data) setAttendance(attRes.data);
    if (progRes.data) setProgress(progRes.data);
    setDataLoading(false);
  }

  const getStatus = (milestone: string) => {
    return progress.find(p => p.milestone_name === milestone)?.status || 'not_started';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-20 max-w-4xl">
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
              {/* Progress Milestones Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 px-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Student Progress
                  </h2>
                </div>

                {dataLoading ? (
                  <div className="h-64 bg-white rounded-[32px] animate-pulse" />
                ) : (
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl overflow-hidden relative">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                      {MILESTONES.map((m) => {
                        const status = getStatus(m);
                        return (
                          <div key={m} className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3",
                            status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                            status === 'in_progress' ? "bg-amber-50 border-amber-100 text-amber-600 animate-pulse" :
                            "bg-white border-slate-50 text-slate-300"
                          )}>
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                              status === 'completed' ? "bg-emerald-100" :
                              status === 'in_progress' ? "bg-amber-100" :
                              "bg-slate-50"
                            )}>
                              {status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                               status === 'in_progress' ? <AlertCircle className="w-6 h-6" /> : 
                               <Clock className="w-5 h-5 opacity-20" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">{m}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-10 flex gap-6 justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">✓ Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">⚠ In Progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Not Started</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendance List */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 px-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Attendance History
                </h2>
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-lg overflow-hidden divide-y divide-slate-50">
                  {dataLoading ? (
                    <div className="h-40 animate-pulse" />
                  ) : attendance.length > 0 ? (
                    attendance.map(a => (
                      <div key={a.id} className="p-8 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{format(new Date(a.class_date), 'EEEE, dd MMM yyyy')}</p>
                          {a.remarks && <p className="text-xs text-slate-500 mt-1 font-medium italic">"{a.remarks}"</p>}
                        </div>
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                          a.status === 'present' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                        )}>
                          {a.status === 'present' ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center text-slate-400 italic font-medium">No attendance records found yet.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
              <p className="text-slate-400 italic font-medium">No active registrations found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
