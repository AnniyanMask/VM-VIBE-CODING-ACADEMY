import { useEffect, useState } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { 
  Plus, Trash2, Edit3, Check, X, RefreshCw, Loader2, DollarSign, CreditCard, BookOpen, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminPricing() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    course_id: '',
    name: '',
    description: '',
    fee: 0,
    installment_count: 1,
    children_count: 1,
    installment_breakdown: '',
    sort_order: 0,
    is_active: true
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

  async function fetchLookups() {
    try {
      const { data, error } = await supabase.from('courses').select('id, name');
      if (error) throw error;
      setCourses(data || []);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*, courses(name)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      alert(`Error fetching plans: ${err.message}`);
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
      name: '',
      description: '',
      fee: 250,
      installment_count: 1,
      children_count: 1,
      installment_breakdown: '',
      sort_order: (data.length > 0 ? Math.max(...data.map(d => d.sort_order)) + 1 : 0),
      is_active: true 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData = { ...formData };
    delete cleanData.courses;

    try {
      if (editingId) {
        const { error } = await supabase.from('payment_plans').update(cleanData).eq('id', editingId);
        if (error) throw error;

        await logActivity({
          action: 'update_pricing_plan',
          entity_type: 'payment_plans',
          entity_id: editingId,
          new_value: cleanData
        });

        showMessage('success', 'Updated successfully');
      } else {
        const { data, error } = await supabase.from('payment_plans').insert(cleanData).select().single();
        if (error) throw error;

        await logActivity({
          action: 'create_pricing_plan',
          entity_type: 'payment_plans',
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
      const { error } = await supabase.from('payment_plans').update({ is_active: !item.is_active }).eq('id', item.id);
      if (error) throw error;
      
      await logActivity({
        action: 'toggle_pricing_plan_active',
        entity_type: 'payment_plans',
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
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Pricing Plans</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Financial Setup</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest">
            <Plus className="w-4 h-4" /> Add Plan
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
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Identity</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Structure</th>
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
                          <DollarSign className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            {item.name}
                            {item.children_count > 1 && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded tracking-widest">Sibling</span>}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">{item.courses?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-black text-slate-900">RM {item.fee}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {item.installment_breakdown ? (
                            <span className="text-blue-600">Custom: {item.installment_breakdown}</span>
                          ) : (
                            `${item.installment_count} Installment${item.installment_count !== 1 ? 's' : ''}`
                          )}
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
                        {item.is_active ? 'Public' : 'Inactive'}
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
                <CreditCard className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No pricing plans created.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit' : 'Add New'} Plan</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Financial Setup</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all shadow-sm text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Applied Course</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 appearance-none" value={formData.course_id || ''} onChange={e => setFormData({...formData, course_id: e.target.value})} required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Plan Name</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" placeholder="e.g. Pay in Full" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-600" placeholder="e.g. Single student standard rate" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Total Fee (RM)</label>
                  <input type="number" step="0.01" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" value={formData.fee || ''} onChange={e => setFormData({...formData, fee: parseFloat(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Installment Count</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" value={formData.installment_count || 1} onChange={e => setFormData({...formData, installment_count: parseInt(e.target.value)})} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Students Included</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 appearance-none" value={formData.children_count || 1} onChange={e => setFormData({...formData, children_count: parseInt(e.target.value)})}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Student{n !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Display Priority</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Effective From</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" value={formData.effective_from || ''} onChange={e => setFormData({...formData, effective_from: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Effective To</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700" value={formData.effective_to || ''} onChange={e => setFormData({...formData, effective_to: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Custom Breakdown (Optional)</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" 
                  placeholder="e.g. 160, 320" 
                  value={formData.installment_breakdown || ''} 
                  onChange={e => setFormData({...formData, installment_breakdown: e.target.value})} 
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Leave empty to split total fee equally across {formData.installment_count} installments.
                </p>
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-200 group">
                <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.is_active !== false} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Visible during registration</span>
              </label>

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 transition-all text-lg uppercase tracking-[0.2em]">
                  {editingId ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
