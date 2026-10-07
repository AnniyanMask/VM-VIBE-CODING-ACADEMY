import { useEffect, useState } from 'react';
import { supabase, type Registration, type ClassSlot } from '../lib/supabase';
import { 
  Users, Check, X, MessageSquare, Search, Filter, 
  Loader2, Calendar, BookOpen, Download, MoreHorizontal,
  Mail, Phone, ExternalLink, RefreshCw, Clock, Info, Shield, Camera, ArrowUpCircle, CreditCard, AlertCircle, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [templates, setTemplates] = useState<any>(null);
  const [studentUsers, setStudentUsers] = useState<any[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billedMap, setBilledMap] = useState<Record<string, boolean>>({});

  // Check which registrations have billing
  useEffect(() => {
    async function checkBilling() {
      if (registrations.length === 0) return;
      const groupIds = Array.from(new Set(registrations.map(r => r.group_id).filter(Boolean)));
      if (groupIds.length === 0) return;

      const { data } = await supabase
        .from('payment_schedules')
        .select('group_id')
        .in('group_id', groupIds);
      
      const map: Record<string, boolean> = {};
      data?.forEach(s => {
        if (s.group_id) map[s.group_id] = true;
      });
      setBilledMap(map);
    }
    checkBilling();
  }, [registrations]);
  const [discountingReg, setDiscountingReg] = useState<Registration | null>(null);
  const [billingReg, setBillingReg] = useState<Registration | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [linkingRegId, setLinkingRegId] = useState<string | null>(null);
  const [targetStudentId, setTargetStudentId] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchStudentUsers();
  }, []);

  async function fetchStudentUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .neq('role', 'admin')
      .order('full_name', { ascending: true });
    if (data) setStudentUsers(data);
  }

  async function fetchData() {
    setLoading(true);
    try {
      const [regsRes, slotsRes, settingsRes] = await Promise.all([
        supabase
          .from('registrations')
          .select('*, profiles!parent_id(*), class_slots(*, courses(*), age_groups(*)), payment_plans:payment_plan_id(*), student_profile:profiles!student_user_id(*)')
          .order('created_at', { ascending: false }),
        supabase.from('class_slots').select('*, courses(*), age_groups(*)'),
        supabase.from('site_settings').select('value').eq('key', 'message_templates').maybeSingle()
      ]);

      if (regsRes.error) throw regsRes.error;
      if (slotsRes.error) throw slotsRes.error;

      if (regsRes.data) setRegistrations(regsRes.data as any);
      if (slotsRes.data) setSlots(slotsRes.data as any);
      if (settingsRes.data) setTemplates(settingsRes.data.value);
    } catch (err: any) {
      console.error('Error fetching admin registrations:', err);
      alert(`Error fetching registrations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function getWhatsAppLink(reg: Registration) {
    if (!reg.profiles?.phone || !templates) return `https://wa.me/${reg.profiles?.phone?.replace(/[^0-9]/g, '')}`;
    
    let template = templates.whatsapp_welcome;
    if (reg.status === 'approved') template = templates.whatsapp_approved;
    if (reg.status === 'waitlist') template = templates.whatsapp_waitlist;

    const message = template
      .replace('{{parent_name}}', reg.profiles.full_name || 'Parent')
      .replace('{{student_name}}', reg.student_name)
      .replace('{{slot_name}}', `${reg.class_slots?.day_of_week} ${reg.class_slots?.start_time.slice(0, 5)}`);

    return `https://wa.me/${reg.profiles.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  }

  async function updateStatus(id: string, status: Registration['status']) {
    try {
      const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
      if (error) throw error;
      
      setRegistrations(registrations.map(r => r.id === id ? { ...r, status } : r));
      if (selectedReg?.id === id) setSelectedReg({ ...selectedReg, status });

      // If approved, check for missing billing
      if (status === 'approved') {
        const reg = registrations.find(r => r.id === id);
        if (reg) {
          const { data: schedules } = await supabase
            .from('payment_schedules')
            .select('id')
            .eq('parent_id', reg.parent_id)
            .eq('group_id', reg.group_id)
            .limit(1);

          if (!schedules || schedules.length === 0) {
            setBillingReg(reg);
            setIsBillingModalOpen(true);
          }
        }
      }
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  }

  async function handleGenerateBilling(e: React.FormEvent) {
    e.preventDefault();
    if (!billingReg || !billingReg.payment_plan_id) return;
    
    setLinkLoading(true);
    try {
      // 1. Get Plan Details
      const { data: plan } = await supabase
        .from('payment_plans')
        .select('*')
        .eq('id', billingReg.payment_plan_id)
        .single();

      if (!plan) throw new Error('Payment plan not found');

      // 2. Count siblings in this group to apply multiplier
      const { count: siblingCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', billingReg.parent_id)
        .eq('group_id', billingReg.group_id);

      const multiplier = (plan.children_count === 1) ? (siblingCount || 1) : 1;
      const totalAmount = (plan.fee * multiplier) - (billingReg.discount_amount || 0);

      // 3. Create Schedules
      const customAmounts = plan.installment_breakdown 
        ? plan.installment_breakdown.split(',').map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n))
        : [];

      const scheduleEntries = [];
      for (let i = 0; i < plan.installment_count; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        
        let amount = totalAmount / plan.installment_count;
        if (customAmounts.length > i) {
          amount = customAmounts[i];
        }

        scheduleEntries.push({
          parent_id: billingReg.parent_id,
          group_id: billingReg.group_id,
          registration_id: billingReg.id,
          amount: amount,
          due_date: dueDate.toISOString().split('T')[0],
          installment_number: i + 1,
          status: 'pending'
        });
      }

      const { error: billingError } = await supabase.from('payment_schedules').insert(scheduleEntries);
      if (billingError) throw billingError;

      setIsBillingModalOpen(false);
      setBillingReg(null);
      alert('Payment schedule generated successfully!');
      fetchData();
    } catch (err: any) {
      alert(`Error generating billing: ${err.message}`);
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleLinkAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!linkingRegId || !targetStudentId) return;
    
    setLinkLoading(true);
    try {
      // 1. Link to registration
      const { error: linkError } = await supabase
        .from('registrations')
        .update({ student_user_id: targetStudentId })
        .eq('id', linkingRegId);
      
      if (linkError) throw linkError;

      // 2. Ensure user has student role
      await supabase
        .from('profiles')
        .update({ role: 'student' })
        .eq('id', targetStudentId);
      
      setIsLinkModalOpen(false);
      setLinkingRegId(null);
      setTargetStudentId('');
      fetchData();
    } catch (err: any) {
      alert(`Error linking account: ${err.message}`);
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleUpdateDiscount(e: React.FormEvent) {
    e.preventDefault();
    if (!discountingReg) return;
    
    setLinkLoading(true);
    try {
      // 1. Update registration discount
      const { error: regError } = await supabase
        .from('registrations')
        .update({ discount_amount: discountValue })
        .eq('id', discountingReg.id);
      
      if (regError) throw regError;

      // 2. Adjust payment schedules
      // Find all pending schedules for this parent/group
      const { data: schedules } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('parent_id', discountingReg.parent_id)
        .eq('group_id', discountingReg.group_id)
        .eq('status', 'pending');

      if (schedules && schedules.length > 0) {
        // Calculate total original amount of the plan (simplified)
        // We subtract the new discount from the remaining installments
        const oldDiscount = discountingReg.discount_amount || 0;
        const discountDiff = discountValue - oldDiscount;
        const adjustmentPerInstallment = discountDiff / schedules.length;

        for (const schedule of schedules) {
          await supabase
            .from('payment_schedules')
            .update({ amount: Math.max(0, schedule.amount - adjustmentPerInstallment) })
            .eq('id', schedule.id);
        }
      }
      
      setIsDiscountModalOpen(false);
      setDiscountingReg(null);
      fetchData();
    } catch (err: any) {
      alert(`Error updating discount: ${err.message}`);
    } finally {
      setLinkLoading(false);
    }
  }

  const exportToCSV = () => {
    const headers = ['Student Name', 'DOB', 'Parent Name', 'Email', 'Phone', 'Slot', 'Status', 'Lead Source', 'Media Consent', 'Applied At'];
    const rows = filtered.map(r => [
      r.student_name,
      r.student_dob,
      r.profiles?.full_name,
      r.profiles?.email,
      r.profiles?.phone,
      `${r.class_slots?.day_of_week} ${r.class_slots?.start_time}`,
      r.status,
      (r as any).lead_source || 'Unknown',
      r.media_consent ? 'Yes' : 'No',
      new Date(r.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filtered = registrations.filter(r => {
    const matchesSearch = 
      r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by student, parent or email..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
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
              <option value="waitlist">Waitlist</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={fetchData}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((reg) => (
            <div key={reg.id} className={cn(
              "bg-white p-5 rounded-2xl border transition-all group",
              selectedReg?.id === reg.id ? "border-blue-500 ring-4 ring-blue-50" : "border-slate-100 hover:border-slate-200"
            )}>
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                    {reg.student_name[0]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{reg.student_name}</h3>
                      {reg.group_id && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded tracking-widest">Sibling Group</span>}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(reg.student_dob), 'dd MMM yyyy')}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">
                        {reg.class_slots?.age_groups?.name}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded">
                        {reg.class_slots?.day_of_week}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source: {(reg as any).lead_source || 'Unknown'}</p>
                  <p className="font-bold text-slate-900">{reg.profiles?.full_name}</p>
                  <div className="flex flex-wrap gap-4 mt-1">
                    <a href={`mailto:${reg.profiles?.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                      <Mail className="w-3 h-3" /> {reg.profiles?.email}
                    </a>
                    <a href={`tel:${reg.profiles?.phone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                      <Phone className="w-3 h-3" /> {reg.profiles?.phone}
                    </a>
                  </div>
                </div>

                <div className="space-y-3 min-w-[140px]">
                   <div className="flex items-center gap-2">
                    <Shield className={cn("w-4 h-4", reg.terms_accepted_at ? "text-emerald-500" : "text-slate-300")} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">PDPA OK</span>
                   </div>
                   <div className="flex items-center gap-2">
                    <Camera className={cn("w-4 h-4", reg.media_consent ? "text-emerald-500" : "text-slate-300")} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Media OK</span>
                   </div>
                </div>

                  <div className="flex flex-col md:items-end justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {reg.group_id && billedMap[reg.group_id] ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded tracking-widest border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Billed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded tracking-widest border border-amber-100 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" /> Not Billed
                        </span>
                      )}
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest self-start md:self-auto",
                        reg.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                        reg.status === 'rejected' ? "bg-rose-100 text-rose-700" :
                        reg.status === 'waitlist' ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {reg.status}
                      </span>
                    </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setBillingReg(reg);
                        setIsBillingModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Manage Billing
                    </button>

                    <button 
                      onClick={() => {
                        setDiscountingReg(reg);
                        setDiscountValue(reg.discount_amount || 0);
                        setIsDiscountModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      Discount: RM {reg.discount_amount || 0}
                    </button>

                    <button 
                      onClick={() => {
                        setLinkingRegId(reg.id);
                        setTargetStudentId(reg.student_user_id || '');
                        setIsLinkModalOpen(true);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm border",
                        reg.student_user_id 
                          ? "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100" 
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <Users className="w-3.5 h-3.5" />
                      {(() => {
                        const profile = Array.isArray(reg.student_profile) ? reg.student_profile[0] : reg.student_profile;
                        return profile?.full_name ? `Linked: ${profile.full_name}` : "Link Student Account";
                      })()}
                    </button>

                    {reg.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateStatus(reg.id, 'approved')}
                          className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => updateStatus(reg.id, 'waitlist')}
                          className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors shadow-sm"
                          title="Waitlist"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => updateStatus(reg.id, 'rejected')}
                          className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    {reg.status === 'waitlist' && (
                      <button 
                        onClick={() => updateStatus(reg.id, 'approved')}
                        className="flex items-center gap-2 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        Promote to Approved
                      </button>
                    )}
                    <a 
                      href={getWhatsAppLink(reg)}
                      target="_blank"
                      className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                    >
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <span className="hidden md:inline text-xs font-bold uppercase">Chat</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Linkage Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Link Student Account</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Direct Student Access</p>
              </div>
              <button onClick={() => setIsLinkModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleLinkAccount} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    Select the student's personal login account. This allows them to see their own classes and progress independently of their parent.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Student User</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 text-sm appearance-none"
                    value={targetStudentId}
                    onChange={e => setTargetStudentId(e.target.value)}
                  >
                    <option value="">No account linked</option>
                    {studentUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button 
                  type="submit" 
                  disabled={linkLoading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {linkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Shield className="w-4 h-4" /> Save Linkage</>}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {isBillingModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Generate Billing</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Invoice Recovery</p>
              </div>
              <button onClick={() => setIsBillingModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleGenerateBilling} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                    This will generate a new payment schedule for <strong>{billingReg?.student_name}</strong> based on their selected plan: <strong>{billingReg?.payment_plans?.name || 'Default Plan'}</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Discount</label>
                  <p className="font-bold text-slate-900 ml-1">RM {billingReg?.discount_amount || 0}</p>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button 
                  type="submit" 
                  disabled={linkLoading}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {linkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Generate Schedule</>}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsBillingModalOpen(false)}
                  className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Apply Discount</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Fee Reduction</p>
              </div>
              <button onClick={() => setIsDiscountModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleUpdateDiscount} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Enter the total discount amount in RM for <strong>{discountingReg?.student_name}</strong>. This will be automatically subtracted from any pending payment installments.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Discount Amount (RM)</label>
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
                  disabled={linkLoading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {linkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Apply & Recalculate</>}
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
