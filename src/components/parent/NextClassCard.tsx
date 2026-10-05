import { type Registration } from '../../lib/supabase';
import { Calendar, MapPin, ExternalLink, Download, Clock } from 'lucide-react';
import { format, addWeeks, parseISO, startOfDay, isAfter } from 'date-fns';

type Props = {
  registrations: Registration[];
};

export default function NextClassCard({ registrations }: Props) {
  // Find the next upcoming class across all children
  // For simplicity, we look at the start_date of the slot and current date
  const now = new Date();
  
  const upcomingClasses = registrations
    .filter(r => r.status === 'approved' && r.class_slots)
    .map(r => {
      const slot = r.class_slots!;
      const startDate = parseISO(slot.start_date);
      // Logic to find the next occurrence based on day_of_week
      // Here we just find the first occurrence after today for demo
      let nextDate = startDate;
      while (isAfter(now, nextDate)) {
        nextDate = addWeeks(nextDate, 1);
      }
      return {
        student_name: r.student_name,
        date: nextDate,
        slot
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const next = upcomingClasses[0];

  if (!next) return null;

  const downloadICS = () => {
    const startTime = format(next.date, "yyyyMMdd'T'") + next.slot.start_time.replace(/:/g, '') + '00';
    const endTime = format(next.date, "yyyyMMdd'T'") + next.slot.end_time.replace(/:/g, '') + '00';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:Coding Class: ${next.student_name}`,
      `DESCRIPTION:VM Vibe Academy - ${next.slot.courses?.name}`,
      `LOCATION:${next.slot.venue}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `class_${next.student_name}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Calendar className="w-32 h-32 rotate-12" />
      </div>

      <div className="relative space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Class</span>
        </div>

        <div className="space-y-1">
          <h3 className="text-3xl font-black">{next.student_name}</h3>
          <p className="text-blue-400 font-bold">{next.slot.courses?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
              <p className="font-bold">{format(next.date, 'EEEE, dd MMM')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Time</p>
              <p className="font-bold">{next.slot.start_time.slice(0, 5)} - {next.slot.end_time.slice(0, 5)}</p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-wrap gap-3">
          <a 
            href={`https://maps.google.com/?q=${encodeURIComponent(next.slot.venue)}`}
            target="_blank"
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-colors"
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            Open Maps
          </a>
          <button 
            onClick={downloadICS}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-colors border border-white/10"
          >
            <Download className="w-4 h-4" />
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
