import { useEffect, useState } from 'react';
import { supabase, type ClassSlot } from '../lib/supabase';
import { 
  Users, Search, Filter, Loader2, Download, RefreshCw, 
  Mail, Phone, Calendar, User, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AdminSlotUsers() {
  const [slots, setSlots] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSlots();
  }, []);

  useEffect(() => {
    if (selectedSlotIds.length > 0) {
      fetchRegistrations();
    } else {
      setRegistrations([]);
    }
  }, [selectedSlotIds]);

  async function fetchSlots() {
    try {
      const { data, error } = await supabase
        .from('class_slots')
        .select('*, courses(name), age_groups(name)')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });
      
      if (error) throw error;
      setSlots(data || []);
      
      // Auto-select first slot if none selected
      if (data && data.length > 0) {
        setSelectedSlotIds([data[0].id]);
      }
    } catch (err: any) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRegistrations() {
    setRegsLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, profiles:parent_id(*), class_slots(*, courses(name))')
        .in('slot_id', selectedSlotIds)
        .order('student_name', { ascending: true });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err: any) {
      console.error('Error fetching registrations:', err);
    } finally {
      setRegsLoading(false);
    }
  }

  const toggleSlot = (id: string) => {
    setSelectedSlotIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Student Name', 
      'DOB', 
      'Parent Name', 
      'Parent Email', 
      'Parent Phone', 
      'Slot', 
      'Course',
      'Status', 
      'Applied At'
    ];
    
    const rows = filtered.map(r => [
      r.student_name,
      r.student_dob,
      r.profiles?.full_name || 'N/A',
      r.profiles?.email || 'N/A',
      r.profiles?.phone || 'N/A',
      `${r.class_slots?.day_of_week} ${r.class_slots?.start_time.slice(0, 5)}`,
      r.class_slots?.courses?.name || 'N/A',
      r.status,
      new Date(r.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `User_List_Slots_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filtered = registrations.filter(r => 
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filter */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6 sticky top-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Filter className="w-3 h-3" />
                Slot Selection
              </h3>
              <p className="text-[10px] text-slate-400 font-medium italic">Select one or more slots to compile a list.</p>
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
              {slots.map((slot) => {
                const isSelected = selectedSlotIds.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl transition-all border group relative overflow-hidden",
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-white border-slate-100 text-slate-600 hover:border-blue-100 hover:bg-blue-50/50"
                    )}
                  >
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <p className="font-bold text-sm leading-tight">{slot.day_of_week}</p>
                        <p className={cn(
                          "text-[10px] font-medium truncate mt-0.5",
                          isSelected ? "text-blue-100" : "text-slate-400"
                        )}>
                          {slot.courses?.name}
                        </p>
                      </div>
                      <div className={cn(
                        "p-1 rounded-md transition-colors",
                        isSelected ? "bg-white/20" : "bg-slate-50"
                      )}>
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 relative z-10">
                       <span className={cn(
                         "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                         isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                       )}>
                         {slot.start_time.slice(0, 5)}
                       </span>
                       <span className={cn(
                         "text-[9px] font-bold uppercase",
                         isSelected ? "text-blue-100" : "text-slate-400"
                       )}>
                         {slot.age_groups?.name}
                       </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setSelectedSlotIds([])}
              className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-200">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Users by Slot</h2>
                <p className="text-sm text-slate-500 font-medium">
                  {selectedSlotIds.length} Slot(s) selected • {filtered.length} Users found
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={exportToCSV}
                disabled={filtered.length === 0}
                className="flex-1 md:flex-initial flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
              <button 
                onClick={fetchRegistrations}
                className="p-4 bg-white border border-slate-200 rounded-[20px] text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
              >
                <RefreshCw className={cn("w-5 h-5", regsLoading && "animate-spin")} />
              </button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter student or parent in selected slots..." 
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-lg"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {regsLoading ? (
            <div className="flex justify-center py-40"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((reg) => (
                <div key={reg.id} className="bg-white p-6 rounded-[28px] border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600 font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        {reg.student_name[0]}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">{reg.student_name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                            reg.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {reg.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2 font-medium">
                          <User className="w-4 h-4 text-slate-300" />
                          Parent: {reg.profiles?.full_name}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                            {reg.class_slots?.day_of_week} {reg.class_slots?.start_time.slice(0, 5)}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">
                            {reg.class_slots?.courses?.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contact Details</p>
                        <div className="space-y-1">
                          <a href={`mailto:${reg.profiles?.email}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 font-bold group/link">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover/link:bg-blue-100 transition-colors">
                              <Mail className="w-4 h-4" />
                            </div>
                            {reg.profiles?.email}
                          </a>
                          <a href={`tel:${reg.profiles?.phone}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 font-bold group/link">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover/link:bg-blue-100 transition-colors">
                              <Phone className="w-4 h-4" />
                            </div>
                            {reg.profiles?.phone}
                          </a>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Other Info</p>
                        <div className="flex flex-col gap-2 font-bold text-slate-600">
                          <div className="flex items-center gap-2 text-xs">
                             <Calendar className="w-4 h-4 text-slate-300" />
                             DOB: {format(new Date(reg.student_dob), 'dd MMM yyyy')}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                             <RefreshCw className="w-4 h-4 text-slate-300" />
                             Registered: {format(new Date(reg.created_at), 'dd MMM yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                       <button className="p-4 bg-slate-50 text-slate-400 rounded-[20px] hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:translate-x-1 duration-300">
                         <ChevronRight className="w-6 h-6" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center space-y-6 bg-white rounded-[48px] border border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Users className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Users Found</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2 font-medium">Select some slots from the left to generate your user list.</p>
              </div>
              <button 
                onClick={() => setSelectedSlotIds(slots.map(s => s.id))}
                className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
              >
                Select All Slots
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
