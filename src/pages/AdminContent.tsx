import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FileText, Check, X, RefreshCw, Loader2, Edit3, AlertCircle, Layout, Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from('site_content').select('*').order('section_id', { ascending: true });
    setData(data || []);
    setLoading(false);
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.section_id);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('site_content').update({ content: formData.content }).eq('section_id', editingId);
      showMessage('success', 'Content updated successfully');
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
          <p className="text-slate-500 text-sm font-medium">Customize section headings, hero text, and safety points.</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <div key={item.section_id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-all flex flex-col">
              <div className="p-8 space-y-4 flex-1">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <Layout className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize">{item.section_id.replace('_', ' ')}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Section Content</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preview</p>
                   <p className="text-sm text-slate-600 line-clamp-3 font-medium">
                     {item.content?.title || item.content?.heading || 'No preview available'}
                   </p>
                </div>
              </div>
              <button 
                onClick={() => handleEdit(item)}
                className="w-full py-5 bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-[0.2em] border-t border-slate-100 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit Content
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight capitalize">Edit {editingId?.replace('_', ' ')}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Content Editor</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 flex gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-amber-900">Advanced JSON Editor</p>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    This section uses structured data. Ensure you maintain the correct property names while editing values.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Structured JSON Content</label>
                <textarea 
                  className="w-full p-6 bg-slate-900 text-blue-400 font-mono text-xs rounded-[32px] focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                  rows={15}
                  value={JSON.stringify(formData.content, null, 2)}
                  onChange={e => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, content: parsed });
                    } catch (err) {}
                  }}
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black shadow-xl hover:bg-slate-800 transition-all text-lg uppercase tracking-[0.2em]">
                  Publish Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
