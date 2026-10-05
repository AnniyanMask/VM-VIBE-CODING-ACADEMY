import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserCircle, Check, X, RefreshCw, Loader2, Search, Edit3, Shield, Mail, Phone, Calendar
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      alert(`Error fetching users: ${err.message}`);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role
      }).eq('id', editingId);
      
      if (error) throw error;
      
      showMessage('success', 'User profile updated');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const filtered = data.filter(item => 
    item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {message && (
        <div className={cn(
          "fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 duration-300",
          message.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Application Profiles</h3>
          <p className="text-xs text-slate-500 font-medium">Manage user roles and contact info. Note: Authentication (email/password) is managed via Supabase Auth.</p>
        </div>
        <div className="flex-1 relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role / Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                          {item.full_name?.[0] || <UserCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-slate-400 font-medium">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-fit",
                          item.role === 'admin' ? "bg-rose-100 text-rose-600" :
                          item.role === 'student' ? "bg-indigo-100 text-indigo-600" :
                          "bg-blue-100 text-blue-600"
                        )}>
                          {item.role}
                        </span>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium"><Phone className="w-3 h-3" />{item.phone || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(item)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <UserCircle className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No users found.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit User Profile</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Identity Control</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Account Role</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-700" 
                    value={formData.role || 'parent'} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="parent">Parent</option>
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 transition-all text-lg uppercase tracking-[0.2em]">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
