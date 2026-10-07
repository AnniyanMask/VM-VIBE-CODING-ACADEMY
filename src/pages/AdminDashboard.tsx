import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, CreditCard, Clock, ListChecks, 
  TrendingUp, AlertCircle, CheckCircle2, Loader2, MessageSquare, HelpCircle, BarChart3, DollarSign
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [regs, payments, siblings, slots, avail, enquiries, requests, schedules] = await Promise.all([
          supabase.from('registrations').select('status', { count: 'exact' }),
          supabase.from('payments').select('status', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('sibling_requests').select('status', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('class_slots').select('*'),
          supabase.from('slot_availability').select('*'),
          supabase.from('enquiries').select('status', { count: 'exact' }).eq('status', 'new'),
          supabase.from('parent_requests').select('status', { count: 'exact' }).eq('status', 'pending'),
          supabase.from('payment_schedules').select('amount, status, due_date')
        ]);

        const errors = [regs, payments, siblings, slots, avail, enquiries, requests, schedules].filter(r => r.error);
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

        // Process Revenue Data for last 6 months
        if (schedules.data) {
          const now = new Date();
          const months = eachMonthOfInterval({
            start: subMonths(now, 5),
            end: now
          });

          const monthlyStats = months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const start = startOfMonth(month);
            const end = endOfMonth(month);

            const monthScheds = schedules.data.filter(s => {
              const d = new Date(s.due_date);
              return d >= start && d <= end;
            });

            const expected = monthScheds.reduce((acc, s) => acc + Number(s.amount), 0);
            const actual = monthScheds.filter(s => s.status === 'paid').reduce((acc, s) => acc + Number(s.amount), 0);

            return { label: monthStr, expected, actual };
          });

          setRevenueData(monthlyStats);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  const maxRevenue = Math.max(...revenueData.map(d => d.expected), 1000);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              card.color === 'blue' ? "bg-blue-50 text-blue-600" :
              card.color === 'amber' ? "bg-amber-50 text-amber-600" :
              card.color === 'purple' ? "bg-purple-50 text-purple-600" :
              card.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
              "bg-indigo-50 text-indigo-600"
            )}>
              <card.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Forecast Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Revenue Forecasting</h2>
                <p className="text-xs text-slate-500 font-medium">Expected vs. Actual collection</p>
              </div>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-slate-100" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-600" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual</span>
               </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 md:gap-8 px-2 md:px-4">
            {revenueData.map((d, idx) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                <div className="relative w-full flex justify-center items-end gap-1 h-full max-h-[200px]">
                  {/* Expected Bar */}
                  <div 
                    className="w-full md:w-10 bg-slate-50 rounded-t-lg transition-all border border-slate-100"
                    style={{ height: `${(d.expected / maxRevenue) * 100}%` }}
                  />
                  {/* Actual Bar */}
                  <div 
                    className="absolute bottom-0 w-full md:w-10 bg-blue-600 rounded-t-lg transition-all shadow-lg shadow-blue-100 z-10"
                    style={{ height: `${(d.actual / maxRevenue) * 100}%` }}
                  />
                  
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                    <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs space-y-1 shadow-2xl min-w-[140px]">
                      <p className="font-bold border-b border-white/10 pb-1 mb-1">{d.label}</p>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Expected:</span>
                        <span className="font-black">RM {Math.round(d.expected)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Actual:</span>
                        <span className="text-emerald-400 font-black">RM {Math.round(d.actual)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <DollarSign className="w-32 h-32 rotate-12" />
            </div>
            <div className="relative z-10 space-y-6">
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Current Month</p>
                <h3 className="text-3xl font-black tracking-tighter">RM {Math.round(revenueData[revenueData.length-1]?.actual || 0)}</h3>
                <p className="text-xs text-slate-400 font-medium">Collected so far in {format(new Date(), 'MMMM')}</p>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400">Collection Rate</p>
                <p className="text-xl font-black text-emerald-400">
                  {revenueData[revenueData.length-1]?.expected > 0 
                    ? Math.round((revenueData[revenueData.length-1]?.actual / revenueData[revenueData.length-1]?.expected) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Quick Actions</h4>
            <div className="grid grid-cols-1 gap-2">
               <a href="/admin/payments" className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-all">
                    <CreditCard className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-bold text-slate-700">Verify Pending Slips</span>
               </a>
               <a href="/admin/registrations" className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-all">
                    <ListChecks className="w-5 h-5" />
                 </div>
                 <span className="text-xs font-bold text-slate-700">Review Applications</span>
               </a>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight px-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Live Slot Availability
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.slots?.map((slot: any) => (
            <div key={slot.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center hover:border-blue-100 transition-all">
              <div>
                <p className="text-sm font-bold text-slate-900">{slot.day_of_week}s @ {slot.start_time.slice(0, 5)}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{slot.venue}</p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-lg font-black",
                  slot.seatsLeft <= 1 ? 'text-rose-600' : 
                  slot.seatsLeft <= 3 ? 'text-amber-500' : 
                  'text-emerald-600'
                )}>
                  {slot.seatsLeft}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase">Seats</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
