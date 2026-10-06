import { useEffect, useState } from 'react';
import { supabase, type Payment, type PaymentSchedule } from '../lib/supabase';
import { FileText, CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink, RefreshCw, DollarSign, Calendar, Search, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import ConfirmDialog from '../components/admin/ConfirmDialog';

export default function AdminPayments() {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, scheduleId: string | null }>({ isOpen: false, scheduleId: null });

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountingSchedule, setDiscountingSchedule] = useState<PaymentSchedule | null>(null);
  const [discountValue, setDiscountValue] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*, profiles:parent_id(full_name, email), payments(*), registrations:registration_id(student_name)')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setSchedules(data as any);
    } catch (err: any) {
      console.error('Error fetching admin payments:', err);
      alert(`Error fetching payments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateDiscount(e: React.FormEvent) {
    e.preventDefault();
    if (!discountingSchedule) return;
    
    setProcessing(discountingSchedule.id);
    try {
      // Calculate new amount based on original amount if possible, 
      // or just trust the input and update the amount directly.
      // Since we don't have original_amount column yet, we'll just update amount.
      // But we'll try to be smart if the user wants to reduce it.
      
      const { error } = await supabase
        .from('payment_schedules')
        .update({ 
          amount: Math.max(0, discountValue) // Admin sets the FINAL amount they want the user to pay
        })
        .eq('id', discountingSchedule.id);
      
      if (error) throw error;
      
      setIsDiscountModalOpen(false);
      setDiscountingSchedule(null);
      fetchData();
    } catch (err: any) {
      alert(`Error updating amount: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  }

  async function markAsPaid(scheduleId: string) {
    try {
      setProcessing(scheduleId);
      const { error } = await supabase
        .from('payment_schedules')
        .update({ status: 'paid' })
        .eq('id', scheduleId);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Error marking as paid: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  }

  async function updatePaymentStatus(paymentId: string, status: Payment['status'], payment_schedule_id?: string | null) {
    try {
      setProcessing(paymentId);
      const { error } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', paymentId);

      if (error) throw error;

      // If payment is verified, mark schedule as paid
      if (status === 'verified' && payment_schedule_id) {
        const { error: schedError } = await supabase
          .from('payment_schedules')
          .update({ status: 'paid' })
          .eq('id', payment_schedule_id);
        if (schedError) throw schedError;
      }
      
      fetchData();
    } catch (err: any) {
      alert(`Error updating payment: ${err.message}`);
    } finally {
      setProcessing(null);
    }
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
            <div key={schedule.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{schedule.profiles?.full_name}</h3>
                        <p className="text-xs text-slate-500">{schedule.profiles?.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      schedule.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {schedule.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Installment</p>
                      <p className="font-bold text-slate-900 text-sm">№ {schedule.installment_number}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Due</p>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-blue-600 text-base">RM {schedule.amount}</p>
                          {schedule.status === 'pending' && (
                            <button 
                              onClick={() => {
                                setDiscountingSchedule(schedule);
                                setDiscountValue(Number(schedule.amount));
                                setIsDiscountModalOpen(true);
                              }}
                              className="p-1 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                              title="Adjust Amount"
                            >
                              <CreditCard className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {(schedule as any).registrations?.discount_amount > 0 && (
                          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                            Reg. Discount RM {(schedule as any).registrations?.discount_amount || 0}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {schedule.due_date ? new Date(schedule.due_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {schedule.payments && schedule.payments.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proof of Payment</p>
                      <div className="space-y-2">
                        {schedule.payments.map((p) => (
                          <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <button onClick={() => getSlipUrl(p.slip_url)} className="p-2 bg-white rounded-lg shadow-sm text-blue-600 hover:scale-105 transition-all">
                                <FileText className="w-4 h-4" />
                              </button>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Uploaded {new Date(p.created_at).toLocaleDateString()}</p>
                                <p className={cn(
                                  "text-[9px] font-bold uppercase tracking-widest",
                                  p.status === 'verified' ? "text-emerald-500" : "text-amber-500"
                                )}>{p.status}</p>
                              </div>
                            </div>
                            {p.status === 'pending' && (
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => updatePaymentStatus(p.id, 'verified', schedule.id)}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => updatePaymentStatus(p.id, 'rejected')}
                                  className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
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

                <div className="lg:w-64">
                  {schedule.status !== 'paid' ? (
                    <button
                      disabled={processing === schedule.id}
                      onClick={() => setConfirmDialog({ isOpen: true, scheduleId: schedule.id })}
                      className="w-full h-full min-h-[160px] bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-sm">Mark as Paid</span>
                      <p className="text-[9px] text-slate-500 font-normal uppercase tracking-widest">Manual Override</p>
                    </button>
                  ) : (
                    <div className="w-full h-full min-h-[160px] p-6 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-emerald-50/30">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-emerald-900 text-sm">Settled</p>
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

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, scheduleId: null })}
        onConfirm={() => confirmDialog.scheduleId && markAsPaid(confirmDialog.scheduleId)}
        title="Confirm Manual Payment"
        message="Are you sure you want to mark this installment as paid manually? This should only be done if you have verified the funds in your bank account."
        confirmText="Mark as Paid"
      />

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Adjust Installment</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Reduction</p>
              </div>
              <button onClick={() => setIsDiscountModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><XCircle className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleUpdateDiscount} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Set the new amount due for this installment. This will update what the parent sees in their dashboard.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Amount Due (RM)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">RM</span>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 text-lg"
                      value={discountValue}
                      onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button 
                  type="submit" 
                  disabled={!!processing}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Update Amount</>}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
