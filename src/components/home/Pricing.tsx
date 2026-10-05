import { useEffect, useState } from 'react';
import { supabase, type PaymentPlan, type ClassSlot } from '../../lib/supabase';
import { Calendar, Clock, MapPin, Users, Loader2 } from 'lucide-react';
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
            seats_left: avail?.seats_left ?? slot.capacity
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
    <section className="py-24 bg-slate-50" id="schedule">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Fees and Schedule</h2>
          <p className="text-lg text-slate-600">Invest in your child's creative future. Choose the slot that fits your weekend.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-6">
            {plans.map((plan) => {
              const basePlan = plans.find(p => p.installment_count === 1 && p.children_count === 1);
              const standardTotal = (basePlan?.amount || 250) * plan.children_count;
              const savings = standardTotal - plan.amount;
              const isBestValue = plan.installment_count === 1 && plan.children_count === 1;

              return (
                <div key={plan.id} className={cn(
                  "p-8 bg-white rounded-3xl border-2 relative overflow-hidden transition-all hover:scale-[1.02]",
                  isBestValue ? "border-blue-600 shadow-xl shadow-blue-100" : "border-slate-100 shadow-sm"
                )}>
                  {isBestValue && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-[10px] font-black rounded-bl-xl uppercase tracking-widest">
                      Best Value
                    </div>
                  )}
                  {plan.installment_count > 1 && (
                    <div className="absolute top-0 right-0 bg-slate-900 text-white px-4 py-1 text-[10px] font-black rounded-bl-xl uppercase tracking-widest">
                      Installments
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mb-6">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-bold text-slate-900">RM{plan.amount}</span>
                    <span className="text-slate-500 text-sm font-medium">/ {plan.children_count > 1 ? `${plan.children_count} children` : 'student'}</span>
                  </div>
                  
                  {savings > 0 && (
                    <div className="mb-6 p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Save RM{savings} compared to base rate
                    </div>
                  )}

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-slate-600 text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold">✓</div>
                      {plan.courses?.num_classes || 8} Interactive Classes
                    </li>
                    <li className="flex items-center gap-3 text-slate-600 text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold">✓</div>
                      {plan.courses?.class_duration_minutes || 90} mins per session
                    </li>
                    <li className="flex items-center gap-3 text-slate-600 text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold">✓</div>
                      Certificate of Completion
                    </li>
                  </ul>
                  <a
                    href="/register"
                    className={cn(
                      "block w-full py-4 rounded-xl text-center font-bold transition-all",
                      isBestValue ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                  >
                    {regStatus === 'waitlist' ? 'Join Waitlist' : 'Register Now'}
                  </a>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {slots.map((slot) => (
              <div key={slot.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider mb-2">
                      {slot.age_groups?.name} (Ages {slot.age_groups?.min_age}-{slot.age_groups?.max_age})
                    </span>
                    <h4 className="text-xl font-bold text-slate-900">{slot.day_of_week}s</h4>
                  </div>
                  {slot.seats_left <= 3 && slot.seats_left > 0 && (
                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      Few seats left
                    </span>
                  )}
                  {slot.seats_left <= 0 && (
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
                      Full (Waitlist)
                    </span>
                  )}
                </div>

                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{slot.seats_left} seats remaining of {slot.capacity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{slot.venue}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${((slot.capacity - slot.seats_left) / slot.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {regStatus === 'closed' && (
            <div className="lg:col-span-3 p-8 bg-rose-50 border-2 border-dashed border-rose-200 rounded-[32px] text-center">
              <p className="text-rose-700 font-bold">Registration for the current intake is closed. Follow us on social media for updates on the next session!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
