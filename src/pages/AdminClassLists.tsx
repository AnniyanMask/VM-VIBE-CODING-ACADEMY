import { useEffect, useState } from 'react';
import { supabase, type Registration, type ClassSlot } from '../lib/supabase';
import { 
  Users, Search, Filter, Loader2, Calendar, Download, RefreshCw, 
  Mail, Phone, Clock, MapPin, ChevronRight, User
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';

export default function AdminClassLists() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSlotId = searchParams.get('slotId') || '';

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSlots();
  }, []);

  useEffect(() => {
    if (selectedSlotId) {
      fetchRegistrations(selectedSlotId);
    } else {
      setRegistrations([]);
    }
  }, [selectedSlotId]);

  async function fetchSlots() {
    try {
      const { data, error } = await supabase
        .from('class_slots')
        .select('*, courses(name), age_groups(name)')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });
      
      if (error) throw error;
      setSlots(data || []);
      
      // If no slot selected but slots exist, pick first one if not coming from URL
      if (!selectedSlotId && data && data.length > 0) {
        setSelectedSlotId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRegistrations(slotId: string) {
    setRegsLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, profiles:parent_id(*)')
        .eq('slot_id', slotId)
        .in('status', ['pending', 'approved'])
        .order('student_name', { ascending: true });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err: any) {
      console.error('Error fetching registrations:', err);
    } finally {
      setRegsLoading(false);
    }
  }

  const exportToCSV = () => {
    const slot = slots.find(s => s.id === selectedSlotId);
    const slotName = slot ? `${slot.day_of_week}_${slot.start_time.slice(0, 5)}` : 'Class_List';
    
    const headers = ['Student Name', 'DOB', 'Parent Name', 'Email', 'Phone', 'Status', 'Applied At'];
    const rows = filtered.map(r => [
      r.student_name,
      r.student_dob,
      r.profiles?.full_name || 'N/A',
      r.profiles?.email || 'N/A',
      r.profiles?.phone || 'N/A',
      r.status,
      new Date(r.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `classlist_${slotName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filtered = registrations.filter(r => 
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSlot = slots.find(s => s.id === selectedSlotId);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filter */}
        <div className="w-full lg:w-80 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Select Class Slot
            </h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => {
                    setSelectedSlotId(slot.id);
                    setSearchParams({ slotId: slot.id });
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all border group",
                    selectedSlotId === slot.id 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "bg-white border-slate-50 text-slate-600 hover:border-blue-100 hover:bg-blue-50/50"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm">{slot.day_of_week}</p>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                      selectedSlotId === slot.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {slot.start_time.slice(0, 5)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[10px] font-medium truncate",
                    selectedSlotId === slot.id ? "text-blue-100" : "text-slate-400"
                  )}>
                    {slot.courses?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                     <Users className={cn("w-3 h-3", selectedSlotId === slot.id ? "text-white" : "text-slate-300")} />
                     <span className="text-[10px] font-bold uppercase tracking-tight">
                       {slot.total_seats - slot.seats_left} Students
                     </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {selectedSlot ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {selectedSlot.day_of_week}s @ {selectedSlot.start_time.slice(0, 5)}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedSlot.courses?.name} • {selectedSlot.age_groups?.name} Group
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={exportToCSV}
                    disabled={filtered.length === 0}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                  <button 
                    onClick={() => fetchRegistrations(selectedSlotId)}
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    <RefreshCw className={cn("w-5 h-5", regsLoading && "animate-spin")} />
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter student or parent in this slot..." 
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {regsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((reg) => (
                    <div key={reg.id} className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all group shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">
                            {reg.student_name[0]}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">{reg.student_name}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-2">
                              <User className="w-3 h-3 text-slate-300" />
                              Parent: {reg.profiles?.full_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Info</p>
                            <div className="space-y-0.5">
                              <a href={`mailto:${reg.profiles?.email}`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                                <Mail className="w-3 h-3" /> {reg.profiles?.email}
                              </a>
                              <a href={`tel:${reg.profiles?.phone}`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1.5 font-medium">
                                <Phone className="w-3 h-3" /> {reg.profiles?.phone}
                              </a>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status & DOB</p>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                reg.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                              )}>
                                {reg.status}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                {format(new Date(reg.student_dob), 'dd MMM yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <a 
                            href={`https://wa.me/${reg.profiles?.phone?.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-green-600 hover:bg-green-50 transition-all"
                          >
                            <Phone className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                      <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 italic font-medium">No students found for this search/slot.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Select a Class Slot</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">Pick a slot from the sidebar to view the list of enrolled students.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
