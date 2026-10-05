import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Trash2, Edit3, Check, X, RefreshCw, Loader2, CreditCard, Save, AlertCircle, Upload, Copy, MoveUp, MoveDown
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminPaymentAccounts() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    bank_name: '',
    account_name: '',
    account_number: '',
    duitnow_id: '',
    reference_note: '',
    payment_notes: '',
    qr_path: '',
    is_active: true,
    sort_order: 0
  });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function getSignedUrl() {
      if (formData.qr_path) {
        const { data } = await supabase.storage.from('payment-qr').createSignedUrl(formData.qr_path, 3600);
        setPreviewUrl(data?.signedUrl || null);
      } else {
        setPreviewUrl(null);
      }
    }
    getSignedUrl();
  }, [formData.qr_path]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('payment_accounts')
      .select('*')
      .order('sort_order', { ascending: true });
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
    setFormData({ 
      bank_name: '',
      account_name: '',
      account_number: '',
      duitnow_id: '',
      reference_note: 'Use child name + phone as reference',
      payment_notes: 'Upload your slip after transfer',
      qr_path: '',
      is_active: true,
      sort_order: data.length 
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'File size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `qrs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-qr')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setFormData({ ...formData, qr_path: filePath });
      showMessage('success', 'QR code uploaded');
    } catch (err: any) {
      showMessage('error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from('payment_accounts').update(formData).eq('id', editingId);
        showMessage('success', 'Account updated successfully');
      } else {
        await supabase.from('payment_accounts').insert(formData);
        showMessage('success', 'Account created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const toggleActive = async (item: any) => {
    try {
      await supabase.from('payment_accounts').update({ is_active: !item.is_active }).eq('id', item.id);
      fetchData();
      showMessage('success', 'Status toggled');
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will permanently remove this bank account.')) return;
    try {
      await supabase.from('payment_accounts').delete().eq('id', id);
      fetchData();
      showMessage('success', 'Account deleted');
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
          <p className="text-slate-500 text-sm font-medium">Manage multiple bank accounts for student fee collections.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest">
            <Plus className="w-5 h-5" /> Add Bank Account
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
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank / Account</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.bank_name}</p>
                          <p className="text-xs text-slate-400 font-medium">{item.account_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-mono text-sm font-bold text-slate-700 tracking-tighter">{item.account_number}</p>
                      {item.duitnow_id && <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">DuitNow: {item.duitnow_id}</p>}
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => toggleActive(item)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                          item.is_active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => handleEdit(item)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit' : 'Add New'} Bank Account</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Payment Endpoint</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Form Side */}
                <form onSubmit={handleSave} className="p-8 space-y-6 border-r border-slate-100">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" placeholder="e.g. Maybank / CIMB" value={formData.bank_name || ''} onChange={e => setFormData({...formData, bank_name: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" placeholder="e.g. VM VIBE ACADEMY" value={formData.account_name || ''} onChange={e => setFormData({...formData, account_name: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-700" placeholder="0000000000" value={formData.account_number || ''} onChange={e => setFormData({...formData, account_number: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DuitNow ID (Optional)</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" placeholder="e.g. Company BRN" value={formData.duitnow_id || ''} onChange={e => setFormData({...formData, duitnow_id: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Instruction</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700" placeholder="e.g. Use child name as reference" value={formData.reference_note || ''} onChange={e => setFormData({...formData, reference_note: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Notes</label>
                      <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 resize-none" rows={2} value={formData.payment_notes || ''} onChange={e => setFormData({...formData, payment_notes: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">QR Code Image</label>
                    <label className={cn(
                      "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-3xl cursor-pointer transition-all",
                      uploading ? "bg-slate-50 border-slate-200" : "bg-white border-blue-100 hover:border-blue-400 hover:bg-blue-50/20"
                    )}>
                      <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-blue-600 mb-2" />
                          <span className="text-xs font-bold text-slate-600">{formData.qr_path ? 'Change QR Image' : 'Upload QR Image'}</span>
                          <span className="text-[10px] text-slate-400 mt-1 uppercase">JPG, PNG (Max 2MB)</span>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sort Order</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-slate-100 group mb-0.5">
                        <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.is_active !== false} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Active</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 transition-all text-lg uppercase tracking-[0.2em]">
                    {editingId ? 'Update Account' : 'Create Account'}
                  </button>
                </form>

                {/* Preview Side */}
                <div className="p-8 bg-slate-50 flex flex-col items-center justify-center space-y-8">
                   <div className="w-full max-w-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Live Parent Preview</p>
                      <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="space-y-2">
                          <h4 className="text-2xl font-black tracking-tight">Bank Details</h4>
                          <p className="text-slate-400 text-xs font-medium">Use these details for online transfers.</p>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bank / Account</p>
                              <p className="font-bold text-sm">{formData.bank_name || 'Bank Name'} — {formData.account_name || 'Holder Name'}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Account Number</p>
                              <div className="flex items-center gap-2">
                                 <p className="text-xl font-black text-blue-400 tracking-tighter">{formData.account_number || '0000000000'}</p>
                                 <div className="p-1.5 bg-slate-800 rounded-lg text-slate-500"><Copy className="w-3 h-3" /></div>
                              </div>
                           </div>
                           {formData.reference_note && (
                             <div className="p-3 bg-slate-800 rounded-xl flex gap-2">
                               <AlertCircle className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                               <p className="text-[10px] text-slate-400 leading-tight italic">{formData.reference_note}</p>
                             </div>
                           )}
                        </div>

                        <div className="bg-white p-3 rounded-2xl aspect-square w-32 mx-auto flex items-center justify-center">
                          {previewUrl ? (
                            <img src={previewUrl} className="w-full h-full object-contain" alt="QR" />
                          ) : (
                            <CreditCard className="w-8 h-8 text-slate-200" />
                          )}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
