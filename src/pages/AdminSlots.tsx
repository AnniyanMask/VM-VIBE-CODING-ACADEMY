import { useEffect, useState } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { 
  Plus, Trash2, Edit3, Check, X, RefreshCw, Loader2, Clock, Calendar, MapPin, Users
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminSlots() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [ageGroups, setAgeGroups] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    course_id: '',
    age_group_id: '',
    day_of_week: 'Saturday',
    start_time: '10:00:00',
    end_time: '11:30:00',
    venue: '',
    online_meeting_url: '',
    start_date: '',
    capacity: 12,
    is_active: true
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

  async function fetchLookups() {
    try {
      const [c, a] = await Promise.all([
        supabase.from('courses').select('id, name'),
        supabase.from('age_groups').select('id, name')
      ]);
      if (c.error) throw c.error;
      if (a.error) throw a.error;
      setCourses(c.data || []);
      setAgeGroups(a.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_slots')
        .select('*, courses(name), age_groups(name)')
        .order('start_date', { ascending: true });
      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      alert(`Error fetching slots: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ 
      course_id: courses[0]?.id || '',
      age_group_id: ageGroups[0]?.id || '',
      day_of_week: 'Saturday',
      start_time: '10:00:00',
      end_time: '11:30:00',
      venue: 'KL Center',
      start_date: new Date().toISOString().split('T')[0],
      capacity: 12,
      is_active: true 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData = { ...formData };
    delete cleanData.courses;
    delete cleanData.age_groups;

    try {
      if (editingId) {
        const { error } = await supabase.from('class_slots').update(cleanData).eq('id', editingId);
        if (error) throw error;
        
        await logActivity({
          action: 'update_slot',
          entity_type: 'class_slots',
          entity_id: editingId,
          new_value: cleanData
        });

        showMessage('success', 'Updated successfully');
      } else {
        const { data, error } = await supabase.from('class_slots').insert(cleanData).select().single();
        if (error) throw error;

        await logActivity({
          action: 'create_slot',
          entity_type: 'class_slots',
          entity_id: data.id,
          new_value: cleanData
        });

        showMessage('success', 'Created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const toggleActive = async (item: any) => {
    try {
      const { error } = await supabase.from('class_slots').update({ is_active: !item.is_active }).eq('id', item.id);
      if (error) throw error;
      
      await logActivity({
        action: 'toggle_slot_active',
        entity_type: 'class_slots',
        entity_id: item.id,
        new_value: { is_active: !item.is_active }
      });

      fetchData();
      showMessage('success', 'Status updated');
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className={cn(
          "fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 duration-300",
          message.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Class Slots</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Schedule Management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing & Course</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue / Group</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-blue-600">{item.day_of_week}s</span>
                          <span className="text-slate-300">•</span>
                          <span>{item.start_time.slice(0, 5)}</span>
                        </p>
                        <p className="text-xs text-slate-500 font-medium">{item.courses?.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {item.venue}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-3 h-3" /> {item.age_groups?.name} Group
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleActive(item)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                          item.is_active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        {item.is_active ? 'Open' : 'Full / Off'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(item)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No class slots defined.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit' : 'Add New'} Slot</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Schedule Manager</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all shadow-sm text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Course</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={formData.course_id || ''} onChange={e => setFormData({...formData, course_id: e.target.value})} required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Age Group</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={formData.age_group_id || ''} onChange={e => setFormData({...formData, age_group_id: e.target.value})} required>
                    <option value="">Select Group</option>
                    {ageGroups.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Day of Week</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={formData.day_of_week || 'Saturday'} onChange={e => setFormData({...formData, day_of_week: e.target.value})}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
                  <input type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" value={formData.start_time || ''} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">End Time</label>
                  <input type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" value={formData.end_time || ''} onChange={e => setFormData({...formData, end_time: e.target.value})} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Venue Name</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" placeholder="e.g. KL Digital Hub" value={formData.venue || ''} onChange={e => setFormData({...formData, venue: e.target.value})} required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Online Meeting URL (Optional)</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" placeholder="e.g. https://zoom.us/j/..." value={formData.online_meeting_url || ''} onChange={e => setFormData({...formData, online_meeting_url: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Maximum Capacity</label>
                <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} required />
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-200 group">
                <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.is_active !== false} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Active & Visible to Parents</span>
              </label>

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 transition-all text-lg uppercase tracking-[0.2em]">
                  {editingId ? 'Update Slot' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
