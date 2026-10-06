import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Check, Trash2, Loader2, Info, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

type Notification = {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'alert' | 'success';
  is_read: boolean;
  link: string | null;
  created_at: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function deleteNotification(id: string) {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    setNotifications(notifications.filter(n => n.id !== id));
  }

  async function markAllAsRead() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id);
    
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto space-y-8">
        <div className="space-y-6">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stay updated</p>
            </div>
            {notifications.some(n => !n.is_read) && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-blue-600 px-4 py-2 bg-blue-50 rounded-full"
              >
                Mark all as read
              </button>
            )}
          </header>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  className={cn(
                    "p-6 rounded-[32px] border transition-all flex gap-4",
                    n.is_read ? "bg-white border-slate-100" : "bg-blue-50/50 border-blue-100 shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    n.type === 'alert' ? "bg-rose-100 text-rose-600" :
                    n.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    {n.type === 'alert' ? <AlertCircle className="w-6 h-6" /> :
                     n.type === 'success' ? <Check className="w-6 h-6" /> :
                     <Info className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={cn("font-bold text-slate-900 leading-tight", !n.is_read && "text-blue-900")}>{n.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{n.content}</p>
                    
                    <div className="flex gap-4 pt-3">
                      {!n.is_read && (
                        <button onClick={() => markAsRead(n.id)} className="text-[10px] font-black uppercase tracking-widest text-blue-600">Mark as Read</button>
                      )}
                      <button onClick={() => deleteNotification(n.id)} className="text-[10px] font-black uppercase tracking-widest text-rose-600">Delete</button>
                      {n.link && (
                        <button onClick={() => navigate(n.link!)} className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-1">
                          View <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 bg-white rounded-[40px] border border-slate-100 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Bell className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-lg">No notifications yet</p>
                  <p className="text-sm text-slate-500">We'll notify you here when there are updates to your child's progress or payments.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
