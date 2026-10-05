import { useEffect, useState } from 'react';
import { supabase, type Registration, type Announcement, type SiteSettings, type PaymentSchedule } from '../lib/supabase';
import { LogOut, User, MessageSquare, CreditCard, Megaphone, Bell, Settings, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import AlertStrip from '../components/parent/AlertStrip';
import ChildCard from '../components/parent/ChildCard';
import NextClassCard from '../components/parent/NextClassCard';

export default function ParentDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const [regRes, annRes, setRes, schedRes] = await Promise.all([
      supabase.from('registrations').select('*, class_slots(*, courses(*), age_groups(*)), payments(*)').eq('parent_id', session.user.id),
      supabase.from('announcements').select('*').eq('is_active', true).in('target_role', ['all', 'parent']).order('created_at', { ascending: false }).limit(3),
      supabase.from('site_settings').select('value').eq('key', 'contact').single(),
      supabase.from('payment_schedules').select('*').eq('parent_id', session.user.id)
    ]);

    if (regRes.data) setRegistrations(regRes.data as any);
    if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
    if (setRes.data) setSettings(setRes.data.value as SiteSettings);
    if (schedRes.data) setSchedules(schedRes.data as PaymentSchedule[]);
    setLoading(false);
  }

  const whatsappLink = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}` : '#';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-20 max-w-2xl">
        <div className="space-y-8">
          {/* Header Mobile */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Academy</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Parent Portal</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/notifications')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-500 relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>
              <button onClick={() => navigate('/profile')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-500">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          <AlertStrip />

          {registrations.length > 0 && (
            <NextClassCard registrations={registrations} />
          )}

          {/* Child List */}
          <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-xl font-bold text-slate-900">Your Children</h2>
              <button onClick={() => navigate('/children')} className="text-xs font-bold text-blue-600">Manage All</button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-48 bg-white rounded-[32px] border border-slate-100 animate-pulse" />)
              ) : registrations.length > 0 ? (
                registrations.map(reg => {
                  const childSchedules = schedules.filter(s => s.registration_id === reg.id || (s.group_id === reg.group_id && s.group_id));
                  const totalDue = childSchedules.reduce((acc, s) => acc + (s.status === 'pending' ? Number(s.amount) : 0), 0);
                  return <ChildCard key={reg.id} registration={reg} amountDue={totalDue} />;
                })
              ) : (
                <div className="p-12 bg-white rounded-[32px] border border-slate-100 text-center space-y-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-slate-900">No students registered yet</p>
                    <p className="text-sm text-slate-500">Add your child's details to begin their tech journey.</p>
                  </div>
                  <button onClick={() => navigate('/dashboard/add-student')} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Add your child</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Menu */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/payments')} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3 transition-all hover:border-blue-200 group">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-all">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Payments</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Installments</p>
              </div>
            </button>
            <button onClick={() => navigate('/requests')} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3 transition-all hover:border-blue-200 group">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-all">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Requests</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Slot Changes</p>
              </div>
            </button>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 px-2 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
                Latest News
              </h2>
              <div className="space-y-4">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight mb-1">{ann.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{ann.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Strip */}
          <div className="p-8 bg-slate-900 rounded-[40px] text-white flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 p-4 opacity-5">
              <MessageSquare className="w-24 h-24 -rotate-12" />
            </div>
            <div className="space-y-2 relative">
              <h3 className="text-xl font-bold text-white">Need help?</h3>
              <p className="text-sm text-slate-400">Our support team is available on WhatsApp daily.</p>
            </div>
            <a 
              href={whatsappLink}
              target="_blank"
              className="w-full bg-white text-slate-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors relative shadow-lg"
            >
              <MessageSquare className="w-5 h-5 text-green-500" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
