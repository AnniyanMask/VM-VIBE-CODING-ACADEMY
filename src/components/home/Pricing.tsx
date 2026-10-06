import { useEffect, useState } from 'react';
import { supabase, type PaymentPlan, type ClassSlot } from '../../lib/supabase';
import { Calendar, Clock, MapPin, Users, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Pricing() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [regStatus, setRegStatus] = useState<'open' | 'closed' | 'waitlist'>('open');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [plansRes, slotsRes, availRes, controlRes] = await Promise.all([
        supabase.from('payment_plans').select('*, courses(*)').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('class_slots').select('*, age_groups(*)').eq('is_active', true),
        supabase.from('slot_availability').select('*'),
        supabase.from('site_settings').select('value').eq('key', 'registration_control').single()
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (slotsRes.data && availRes.data) {
        const processedSlots = slotsRes.data.map(slot => {
          const avail = availRes.data.find(a => a.slot_id === slot.id);
          return {
            ...slot,
            seats_left: avail?.seats_left ?? slot.total_seats
          };
        });
        setSlots(processedSlots);
      }
      if (controlRes.data) setRegStatus(controlRes.data.value.status || 'open');
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="py-24 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <section className="py-20 bg-slate-50" id="schedule">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Fees and Schedule</h2>
          <p className="text-lg text-slate-600">Choose a plan and available class slot that fits your schedule.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Payment Plans - Left Column (approx 35%) */}
          <div className="w-full lg:w-[35%] space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Payment Plans</h3>
            {plans.map((plan) => {
              const isBestValue = plan.installment_count === 1 && plan.children_count === 1;

              return (
                <div key={plan.id} className={cn(
                  "p-6 bg-white rounded-[32px] border-2 relative overflow-hidden transition-all flex flex-col h-full",
                  isBestValue ? "border-blue-600 shadow-xl shadow-blue-100/50" : "border-slate-100 shadow-sm"
                )}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{plan.name}</h3>
                    {isBestValue ? (
                      <span className="bg-blue-600 text-white px-3 py-1 text-[8px] font-black rounded-full uppercase tracking-widest">
                        Best Value
                      </span>
                    ) : plan.installment_count > 1 ? (
                      <span className="bg-slate-900 text-white px-3 py-1 text-[8px] font-black rounded-full uppercase tracking-widest">
                        Installments
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">RM{plan.fee}</span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ {plan.children_count > 1 ? `${plan.children_count} children` : 'child'}</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-slate-600 text-xs font-medium">
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 text-[10px]">✓</div>
                      {plan.courses?.num_classes || 8} Interactive Classes
                    </li>
                    <li className="flex items-center gap-3 text-slate-600 text-xs font-medium">
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 text-[10px]">✓</div>
                      {plan.courses?.class_duration_minutes || 90} mins per session
                    </li>
                    <li className="flex items-center gap-3 text-slate-600 text-xs font-medium">
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 text-[10px]">✓</div>
                      Certificate of Completion
                    </li>
                  </ul>

                  <a
                    href="/register"
                    className={cn(
                      "block w-full py-4 rounded-2xl text-center font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg",
                      isBestValue 
                        ? "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700" 
                        : "bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800"
                    )}
                  >
                    {regStatus === 'waitlist' ? 'Join Waitlist' : 'Register Now'}
                  </a>
                </div>
              );
            })}
          </div>

          {/* Schedule - Right Column (approx 65%) */}
          <div className="w-full lg:w-[65%] space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Available Class Slots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => {
                const isValidVenue = slot.venue && slot.venue.trim().length > 1;
                const hasAgeGroup = slot.age_groups?.name;

                return (
                  <div key={slot.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:border-blue-200 transition-all flex flex-col group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{slot.day_of_week}</h4>
                        {hasAgeGroup && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black rounded uppercase tracking-widest">
                              {slot.age_groups.name} • Ages {slot.age_groups.min_age}-{slot.age_groups.max_age}
                            </span>
                            {slot.class_type === 'online' ? (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse" />
                                Online Class
                              </span>
                            ) : (
                              slot.online_meeting_url && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase tracking-widest flex items-center gap-1">
                                  <span className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                                  Online Hybrid
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5" />
                          Starts {new Date(slot.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className={cn(
                          "text-[11px] md:text-xs font-black uppercase tracking-widest break-words whitespace-normal",
                          slot.seats_left <= 0 ? "text-rose-500" : "text-slate-900"
                        )}>
                          {slot.seats_left <= 0 ? "Full (Waitlist)" : `${slot.seats_left} of ${slot.total_seats} seats available`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>{slot.class_type === 'online' ? "Online Class" : (isValidVenue ? slot.venue : "Venue not set")}</span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        <RefreshCw className="w-3 h-3" />
                        Weekly Class
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Availability</span>
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                          {Math.max(0, Math.round((slot.seats_left / slot.total_seats) * 100))}% available
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            slot.seats_left <= 3 ? "bg-rose-500" : "bg-blue-600"
                          )}
                          style={{ width: `${Math.max(0, (slot.seats_left / slot.total_seats) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {regStatus === 'closed' && (
            <div className="w-full p-8 bg-rose-50 border-2 border-dashed border-rose-200 rounded-[32px] text-center">
              <p className="text-rose-700 font-bold">Registration for the current intake is closed. Follow us on social media for updates on the next session!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
