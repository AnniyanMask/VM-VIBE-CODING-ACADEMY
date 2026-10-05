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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [regs, payments, siblings, slots, avail, enquiries, requests] = await Promise.all([
          supabase.from('registrations').select('status', { count: 'exact' }),
          supabase.from('payments').select('status', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('sibling_requests').select('status', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('class_slots').select('*'),
          supabase.from('slot_availability').select('*'),
          supabase.from('enquiries').select('status', { count: 'exact' }).eq('status', 'new'),
          supabase.from('parent_requests').select('status', { count: 'exact' }).eq('status', 'pending')
        ]);

        const errors = [regs, payments, siblings, slots, avail, enquiries, requests].filter(r => r.error);
        if (errors.length > 0) throw errors[0].error;

        setStats({
          totalRegs: regs.count || 0,
          pendingPayments: payments.count || 0,
          pendingSiblings: siblings.count || 0,
          newEnquiries: enquiries.count || 0,
          pendingRequests: requests.count || 0,
          slots: slots.data?.map(s => {
            const a = avail.data?.find((av: any) => av.slot_id === s.id);
            return {
              ...s,
              seatsLeft: a?.seats_left ?? s.capacity
            };
          }) || []
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Dashboard Error</h3>
          <p className="text-slate-500 max-w-md mx-auto mt-1">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const cards = [
    { label: 'Total Registrations', value: stats.totalRegs, icon: ListChecks, color: 'blue' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: CreditCard, color: 'amber' },
    { label: 'Sibling Requests', value: stats.pendingSiblings, icon: Users, color: 'purple' },
    { label: 'New Enquiries', value: stats.newEnquiries, icon: HelpCircle, color: 'emerald' },
    { label: 'Parent Requests', value: stats.pendingRequests, icon: MessageSquare, color: 'indigo' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className={`w-9 h-9 rounded-xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600`}>
              <card.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
          <Clock className="w-4 h-4 text-blue-600" />
          Live Slot Availability
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.slots?.map((slot: any) => (
            <div key={slot.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-900">{slot.day_of_week}s @ {slot.start_time.slice(0, 5)}</p>
                <p className="text-[10px] text-slate-500 font-medium">{slot.venue}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${slot.seatsLeft <= 2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {slot.seatsLeft}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Seats Left</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-900 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-xl font-bold">New Registrations</h3>
          <p className="text-slate-400 text-sm">Review your latest applications to confirm spots.</p>
        </div>
        <a 
          href="/admin/registrations" 
          className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 text-sm"
        >
          Review Now
          <TrendingUp className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
