import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Flame, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SeatUrgencyTicker() {
  const [lowSlots, setLowSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLowSeats() {
      try {
        const { data, error } = await supabase
          .from('class_slots')
          .select('*, courses(name)')
          .eq('is_active', true)
          .lte('seats_left', 3)
          .gt('seats_left', 0)
          .order('seats_left', { ascending: true });

        if (!error && data) {
          setLowSlots(data);
        }
      } catch (err) {
        console.error('Error fetching low seats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLowSeats();
  }, []);

  if (loading || lowSlots.length === 0) return null;

  return (
    <div className="bg-rose-600 text-white py-2 overflow-hidden relative border-y border-rose-500 shadow-lg shadow-rose-200/20">
      <div className="flex animate-marquee whitespace-nowrap items-center">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-12 px-6">
            {lowSlots.map((slot) => (
              <div key={`${i}-${slot.id}`} className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                  ONLY <span className="text-amber-300 underline decoration-2">{slot.seats_left} SEATS</span> LEFT: {slot.day_of_week} @ {slot.start_time.slice(0, 5)} ({slot.courses?.name})
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              </div>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
