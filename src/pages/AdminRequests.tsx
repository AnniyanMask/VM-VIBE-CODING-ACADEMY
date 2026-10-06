import { useEffect, useState } from 'react';
import { supabase, type ParentRequest } from '../lib/supabase';
import { 
  MessageSquare, Check, X, Search, Filter, 
  Loader2, User, Calendar, Clock, RefreshCw, 
  AlertCircle, ChevronRight, Mail, Phone
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function AdminRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parent_requests')
        .select('*, profiles:parent_id(*), registrations:registration_id(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRequests(data);
    } catch (err: any) {
      console.error('Error fetching admin requests:', err);
      alert(`Error fetching requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(status: string) {
    if (!selectedReq) return;

    const { error } = await supabase
      .from('parent_requests')
      .update({ 
        status, 
        admin_remarks: adminRemarks,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedReq.id);

    if (!error) {
      setRequests(requests.map(r => r.id === selectedReq.id ? { ...r, status, admin_remarks: adminRemarks } : r));
      setIsModalOpen(false);
      setSelectedReq(null);
      setAdminRemarks('');
    }
  }

  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.registrations?.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.details?.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search requests, parents or students..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="w-full pl-10 pr-8 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none font-bold text-slate-700 text-xs uppercase tracking-widest"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="in_review">In Review</option>
            </select>
          </div>
          <button 
            onClick={fetchData}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-[32px] border border-slate-100 hover:border-slate-200 transition-all group shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0",
                    req.type === 'withdrawal' ? "bg-rose-50 text-rose-600" :
                    req.type === 'slot_change' ? "bg-blue-50 text-blue-600" :
                    "bg-amber-50 text-amber-600"
                  )}>
                    {req.type[0].toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 capitalize">{req.type.replace('_', ' ')}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        req.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                        req.status === 'rejected' ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-500">{req.registrations?.student_name}</p>
                    <p className="text-xs text-slate-400">{format(new Date(req.created_at), 'dd MMM yyyy, h:mm a')}</p>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Parent: {req.profiles?.full_name}</p>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 italic">
                    "{req.details?.message}"
                  </div>
                </div>

                <div className="flex flex-col md:items-end justify-center gap-3">
                  <button 
                    onClick={() => {
                      setSelectedReq(req);
                      setAdminRemarks(req.admin_remarks || '');
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Take Action
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {isModalOpen && selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <header className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Review Request</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {selectedReq.type.replace('_', ' ')} • {selectedReq.registrations?.student_name}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </header>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Original Message</p>
                  <p className="text-sm text-slate-700 leading-relaxed italic">"{selectedReq.details?.message}"</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Admin Remarks / Reply</label>
                  <textarea 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-medium"
                    rows={4}
                    placeholder="Type your response to the parent..."
                    value={adminRemarks}
                    onChange={e => setAdminRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button 
                  onClick={() => handleUpdateStatus('approved')}
                  className="bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  <Check className="w-5 h-5" /> Approve
                </button>
                <button 
                  onClick={() => handleUpdateStatus('rejected')}
                  className="bg-rose-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  <X className="w-5 h-5" /> Reject
                </button>
                <button 
                  onClick={() => handleUpdateStatus('in_review')}
                  className="col-span-2 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-100"
                >
                  <Clock className="w-5 h-5" /> Mark as In Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
