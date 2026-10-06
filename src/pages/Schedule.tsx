import { useEffect, useState } from 'react';
import { supabase, type Registration } from '../lib/supabase';
import { Calendar, MapPin, ArrowLeft, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addWeeks, parseISO, isAfter } from 'date-fns';
import { cn } from '../lib/utils';

export default function Schedule() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const { data } = await supabase
      .from('registrations')
      .select('*, class_slots(*, courses(*), age_groups(*))')
      .eq('parent_id', session.user.id)
      .eq('status', 'approved');

    if (data) setRegistrations(data as any);
    setLoading(false);
  }

  // Generate 8 classes for each child
  const generateSchedule = (reg: Registration) => {
    if (!reg.class_slots) return [];
    const startDate = parseISO(reg.class_slots.start_date);
    const classes = [];
    for (let i = 0; i < 8; i++) {
      classes.push({
        date: addWeeks(startDate, i),
        student: reg.student_name,
        course: reg.class_slots.courses?.name,
        slot: reg.class_slots
      });
    }
    return classes;
  };

  const allSchedule = registrations.flatMap(r => generateSchedule(r)).sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="min-h-screen">
      
      <main className="container mx-auto space-y-8">
        <div className="space-y-8">
          <header className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Schedule</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Timetable & Venues</p>
            </div>
          </header>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : allSchedule.length > 0 ? (
              allSchedule.map((session, idx) => {
                const isPast = !isAfter(session.date, new Date());
                return (
                  <div key={idx} className={cn(
                    "bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex",
                    isPast && "opacity-60 grayscale"
                  )}>
                    <div className={cn(
                      "w-20 md:w-24 flex flex-col items-center justify-center text-center p-4 border-r border-slate-50",
                      isPast ? "bg-slate-50" : "bg-blue-50"
                    )}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(session.date, 'MMM')}</p>
                      <p className={cn("text-2xl font-black", isPast ? "text-slate-400" : "text-blue-600")}>{format(session.date, 'dd')}</p>
                      <p className="text-[10px] font-bold text-slate-500">{format(session.date, 'EEE')}</p>
                    </div>

                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{session.student}</p>
                          <h4 className="font-bold text-slate-900 leading-tight">{session.course}</h4>
                        </div>
                        {isPast ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded tracking-widest">Completed</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded tracking-widest">Upcoming</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          {session.slot.start_time.slice(0, 5)} - {session.slot.end_time.slice(0, 5)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          {session.slot.venue}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
                <p className="text-slate-400 italic">No approved classes found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
