import { useEffect, useState } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { 
  Plus, Trash2, Edit3, Check, X, RefreshCw, Loader2, BookOpen, Clock, Calendar, Save, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminCourses() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    duration_weeks: 8,
    num_classes: 8,
    class_duration_minutes: 90,
    syllabus: Array(8).fill(0).map((_, i) => ({ week: i + 1, topic: '' })),
    is_active: true
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      alert(`Error fetching courses: ${err.message}`);
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
      name: '',
      description: '',
      duration_weeks: 8,
      num_classes: 8,
      class_duration_minutes: 90,
      is_active: true, 
      syllabus: Array(8).fill(0).map((_, i) => ({ week: i + 1, topic: '' })) 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('courses').update(formData).eq('id', editingId);
        if (error) throw error;
        
        await logActivity({
          action: 'update_course',
          entity_type: 'courses',
          entity_id: editingId,
          new_value: formData
        });
        
        showMessage('success', 'Updated successfully');
      } else {
        const { data, error } = await supabase.from('courses').insert(formData).select().single();
        if (error) throw error;

        await logActivity({
          action: 'create_course',
          entity_type: 'courses',
          entity_id: data.id,
          new_value: formData
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
      const { error } = await supabase.from('courses').update({ is_active: !item.is_active }).eq('id', item.id);
      if (error) throw error;
      
      await logActivity({
        action: 'toggle_course_visibility',
        entity_type: 'courses',
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
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Courses Management</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Academy Curriculum</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest">
            <Plus className="w-4 h-4" /> Add Course
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
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Structure</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <BookOpen className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono tracking-tighter">{item.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded tracking-widest flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{item.duration_weeks} Weeks</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded tracking-widest flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{item.class_duration_minutes} Mins</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => toggleActive(item)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                          item.is_active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        {item.is_active ? 'Active' : 'Hidden'}
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
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No courses created yet.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit' : 'Add New'} Course</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Curriculum Designer</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all shadow-sm text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">General Information</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" placeholder="Course Name (e.g. AI Foundations)" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-600" placeholder="Course Description..." rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weeks</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.duration_weeks || ''} onChange={e => setFormData({...formData, duration_weeks: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classes</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.num_classes || ''} onChange={e => setFormData({...formData, num_classes: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mins/Class</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.class_duration_minutes || ''} onChange={e => setFormData({...formData, class_duration_minutes: parseInt(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Curriculum Syllabus</label>
                <div className="grid grid-cols-1 gap-3">
                  {(formData.syllabus || []).map((module: any, idx: number) => (
                    <div key={idx} className="flex gap-3 items-center p-2 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm shrink-0">W{module.week}</div>
                      <input 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700" 
                        placeholder={`Topic for Week ${module.week}`}
                        value={module.topic}
                        onChange={e => {
                          const newSyllabus = [...formData.syllabus];
                          newSyllabus[idx].topic = e.target.value;
                          setFormData({...formData, syllabus: newSyllabus});
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-200 group">
                <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.is_active !== false} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Active & Visible on Website</span>
              </label>

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 transition-all text-lg uppercase tracking-[0.2em]">
                  {editingId ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
