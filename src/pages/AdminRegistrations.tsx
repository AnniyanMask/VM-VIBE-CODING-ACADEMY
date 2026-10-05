import { useEffect, useState } from 'react';
import { supabase, type Registration, type ClassSlot } from '../lib/supabase';
import { 
  Users, Check, X, MessageSquare, Search, Filter, 
  Loader2, Calendar, BookOpen, Download, MoreHorizontal,
  Mail, Phone, ExternalLink, RefreshCw, Clock, Info, Shield, Camera, ArrowUpCircle
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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [regsRes, slotsRes, settingsRes] = await Promise.all([
      supabase.from('registrations').select('*, profiles(*), class_slots(*, courses(*), age_groups(*)), payment_plans(*)').order('created_at', { ascending: false }),
      supabase.from('class_slots').select('*, courses(*), age_groups(*)'),
      supabase.from('site_settings').select('value').eq('key', 'message_templates').single()
    ]);

    if (regsRes.data) setRegistrations(regsRes.data as any);
    if (slotsRes.data) setSlots(slotsRes.data as any);
    if (settingsRes.data) setTemplates(settingsRes.data.value);
    setLoading(false);
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
    const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
    if (!error) {
      setRegistrations(registrations.map(r => r.id === id ? { ...r, status } : r));
      if (selectedReg?.id === id) setSelectedReg({ ...selectedReg, status });
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
      r.lead_source || 'Unknown',
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
              "bg-white p-6 rounded-[32px] border transition-all group",
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source: {reg.lead_source || 'Unknown'}</p>
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
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest self-start md:self-auto",
                    reg.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                    reg.status === 'rejected' ? "bg-rose-100 text-rose-700" :
                    reg.status === 'waitlist' ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {reg.status}
                  </span>
                  
                  <div className="flex gap-2">
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
    </div>
  );
}
