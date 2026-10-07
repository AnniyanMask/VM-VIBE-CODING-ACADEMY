import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Award, Search, Plus, Trash2, Loader2, RefreshCw, 
  CheckCircle2, XCircle, User, Zap, Brain, Rocket, Heart, Star, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const ICON_MAP: Record<string, any> = {
  Zap, Brain, Rocket, Heart, Star, Sparkles, Award
};

export default function AdminBadges() {
  const [badges, setBadges] = useState<any[]>([]);
  const [studentBadges, setStudentBadges] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [awarding, setAwarding] = useState(false);
  
  const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: 'Award' });
  const [awardData, setAwardData] = useState({ registration_id: '', badge_id: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [bRes, sbRes, rRes] = await Promise.all([
        supabase.from('badges').select('*').order('name'),
        supabase.from('student_badges').select('*, registration:registration_id(student_name), badge:badge_id(*)').order('awarded_at', { ascending: false }),
        supabase.from('registrations').select('id, student_name').eq('status', 'approved').order('student_name')
      ]);

      if (bRes.data) setBadges(bRes.data);
      if (sbRes.data) setStudentBadges(sbRes.data);
      if (rRes.data) setRegistrations(rRes.data);
    } catch (error) {
      console.error('Error fetching badge data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBadge(e: React.FormEvent) {
    e.preventDefault();
    if (!newBadge.name) return;
    setCreating(true);
    try {
      const { error } = await supabase
        .from('badges')
        .insert([newBadge]);
      
      if (error) throw error;
      setNewBadge({ name: '', description: '', icon: 'Award' });
      fetchData();
    } catch (error) {
      console.error('Error creating badge:', error);
      alert('Error creating badge');
    } finally {
      setCreating(false);
    }
  }

  async function deleteBadge(id: string) {
    if (!confirm('Are you sure? This will remove the badge from the library and all students who earned it.')) return;
    try {
      await supabase.from('badges').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAwardBadge(e: React.FormEvent) {
    e.preventDefault();
    if (!awardData.registration_id || !awardData.badge_id) return;
    setAwarding(true);
    try {
      const { error } = await supabase
        .from('student_badges')
        .insert({
          registration_id: awardData.registration_id,
          badge_id: awardData.badge_id
        });

      if (error) {
        if (error.code === '23505') alert('This student already has this badge!');
        else throw error;
      } else {
        // Notify student
        const student = registrations.find(r => r.id === awardData.registration_id);
        const badge = badges.find(b => b.id === awardData.badge_id);
        
        const { data: regData } = await supabase.from('registrations').select('student_user_id').eq('id', awardData.registration_id).single();
        
        if (regData?.student_user_id) {
          await supabase.from('notifications').insert({
            user_id: regData.student_user_id,
            title: `You've earned a badge: ${badge.name}!`,
            content: `Congratulations! An instructor awarded you the ${badge.name} badge. Check your dashboard!`,
            type: 'success'
          });
        }
        
        fetchData();
        setAwardData({ registration_id: '', badge_id: '' });
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    } finally {
      setAwarding(false);
    }
  }

  async function deleteAward(id: string) {
    if (!confirm('Are you sure you want to revoke this badge?')) return;
    try {
      await supabase.from('student_badges').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Achievement Badge System</h1>
          <p className="text-slate-500">Motivate students with digital rewards</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Award Badge Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Award className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-bold">Award a Badge</h3>
              <form onSubmit={handleAwardBadge} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-100 uppercase tracking-widest ml-1">Select Student</label>
                  <select 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium appearance-none"
                    value={awardData.registration_id}
                    onChange={e => setAwardData({ ...awardData, registration_id: e.target.value })}
                    required
                  >
                    <option value="" className="text-slate-900">Choose student...</option>
                    {registrations.map(r => (
                      <option key={r.id} value={r.id} className="text-slate-900">{r.student_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-100 uppercase tracking-widest ml-1">Select Badge</label>
                  <select 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium appearance-none"
                    value={awardData.badge_id}
                    onChange={e => setAwardData({ ...awardData, badge_id: e.target.value })}
                    required
                  >
                    <option value="" className="text-slate-900">Choose badge...</option>
                    {badges.map(b => (
                      <option key={b.id} value={b.id} className="text-slate-900">{b.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={awarding}
                  className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {awarding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Award Badge Now
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900">Available Badges</h3>
            <div className="space-y-4">
              {badges.map(badge => {
                const Icon = ICON_MAP[badge.icon] || Award;
                return (
                  <div key={badge.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-all">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{badge.name}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{badge.description}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteBadge(badge.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create New Badge Definition */}
          <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-200">
            <h3 className="text-xl font-bold mb-6">Create New Badge</h3>
            <form onSubmit={handleCreateBadge} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Badge Name</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="e.g. Debugging Master"
                  value={newBadge.name}
                  onChange={e => setNewBadge({ ...newBadge, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ICON_MAP).map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewBadge({ ...newBadge, icon })}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        newBadge.icon === icon ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"
                      )}
                    >
                      {(() => {
                        const Icon = ICON_MAP[icon];
                        return <Icon className="w-5 h-5" />;
                      })()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
                  placeholder="What is this for?"
                  rows={2}
                  value={newBadge.description}
                  onChange={e => setNewBadge({ ...newBadge, description: e.target.value })}
                />
              </div>
              <button 
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Create Badge Definition
              </button>
            </form>
          </div>
        </div>

        {/* Recently Awarded Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Recent Awards</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{studentBadges.length} total awards</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Badge</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentBadges.map((sb) => {
                    const Icon = ICON_MAP[sb.badge?.icon] || Award;
                    return (
                      <tr key={sb.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5 font-bold text-slate-900">{sb.registration?.student_name}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">{sb.badge?.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-500">
                          {format(new Date(sb.awarded_at), 'dd MMM yyyy')}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => deleteAward(sb.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {studentBadges.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No badges awarded yet. Start rewarding your students!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
