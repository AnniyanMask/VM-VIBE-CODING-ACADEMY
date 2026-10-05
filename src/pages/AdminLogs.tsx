import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  History, Check, X, RefreshCw, Loader2, Search, Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function AdminLogs() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('activity_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    setData(data || []);
    setLoading(false);
  }

  const handleView = (item: any) => {
    setSelectedLog(item);
    setIsModalOpen(true);
  };

  const filtered = data.filter(item => 
    item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex-1 relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-xs"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-xs">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 capitalize">{item.action.replace('_', ' ')}</p>
                        <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tighter">{item.entity_type}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-700">{item.profiles?.full_name || 'System'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-500 font-medium">
                        {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm:ss')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleView(item)} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-all"><Eye className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <History className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium">No activity logs found.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h3 className="text-2xl font-black tracking-tight capitalize">{selectedLog.action.replace('_', ' ')}</h3>
                <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Log Entry: {selectedLog.id.slice(0, 8)}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar flex-1 bg-slate-50">
               <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Previous State</label>
                    <pre className="p-6 bg-white border border-slate-200 rounded-[32px] text-[10px] font-mono text-slate-500 overflow-auto max-h-[400px]">
                      {JSON.stringify(selectedLog.old_value, null, 2)}
                    </pre>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-1">New State</label>
                    <pre className="p-6 bg-blue-50 border border-blue-100 rounded-[32px] text-[10px] font-mono text-blue-700 overflow-auto max-h-[400px]">
                      {JSON.stringify(selectedLog.new_value, null, 2)}
                    </pre>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
