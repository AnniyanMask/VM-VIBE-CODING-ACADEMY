import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, CreditCard, Clock, ListChecks, 
  TrendingUp, AlertCircle, CheckCircle2, Loader2, MessageSquare, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [regs, payments, siblings, slots, avail, enquiries, requests] = await Promise.all([
        supabase.from('registrations').select('status', { count: 'exact' }),
        supabase.from('payments').select('status', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('sibling_requests').select('status', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('class_slots').select('*'),
        supabase.from('slot_availability').select('*'),
        supabase.from('enquiries').select('status', { count: 'exact' }).eq('status', 'new'),
        supabase.from('parent_requests').select('status', { count: 'exact' }).eq('status', 'pending')
      ]);

      setStats({
        totalRegs: regs.count,
        pendingPayments: payments.count,
        pendingSiblings: siblings.count,
        newEnquiries: enquiries.count,
        pendingRequests: requests.count,
        slots: slots.data?.map(s => {
          const a = avail.data?.find((av: any) => av.slot_id === s.id);
          return {
            ...s,
            seatsLeft: a?.seats_left ?? s.capacity
          };
        })
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  const cards = [
    { label: 'Total Registrations', value: stats.totalRegs, icon: ListChecks, color: 'blue' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: CreditCard, color: 'amber' },
    { label: 'Sibling Requests', value: stats.pendingSiblings, icon: Users, color: 'purple' },
    { label: 'New Enquiries', value: stats.newEnquiries, icon: HelpCircle, color: 'emerald' },
    { label: 'Parent Requests', value: stats.pendingRequests, icon: MessageSquare, color: 'indigo' },
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div className={`w-10 h-10 rounded-2xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
          <Clock className="w-5 h-5 text-blue-600" />
          Live Slot Availability
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.slots?.map((slot: any) => (
            <div key={slot.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{slot.day_of_week}s @ {slot.start_time.slice(0, 5)}</p>
                <p className="text-xs text-slate-500">{slot.venue}</p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${slot.seatsLeft <= 2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {slot.seatsLeft}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Seats Left</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 bg-slate-900 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-bold">New Registrations this week</h3>
          <p className="text-slate-400">You have 4 new applications waiting for review.</p>
        </div>
        <a 
          href="/admin/registrations" 
          className="bg-blue-600 px-8 py-4 rounded-full font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          Review Now
          <TrendingUp className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
