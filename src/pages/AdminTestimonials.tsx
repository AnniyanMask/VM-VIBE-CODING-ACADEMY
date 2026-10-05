import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Trash2, Edit3, Check, X, RefreshCw, Loader2, Star, Save, AlertCircle, Quote
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminTestimonials() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({ name: '', text: '', sort_order: 0, is_active: true });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from('testimonials').select('*').order('sort_order', { ascending: true });
    setData(data || []);
    setLoading(false);
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
    setFormData({ name: '', text: '', sort_order: (data.length > 0 ? Math.max(...data.map(d => d.sort_order)) + 1 : 0), is_active: true });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from('testimonials').update(formData).eq('id', editingId);
        showMessage('success', 'Testimonial updated');
      } else {
        await supabase.from('testimonials').insert(formData);
        showMessage('success', 'Testimonial created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const toggleActive = async (item: any) => {
    try {
      await supabase.from('testimonials').update({ is_active: !item.is_active }).eq('id', item.id);
      fetchData();
      showMessage('success', 'Status updated');
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this testimonial?')) return;
    try {
      await supabase.from('testimonials').update({ is_active: false }).eq('id', id);
      fetchData();
      showMessage('success', 'Testimonial deactivated');
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  return (
    <div className="space-y-8">
      {message && (
        <div className={cn(
          "fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 duration-300",
          message.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-slate-500 text-sm font-medium">Showcase success stories from parents and students on the home page.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest">
            <Plus className="w-5 h-5" /> Add Testimonial
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Testimonial</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-sm">
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">"{item.text}"</p>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => toggleActive(item)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          item.is_active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        {item.is_active ? 'Live' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => handleEdit(item)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleSoftDelete(item.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit' : 'Add New'} Testimonial</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Social Proof</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Author Name</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" placeholder="e.g. Sarah J. (Mother of 2)" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Testimonial Content</label>
                <div className="relative">
                   <Quote className="absolute right-4 top-4 w-12 h-12 text-blue-50 opacity-50" />
                   <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-600 resize-none relative z-10" placeholder="What did the parent say? Keep it concise..." rows={5} value={formData.text || ''} onChange={e => setFormData({...formData, text: e.target.value})} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Sort Order</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} required />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-100 group mb-0.5">
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.is_active !== false} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Published</span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 transition-all text-lg uppercase tracking-[0.2em]">
                  {editingId ? 'Update Testimonial' : 'Add Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
