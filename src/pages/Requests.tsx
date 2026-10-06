import { useEffect, useState } from 'react';
import { supabase, type Registration, type ParentRequest } from '../lib/supabase';
import { MessageSquare, ArrowLeft, Loader2, Send, Clock, CheckCircle2, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Requests() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [requests, setRequests] = useState<ParentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    registration_id: '',
    type: 'slot_change' as any,
    message: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const [regRes, reqRes] = await Promise.all([
      supabase.from('registrations').select('*').eq('parent_id', session.user.id),
      supabase.from('parent_requests').select('*, registrations(*)').eq('parent_id', session.user.id).order('created_at', { ascending: false })
    ]);

    if (regRes.data) setRegistrations(regRes.data);
    if (reqRes.data) setRequests(reqRes.data as any);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('parent_requests').insert({
      parent_id: user?.id,
      registration_id: formData.registration_id,
      type: formData.type,
      details: { message: formData.message },
      status: 'pending'
    });

    if (!error) {
      setShowForm(false);
      setFormData({ registration_id: '', type: 'slot_change', message: '' });
      fetchData();
    }
    setSubLoading(false);
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto space-y-8">
        <div className="space-y-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm text-slate-500 hover:text-blue-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Requests</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Support & Changes</p>
              </div>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/10",
                showForm ? "bg-slate-900 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {showForm ? <><XCircle className="w-4 h-4" /> Cancel</> : <><Send className="w-4 h-4" /> New Request</>}
            </button>
          </header>

          {showForm && (
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Child</label>
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500"
                    value={formData.registration_id}
                    onChange={e => setFormData({ ...formData, registration_id: e.target.value })}
                  >
                    <option value="">Choose child</option>
                    {registrations.map(r => <option key={r.id} value={r.id}>{r.student_name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Request Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'slot_change', label: 'Slot Change' },
                      { id: 'makeup_class', label: 'Make-up Class' },
                      { id: 'withdrawal', label: 'Withdrawal' },
                      { id: 'data_correction', label: 'Data Fix' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t.id })}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-xs font-bold transition-all capitalize",
                          formData.type === t.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Message Details</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    placeholder="Describe your request in detail..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button 
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Submit Request</>}
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 px-2">Recent Requests</h2>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 capitalize">{req.type.replace('_', ' ')}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.registrations?.student_name}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          req.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                          req.status === 'rejected' ? "bg-rose-50 text-rose-600" :
                          "bg-amber-50 text-amber-600"
                        )}>
                          {req.status}
                        </span>
                      </div>
                      
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 text-sm text-slate-600 italic">
                        "{req.details?.message}"
                      </div>

                      {req.admin_remarks && (
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                          <Info className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1">Admin Response</p>
                            <p className="text-xs text-blue-700 leading-relaxed font-medium">{req.admin_remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
                <p className="text-slate-400 italic">No requests submitted yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
