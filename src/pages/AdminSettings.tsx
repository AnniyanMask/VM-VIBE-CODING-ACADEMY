import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Settings, Check, X, RefreshCw, Loader2, Save, AlertCircle, Phone, Mail, MapPin, Globe, Share2, MessageSquare, List, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [settingsRes, accountsRes] = await Promise.all([
        supabase.from('site_settings').select('*').order('key', { ascending: true }),
        supabase.from('payment_accounts').select('*').order('sort_order', { ascending: true })
      ]);
      if (settingsRes.error) throw settingsRes.error;
      if (accountsRes.error) throw accountsRes.error;

      setData(settingsRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (err: any) {
      alert(`Error fetching settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const getSummary = (item: any) => {
    if (item.key === 'contact') return item.value?.phone || 'No phone set';
    if (item.key === 'lead_sources') return `${item.value?.length || 0} active sources`;
    if (item.key === 'registration_control') return `Status: ${item.value?.status || 'open'}`;
    if (item.key === 'message_templates') return `${Object.keys(item.value || {}).length} templates defined`;
    return `Last sync: ${new Date(item.updated_at).toLocaleDateString()}`;
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.key);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('site_settings').update({ value: formData.value }).eq('key', editingId);
      if (error) throw error;
      
      showMessage('success', 'Settings updated');
      setIsModalOpen(false);
      fetchData();
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
          <p className="text-slate-500 text-sm font-medium">Global configuration for contact info, bank details, and business rules.</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Virtual Card for Bank Accounts */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-all flex flex-col">
            <div className="p-6 space-y-3 flex-1">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Bank & Payment</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Fee Collection</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary Account</p>
                 <p className="text-[9px] text-slate-500 font-bold uppercase">
                   {accounts[0] ? `${accounts[0].bank_name} ...${accounts[0].account_number.slice(-4)}` : 'No accounts configured'}
                 </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin/payment-accounts')}
              className="w-full py-3.5 bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest border-t border-slate-100 hover:bg-slate-900 hover:text-white transition-all"
            >
              Configure
            </button>
          </div>

          {data.map((item) => {
            let Icon = Settings;
            if (item.key === 'contact') Icon = Phone;
            if (item.key === 'bank_info') Icon = Globe;
            if (item.key === 'lead_sources') Icon = List;
            if (item.key === 'registration_control') Icon = Globe;
            if (item.key === 'message_templates') Icon = MessageSquare;

            // Hide the old bank_info key if it exists, as we migrated to table
            if (item.key === 'bank_info') return null;

            return (
              <div key={item.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-all flex flex-col">
                <div className="p-6 space-y-3 flex-1">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight capitalize">{item.key.replace('_', ' ')}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">System Setting</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Current State</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase truncate">
                       {getSummary(item)}
                     </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleEdit(item)}
                  className="w-full py-3.5 bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest border-t border-slate-100 hover:bg-slate-900 hover:text-white transition-all"
                >
                  Configure
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight capitalize">{editingId?.replace('_', ' ')} Settings</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Global Config</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              {editingId === 'contact' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(formData.value || {}).map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{key.replace('_', ' ')}</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                        rows={key === 'address' || key === 'operating_hours' || key === 'venue_note' ? 3 : 1}
                        value={formData.value[key]}
                        onChange={e => {
                          const newValue = { ...formData.value, [key]: e.target.value };
                          setFormData({ ...formData, value: newValue });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {editingId === 'lead_sources' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                    <List className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      Enter sources separated by commas. These will appear in the "How did you hear about us?" dropdown during registration.
                    </p>
                  </div>
                  <textarea 
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[32px] focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                    rows={8}
                    value={Array.isArray(formData.value) ? formData.value.join(', ') : ''}
                    onChange={e => {
                      const list = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      setFormData({ ...formData, value: list });
                    }}
                  />
                </div>
              )}

              {editingId === 'registration_control' && (
                <div className="space-y-6">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Current Portal Status</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['open', 'closed', 'waitlist'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, value: { ...formData.value, status: s } })}
                        className={cn(
                          "p-6 rounded-[32px] font-black uppercase text-xs tracking-widest border-2 transition-all",
                          formData.value?.status === s ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="p-6 bg-slate-900 rounded-[32px] text-white">
                    <p className="text-sm font-bold leading-relaxed opacity-80">
                      {formData.value?.status === 'open' ? 'Parents can register students normally.' :
                       formData.value?.status === 'closed' ? 'Portal is locked. No new registrations allowed.' :
                       'Registrations are accepted but marked as waitlisted by default.'}
                    </p>
                  </div>
                </div>
              )}

              {editingId === 'message_templates' && (
                <div className="space-y-8">
                  {Object.keys(formData.value || {}).map(k => (
                    <div key={k} className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.replace('_', ' ')}</label>
                        <span className="text-[8px] text-blue-500 font-bold uppercase">WhatsApp Template</span>
                      </div>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm text-slate-700"
                        rows={4}
                        value={formData.value[k]}
                        onChange={e => {
                          const newValue = { ...formData.value, [k]: e.target.value };
                          setFormData({ ...formData, value: newValue });
                        }}
                      />
                      <p className="text-[8px] text-slate-400 px-1 italic">Variables: {'{{parent_name}}, {{student_name}}, {{slot_name}}'}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Catch-all for unknown setting keys */}
              {!['contact', 'lead_sources', 'registration_control', 'message_templates'].includes(editingId || '') && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Structured JSON Value</label>
                  <textarea 
                    className="w-full p-6 bg-slate-900 text-blue-400 font-mono text-xs rounded-[32px] focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                    rows={12}
                    value={JSON.stringify(formData.value, null, 2)}
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, value: parsed });
                      } catch (err) {}
                    }}
                  />
                </div>
              )}

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 transition-all text-lg uppercase tracking-[0.2em]">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
