import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  TrendingUp, DollarSign, Calendar, Filter, 
  ArrowUpRight, ArrowDownRight, Loader2, RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RevenueStat {
  month: string;
  expected: number;
  actual: number;
}

export default function AdminRevenue() {
  const [stats, setStats] = useState<RevenueStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalActual: 0,
    collectionRate: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      // Fetch both schedules and verified payments separately
      const [schedulesRes, paymentsRes] = await Promise.all([
        supabase.from('payment_schedules').select('amount, due_date'),
        supabase.from('payments').select('amount, created_at').eq('status', 'verified')
      ]);

      if (schedulesRes.error) throw schedulesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      // Group and aggregate by month
      const monthlyData: { [key: string]: RevenueStat } = {};

      schedulesRes.data?.forEach(s => {
        if (!s.due_date) return;
        const monthKey = format(parseISO(s.due_date), 'yyyy-MM-01');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, expected: 0, actual: 0 };
        }
        monthlyData[monthKey].expected += Number(s.amount);
      });

      paymentsRes.data?.forEach(p => {
        const monthKey = format(parseISO(p.created_at), 'yyyy-MM-01');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, expected: 0, actual: 0 };
        }
        monthlyData[monthKey].actual += Number(p.amount);
      });

      // Convert to array and format labels
      const sortedStats = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(item => ({
          ...item,
          monthLabel: format(parseISO(item.month), 'MMM yyyy')
        }));

      setStats(sortedStats as any);

      const totalExpected = sortedStats.reduce((sum, item) => sum + item.expected, 0);
      const totalActual = sortedStats.reduce((sum, item) => sum + item.actual, 0);
      
      setSummary({
        totalExpected,
        totalActual,
        collectionRate: totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0
      });
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue Forecasting</h1>
          <p className="text-slate-500">Track expected collections vs actual payments received</p>
        </div>
        <button 
          onClick={fetchStats}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Expected</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">RM {summary.totalExpected.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Received</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">RM {summary.totalActual.toLocaleString()}</span>
            <span className="text-sm font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-4 h-4" />
              {Math.round(summary.collectionRate)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Outstanding</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">RM {(summary.totalExpected - summary.totalActual).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-8">Monthly Collection Performance</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="monthLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `RM ${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
              />
              <Legend verticalAlign="top" align="right" height={36}/>
              <Bar 
                name="Expected" 
                dataKey="expected" 
                fill="#e2e8f0" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
              <Bar 
                name="Actual Received" 
                dataKey="actual" 
                fill="#4f46e5" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collection Efficiency Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Month</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expected</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actual</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gap</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((stat: any, idx) => {
                const gap = stat.expected - stat.actual;
                const efficiency = stat.expected > 0 ? (stat.actual / stat.expected) * 100 : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-900">{stat.monthLabel}</td>
                    <td className="px-8 py-4 text-slate-600">RM {stat.expected.toLocaleString()}</td>
                    <td className="px-8 py-4 text-slate-600">RM {stat.actual.toLocaleString()}</td>
                    <td className={`px-8 py-4 font-medium ${gap > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      RM {gap.toLocaleString()}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${efficiency >= 90 ? 'bg-emerald-500' : efficiency >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, efficiency)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{Math.round(efficiency)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
