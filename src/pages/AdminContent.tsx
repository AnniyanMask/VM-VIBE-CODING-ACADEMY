import { useEffect, useState } from 'react';
import { supabase, logActivity } from '../lib/supabase';
import { 
  FileText, Check, X, RefreshCw, Loader2, Edit3, AlertCircle, Layout, Image as ImageIcon, 
  Settings2, Code, List as ListIcon, Type, AlignLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editorMode, setEditorMode] = useState<'form' | 'json'>('form');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('site_content').select('*').order('section_id', { ascending: true });
      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      alert(`Error fetching content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.section_id);
    setFormData(item);
    setEditorMode('form');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('site_content').update({ content: formData.content }).eq('section_id', editingId);
      if (error) throw error;
      
      await logActivity({
        action: 'update_site_content',
        entity_type: 'site_content',
        entity_id: editingId as string,
        new_value: formData.content
      });

      showMessage('success', 'Content updated successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const updateContentField = (key: string, value: any) => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        [key]: value
      }
    });
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
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Site Content</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Website Editor</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {data.map((item) => (
            <div key={item.section_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-all flex flex-col">
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                    <Layout className="w-5 h-5" />
                  </div>
                  {item.section_id === 'hero' && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-100">
                      Primary Intake
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight capitalize">{item.section_id.replace('_', ' ')}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Section Content</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Preview</p>
                   {Object.entries(item.content || {}).slice(0, 3).map(([k, v]: [string, any]) => (
                     <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white transition-all">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.replace('_', ' ')}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                          {typeof v === 'string' ? v : JSON.stringify(v)}
                        </p>
                     </div>
                   ))}
                   {Object.keys(item.content || {}).length === 0 && (
                     <p className="text-[10px] text-slate-400 italic px-1">No preview available</p>
                   )}
                   {Object.keys(item.content || {}).length > 3 && (
                     <p className="text-[9px] text-slate-300 font-bold text-center uppercase tracking-widest pt-1">+ {Object.keys(item.content || {}).length - 3} more fields</p>
                   )}
                </div>
              </div>
              <button 
                onClick={() => handleEdit(item)}
                className="w-full py-4 bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest border-t border-slate-100 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit Content
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize">Edit {editingId?.replace('_', ' ')}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Content Customizer</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-lg p-1 border border-slate-200 flex shadow-sm mr-4">
                  <button 
                    onClick={() => setEditorMode('form')}
                    className={cn("p-1.5 rounded-md transition-all", editorMode === 'form' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-50")}
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setEditorMode('json')}
                    className={cn("p-1.5 rounded-md transition-all", editorMode === 'json' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-50")}
                  >
                    <Code className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 shadow-sm"><X className="w-5 h-5" /></button>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
              {editorMode === 'form' ? (
                <div className="space-y-6">
                  {Object.entries(formData.content || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center gap-2 ml-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key.replace('_', ' ')}</span>
                      </div>
                      
                      {typeof value === 'boolean' ? (
                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer border border-slate-100">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-blue-600"
                            checked={value}
                            onChange={e => updateContentField(key, e.target.checked)}
                          />
                          <span className="text-sm font-bold text-slate-700">Enable this feature</span>
                        </label>
                      ) : Array.isArray(value) ? (
                        <div className="space-y-2">
                          {value.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input 
                                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm"
                                value={typeof item === 'string' ? item : JSON.stringify(item)}
                                onChange={e => {
                                  const newList = [...value];
                                  newList[idx] = e.target.value;
                                  updateContentField(key, newList);
                                }}
                              />
                              <button 
                                type="button"
                                onClick={() => updateContentField(key, value.filter((_, i) => i !== idx))}
                                className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button"
                            onClick={() => updateContentField(key, [...value, ""])}
                            className="w-full p-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all"
                          >
                            + Add Item
                          </button>
                        </div>
                      ) : (key.includes('text') || key.includes('description') || key.includes('content') || value.length > 50) ? (
                        <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 text-sm"
                          rows={3}
                          value={value}
                          onChange={e => updateContentField(key, e.target.value)}
                        />
                      ) : (
                        <input 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 text-sm"
                          value={value}
                          onChange={e => updateContentField(key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}

                  {Object.keys(formData.content || {}).length === 0 && (
                    <div className="p-12 text-center bg-slate-50 rounded-[32px] border border-slate-100 space-y-3">
                       <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                       <p className="text-slate-500 font-medium">No fields detected in this section.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 leading-relaxed font-bold uppercase tracking-tight">
                      Careful: JSON editing can break the layout if keys are renamed.
                    </p>
                  </div>
                  <textarea 
                    className="w-full p-6 bg-slate-900 text-blue-400 font-mono text-xs rounded-[24px] focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
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
              )}

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all text-sm uppercase tracking-widest">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
