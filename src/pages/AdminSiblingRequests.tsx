import { useEffect, useState } from 'react';
import { supabase, type SiblingRequest, type ClassSlot } from '../lib/supabase';
import { Users, CheckCircle2, XCircle, Loader2, MessageSquare, Clock, RefreshCw, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminSiblingRequests() {
  const [requests, setRequests] = useState<SiblingRequest[]>([]);
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [offeredSlots, setOfferedSlots] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [reqsRes, slotsRes] = await Promise.all([
        supabase
          .from('sibling_requests')
          .select('*, registrations:registration_id(*, profiles:parent_id(*), class_slots(*, courses(*), age_groups(*)))')
          .order('created_at', { ascending: false }),
        supabase.from('class_slots').select('*, courses(*), age_groups(*)').eq('is_active', true)
      ]);

      if (reqsRes.error) throw reqsRes.error;
      if (slotsRes.error) throw slotsRes.error;

      if (reqsRes.data) setRequests(reqsRes.data as any);
      if (slotsRes.data) setSlots(slotsRes.data as any);
    } catch (err: any) {
      console.error('Error fetching sibling requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateRequest(id: string, status: SiblingRequest['status']) {
    setProcessing(id);
    const { error } = await supabase
      .from('sibling_requests')
      .update({ 
        status, 
        admin_remarks: remarks[id] || null,
        offered_slot_id: offeredSlots[id] || null
      })
      .eq('id', id);

    if (!error) fetchData();
    setProcessing(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={fetchData} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{req.registrations?.student_name}</h3>
                        <p className="text-xs text-slate-500">Parent: {req.registrations?.profiles?.full_name}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      req.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                      req.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 text-amber-600'
                    )}>
                      {req.status}
                    </span>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Parent's Message</p>
                    <p className="text-sm text-slate-700 leading-relaxed italic">"{req.message || 'No message provided.'}"</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Offer Alternative Slot</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      value={offeredSlots[req.id] || req.offered_slot_id || ''}
                      onChange={e => setOfferedSlots({ ...offeredSlots, [req.id]: e.target.value })}
                    >
                      <option value="">No alternative offered</option>
                      {slots.map(slot => (
                        <option key={slot.id} value={slot.id}>
                          {slot.day_of_week} {slot.start_time.slice(0, 5)} ({slot.courses?.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Internal Note / Reply</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Write a reply or internal note..."
                      value={remarks[req.id] || req.admin_remarks || ''}
                      onChange={e => setRemarks({ ...remarks, [req.id]: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      disabled={processing === req.id}
                      onClick={() => updateRequest(req.id, 'resolved')}
                      className="flex items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-[10px] uppercase hover:bg-emerald-100 transition-all disabled:opacity-50 border border-emerald-100"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Resolve
                    </button>
                    <button 
                      disabled={processing === req.id}
                      onClick={() => updateRequest(req.id, 'rejected')}
                      className="flex items-center justify-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold text-[10px] uppercase hover:bg-rose-100 transition-all disabled:opacity-50 border border-rose-100"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                    <a 
                      href={`https://wa.me/${req.registrations?.profiles?.phone?.replace(/[^0-9]/g, '')}`} 
                      target="_blank"
                      className="col-span-2 flex items-center justify-center gap-3 p-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      Contact Parent via WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
              <p className="text-slate-400 italic">No sibling requests found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
