import { useEffect, useState } from 'react';
import { supabase, type PaymentSchedule, type Payment } from '../lib/supabase';
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Loader2, ArrowLeft, MessageSquare, CreditCard, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { cn } from '../lib/utils';

export default function ParentPayments() {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const [schedRes, bankRes] = await Promise.all([
      supabase.from('payment_schedules').select('*, payments(*)').eq('parent_id', session.user.id).order('due_date', { ascending: true }),
      supabase.from('payment_accounts').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ]);

    if (schedRes.data) setSchedules(schedRes.data as any);
    
    if (bankRes.data && bankRes.data.length > 0) {
      // Get signed URLs for each account's QR code
      const accountsWithUrls = await Promise.all(bankRes.data.map(async (acc) => {
        if (acc.qr_path) {
          const { data } = await supabase.storage.from('payment-qr').createSignedUrl(acc.qr_path, 3600);
          return { ...acc, qr_url: data?.signedUrl };
        }
        return acc;
      }));
      setBankInfo(accountsWithUrls);
    }
    setLoading(false);
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleFileUpload(scheduleId: string, file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(scheduleId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const fullPath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(fullPath, file);

      if (uploadError) throw uploadError;

      const schedule = schedules.find(s => s.id === scheduleId);

      // Create payment record linked to schedule
      const { error: paymentError } = await supabase.from('payments').insert({
        schedule_id: scheduleId,
        registration_id: schedule?.registration_id, // If specific
        parent_id: user.id,
        amount: schedule?.amount || 0,
        slip_url: fullPath,
        status: 'pending',
      });

      if (paymentError) throw paymentError;

      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 md:px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm text-slate-500 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payments</h1>
              <p className="text-slate-500 text-sm">Upload payment slips to settle your outstanding dues.</p>
            </div>
          </header>

          {/* Bank Info Section */}
          {bankInfo && Array.isArray(bankInfo) && bankInfo.length > 0 && (
            <div className="space-y-6">
              {bankInfo.map((acc, idx) => (
                <div key={acc.id} className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <CreditCard className="w-48 h-48 rotate-12" />
                  </div>
                  
                  <div className="flex flex-col lg:flex-row gap-12 relative">
                    <div className="flex-1 space-y-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-3xl font-black tracking-tight">Bank Details</h2>
                          {idx === 0 && <span className="px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black uppercase rounded tracking-widest">Primary</span>}
                        </div>
                        <p className="text-slate-400 font-medium">Use these details for online transfers.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank Name</p>
                          <p className="text-lg font-bold">{acc.bank_name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Name</p>
                          <p className="text-lg font-bold">{acc.account_name}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Number</p>
                          <div className="flex items-center gap-3">
                            <p className="text-2xl md:text-3xl font-black tracking-tighter text-blue-400">{acc.account_number}</p>
                            <button 
                              onClick={() => handleCopy(acc.account_number)}
                              className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                            >
                              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        {acc.duitnow_id && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DuitNow ID</p>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-slate-300">{acc.duitnow_id}</p>
                              <button onClick={() => handleCopy(acc.duitnow_id)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-400"><Copy className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {acc.reference_note && (
                          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center justify-between gap-3">
                            <div className="flex gap-3">
                              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                              <p className="text-xs text-slate-400 leading-relaxed italic">
                                Ref: <span className="text-blue-400 font-bold not-italic">{acc.reference_note}</span>
                              </p>
                            </div>
                            <button onClick={() => handleCopy(acc.reference_note)} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white"><Copy className="w-4 h-4" /></button>
                          </div>
                        )}
                        {acc.payment_notes && (
                          <p className="text-[10px] text-slate-500 px-1 font-medium">{acc.payment_notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="lg:w-64 space-y-4">
                      <div className="bg-white p-4 rounded-3xl shadow-lg aspect-square flex items-center justify-center overflow-hidden">
                        {acc.qr_url ? (
                          <img src={acc.qr_url} alt="Payment QR" className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-slate-200 flex flex-col items-center gap-2">
                            <CreditCard className="w-12 h-12" />
                            <p className="text-[10px] font-bold uppercase">QR Not Available</p>
                          </div>
                        )}
                      </div>
                      <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Scan with DuitNow / Bank App</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : schedules.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {schedules.map((schedule) => (
                <div key={schedule.id} className={cn(
                  "bg-white rounded-3xl border shadow-sm overflow-hidden transition-all",
                  schedule.status === 'paid' ? "border-emerald-100" : "border-slate-100"
                )}>
                  <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-6 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-slate-900">Installment #{schedule.installment_number}</h3>
                            {schedule.status === 'paid' && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase">Settled</span>}
                          </div>
                          <p className="text-sm text-slate-500">Due Date: {schedule.due_date ? new Date(schedule.due_date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-blue-600">RM {schedule.amount}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Status</p>
                        {schedule.payments && schedule.payments.length > 0 ? (
                          <div className="space-y-3">
                            {schedule.payments.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    payment.status === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                                    payment.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                    'bg-amber-100 text-amber-600'
                                  }`}>
                                    {payment.status === 'verified' ? <CheckCircle2 className="w-5 h-5" /> : 
                                     payment.status === 'rejected' ? <AlertCircle className="w-5 h-5" /> : 
                                     <Clock className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 capitalize">{payment.status.replace('_', ' ')}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                {payment.admin_remarks && (
                                  <div className="hidden md:block text-xs text-slate-600 italic max-w-[200px] truncate">
                                    "{payment.admin_remarks}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-sm text-slate-500 italic">No slips uploaded for this installment yet.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-72">
                      {schedule.status !== 'paid' ? (
                        <label className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all h-full min-h-[160px] ${
                          uploading === schedule.id ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-200 hover:bg-blue-50/50 hover:border-blue-400'
                        }`}>
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf"
                            disabled={uploading === schedule.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(schedule.id, file);
                            }}
                          />
                          {uploading === schedule.id ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                              <span className="text-sm font-bold text-slate-500">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <Upload className="w-6 h-6" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-slate-700">Upload Slip</p>
                                <p className="text-[10px] text-slate-500 uppercase mt-1">JPG, PNG, PDF</p>
                              </div>
                            </>
                          )}
                        </label>
                      ) : (
                        <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center h-full gap-3">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-emerald-700">This payment is confirmed.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <p className="text-slate-500">No payment records found.</p>
            </div>
          )}
          
          <div className="p-8 bg-slate-900 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <MessageSquare className="w-32 h-32 rotate-12" />
            </div>
            <div className="space-y-2 text-center md:text-left relative">
              <h3 className="text-xl font-bold">Payment Questions?</h3>
              <p className="text-slate-400 text-sm">Reach out if you need clarification on installments.</p>
            </div>
            <a 
              href={`https://wa.me/60123456789`} 
              target="_blank"
              className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 relative shadow-lg"
            >
              <MessageSquare className="w-5 h-5 text-green-500" />
              WhatsApp Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
