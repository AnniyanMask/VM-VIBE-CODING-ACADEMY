import { useEffect, useState } from 'react';
import { supabase, type Announcement, type AgeGroup } from '../lib/supabase';
import { Megaphone, Plus, Trash2, Save, Loader2, Eye, EyeOff, Search, Calendar, Users, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: '',
    content: '',
    target_role: 'all',
    target_age_group_id: null,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [annRes, ageRes] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('age_groups').select('*').eq('is_active', true)
    ]);
    if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
    if (ageRes.data) setAgeGroups(ageRes.data as AgeGroup[]);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('announcements').insert(formData);
    if (!error) {
      setIsAdding(false);
      setFormData({ title: '', content: '', target_role: 'all', target_age_group_id: null, is_active: true });
      fetchData();
    }
  }

  async function toggleStatus(id: string, current: boolean) {
    await supabase.from('announcements').update({ is_active: !current }).eq('id', id);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete announcement?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchData();
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Announcement
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[32px] border border-blue-100 shadow-xl shadow-blue-50/50 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">Create Announcement</h3>
            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Announcement Title</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Early Bird Registration Ending"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Target Audience</label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'parent', 'student'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({...formData, target_role: role})}
                      className={cn(
                        "py-3 rounded-xl text-sm font-bold border transition-all capitalize",
                        formData.target_role === role ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Optional: Target Age Group</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                  value={formData.target_age_group_id || ''}
                  onChange={e => setFormData({...formData, target_age_group_id: e.target.value || null})}
                >
                  <option value="">All Age Groups</option>
                  {ageGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Message Content</label>
                <textarea 
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="Tell your students or parents something important..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Publish Live</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map(ann => (
            <div key={ann.id} className={cn(
              "p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between group",
              !ann.is_active && "opacity-50 grayscale"
            )}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleStatus(ann.id, ann.is_active)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                      {ann.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(ann.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{ann.target_role}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(ann.created_at), 'dd MMM yyyy')}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{ann.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed mt-2 line-clamp-3">{ann.content}</p>
                </div>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 italic bg-white rounded-[32px] border border-slate-100">
              No announcements yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
