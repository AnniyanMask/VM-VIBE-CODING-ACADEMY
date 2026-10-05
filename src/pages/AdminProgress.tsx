import { useEffect, useState } from 'react';
import { supabase, type Registration, type StudentProgress } from '../lib/supabase';
import { 
  Users, Search, Filter, Loader2, Target, CheckCircle2, AlertCircle, RefreshCw, Save
} from 'lucide-react';
import { cn } from '../lib/utils';

const MILESTONES = [
  'Idea', 'Plan', 'App V1', 'App V2', 'Features', 'Testing', 'GitHub', 'Final'
];

type MilestoneStatus = 'not_started' | 'in_progress' | 'completed';

export default function AdminProgress() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch active registrations and their progress
    const { data: regs, error } = await supabase
      .from('registrations')
      .select('id, student_name, student_user_id, status, class_slots(day_of_week, start_time), student_progress(*)')
      .eq('status', 'approved')
      .order('student_name', { ascending: true });

    if (regs) {
      setRegistrations(regs);
    }
    setLoading(false);
  }

  async function updateProgress(regId: string, milestone: string, currentStatus: MilestoneStatus) {
    const nextStatus: MilestoneStatus = 
      currentStatus === 'not_started' ? 'in_progress' :
      currentStatus === 'in_progress' ? 'completed' : 
      'not_started';

    setSaving(`${regId}-${milestone}`);
    try {
      const { data: existing } = await supabase
        .from('student_progress')
        .select('id')
        .eq('registration_id', regId)
        .eq('milestone_name', milestone)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('student_progress')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('student_progress')
          .insert({
            registration_id: regId,
            milestone_name: milestone,
            status: nextStatus,
            week_number: 1 // Default
          });
      }

      // Optimistic update
      setRegistrations(prev => prev.map(r => {
        if (r.id === regId) {
          const newProgress = [...(r.student_progress || [])];
          const idx = newProgress.findIndex(p => p.milestone_name === milestone);
          if (idx >= 0) {
            newProgress[idx] = { ...newProgress[idx], status: nextStatus };
          } else {
            newProgress.push({ registration_id: regId, milestone_name: milestone, status: nextStatus });
          }
          return { ...r, student_progress: newProgress };
        }
        return r;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  }

  const getStatus = (reg: any, milestone: string): MilestoneStatus => {
    const p = reg.student_progress?.find((p: any) => p.milestone_name === milestone);
    return p?.status || 'not_started';
  };

  const filtered = registrations.filter(r => 
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search student..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap sticky left-0 bg-slate-50 z-10">Student</th>
                  {MILESTONES.map(m => (
                    <th key={m} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{reg.student_name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                          {reg.class_slots?.day_of_week} @ {reg.class_slots?.start_time.slice(0, 5)}
                        </span>
                      </div>
                    </td>
                    {MILESTONES.map(m => {
                      const status = getStatus(reg, m);
                      const isSaving = saving === `${reg.id}-${m}`;
                      
                      return (
                        <td key={m} className="p-4 text-center">
                          <button
                            onClick={() => updateProgress(reg.id, m, status)}
                            disabled={!!saving}
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto",
                              status === 'completed' ? "bg-emerald-50 text-emerald-500 shadow-sm shadow-emerald-100" :
                              status === 'in_progress' ? "bg-amber-50 text-amber-500 shadow-sm shadow-amber-100" :
                              "bg-slate-50 text-slate-200 hover:text-slate-400"
                            )}
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : status === 'in_progress' ? (
                              <AlertCircle className="w-5 h-5" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-current" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">No students found.</div>
          )}
        </div>
      )}

      <div className="flex gap-8 p-6 bg-slate-900 rounded-[32px] text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">✓ Completed</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚠ In Progress</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 text-slate-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-current" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Not Started</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase italic">
          Click cell to cycle through status
        </div>
      </div>
    </div>
  );
}
