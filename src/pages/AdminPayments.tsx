import { useEffect, useState } from 'react';
import { supabase, type Payment, type PaymentSchedule } from '../lib/supabase';
import { FileText, CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink, RefreshCw, DollarSign, Calendar, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminPayments() {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('payment_schedules')
      .select('*, profiles(full_name, email), payments(*)')
      .order('due_date', { ascending: true });

    if (data) setSchedules(data as any);
    setLoading(false);
  }

  async function markAsPaid(scheduleId: string) {
    if (!confirm('Are you sure you want to mark this installment as paid manually?')) return;
    setProcessing(scheduleId);
    const { error } = await supabase
      .from('payment_schedules')
      .update({ status: 'paid' })
      .eq('id', scheduleId);

    if (!error) fetchData();
    setProcessing(null);
  }

  async function updatePaymentStatus(paymentId: string, status: Payment['status']) {
    setProcessing(paymentId);
    const { error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', paymentId);

    if (!error) {
      // If payment is verified, we might want to auto-mark schedule as paid if logic allows
      // For now, keep it simple and just refresh
      fetchData();
    }
    setProcessing(null);
  }

  async function getSlipUrl(path: string) {
    const { data } = await supabase.storage.from('payment-slips').createSignedUrl(path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  }

  const filtered = schedules.filter(s => {
    const matchesSearch = 
      s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by parent name or email..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-white p-1 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            {['all', 'pending', 'paid'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === f ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-900"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-6">
          {filtered.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 md:p-10 flex flex-col lg:flex-row gap-12">
                <div className="flex-1 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <DollarSign className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{schedule.profiles?.full_name}</h3>
                        <p className="text-sm text-slate-500">{schedule.profiles?.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      schedule.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {schedule.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Installment</p>
                      <p className="font-bold text-slate-900">№ {schedule.installment_number}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Due</p>
                      <p className="font-bold text-blue-600 text-lg">RM {schedule.amount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {schedule.due_date ? new Date(schedule.due_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {schedule.payments && schedule.payments.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proof of Payment</p>
                      <div className="space-y-3">
                        {schedule.payments.map((p) => (
                          <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <button onClick={() => getSlipUrl(p.slip_url)} className="p-2 bg-white rounded-xl shadow-sm text-blue-600 hover:scale-105 transition-all">
                                <FileText className="w-5 h-5" />
                              </button>
                              <div>
                                <p className="text-sm font-bold text-slate-900">Uploaded {new Date(p.created_at).toLocaleDateString()}</p>
                                <p className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest",
                                  p.status === 'verified' ? "text-emerald-500" : "text-amber-500"
                                )}>{p.status}</p>
                              </div>
                            </div>
                            {p.status === 'pending' && (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => updatePaymentStatus(p.id, 'verified')}
                                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => updatePaymentStatus(p.id, 'rejected')}
                                  className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:w-72">
                  {schedule.status !== 'paid' ? (
                    <button
                      disabled={processing === schedule.id}
                      onClick={() => markAsPaid(schedule.id)}
                      className="w-full py-8 bg-slate-900 text-white rounded-[32px] font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <span>Mark as Paid</span>
                      <p className="text-[10px] text-slate-500 font-normal uppercase tracking-widest">Manual Override</p>
                    </button>
                  ) : (
                    <div className="w-full h-full p-8 border-2 border-emerald-100 rounded-[32px] flex flex-col items-center justify-center text-center gap-4 bg-emerald-50/30">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-emerald-900">Installment Settled</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100">
              <p className="text-slate-400 italic font-medium">No results matching your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
