import { useEffect, useState } from 'react';
import { supabase, type Notification, type Registration, type PaymentSchedule } from '../../lib/supabase';
import { AlertCircle, CreditCard, Clock, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function AlertStrip() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [notifRes, scheduleRes, regRes] = await Promise.all([
      supabase.from('notifications').select('*').eq('user_id', session.user.id).eq('is_read', false).limit(3),
      supabase.from('payment_schedules').select('*').eq('parent_id', session.user.id).eq('status', 'pending').lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('registrations').select('*, payments(*)').eq('parent_id', session.user.id)
    ]);

    const newAlerts = [];

    // Payment Due
    if (scheduleRes.data && scheduleRes.data.length > 0) {
      newAlerts.push({
        id: 'payment',
        type: 'alert',
        icon: CreditCard,
        title: 'Payment Due',
        text: `You have ${scheduleRes.data.length} installment(s) due soon.`,
        link: '/payments',
        color: 'rose'
      });
    }

    // Rejected Slips
    const rejected = regRes.data?.some(r => r.payments?.some((p: any) => p.status === 'rejected'));
    if (rejected) {
      newAlerts.push({
        id: 'rejected',
        type: 'alert',
        icon: AlertCircle,
        title: 'Payment Rejected',
        text: 'One of your payment slips was rejected. Please re-upload.',
        link: '/payments',
        color: 'rose'
      });
    }

    // Unread Notifications
    if (notifRes.data && notifRes.data.length > 0) {
      notifRes.data.forEach(n => {
        newAlerts.push({
          id: n.id,
          type: n.type,
          icon: n.type === 'alert' ? AlertCircle : Info,
          title: n.title,
          text: n.content,
          link: n.link || '/notifications',
          color: n.type === 'alert' ? 'rose' : 'blue'
        });
      });
    }

    setAlerts(newAlerts);
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <button
          key={alert.id}
          onClick={() => navigate(alert.link)}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left animate-in slide-in-from-top-2 duration-300",
            alert.color === 'rose' ? "bg-rose-50 border-rose-100 text-rose-900" : "bg-blue-50 border-blue-100 text-blue-900"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              alert.color === 'rose' ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
            )}>
              <alert.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">{alert.title}</p>
              <p className="text-xs opacity-80">{alert.text}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 opacity-40" />
        </button>
      ))}
    </div>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <div className={cn("bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold", className)}>
      i
    </div>
  );
}
