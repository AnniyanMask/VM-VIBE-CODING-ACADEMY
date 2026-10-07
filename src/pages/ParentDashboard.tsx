import { useEffect, useState } from 'react';
import { supabase, type Registration, type Announcement, type SiteSettings, type PaymentSchedule, type Profile } from '../lib/supabase';
import { LogOut, User, MessageSquare, CreditCard, Megaphone, Bell, Settings, ChevronRight, Gift, Copy, Check, Share2, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertStrip from '../components/parent/AlertStrip';
import ChildCard from '../components/parent/ChildCard';
import NextClassCard from '../components/parent/NextClassCard';

export default function ParentDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const [regRes, annRes, setRes, schedRes, profRes] = await Promise.all([
      supabase.from('registrations').select('*, class_slots(*, courses(*), age_groups(*)), payments(*)').eq('parent_id', session.user.id),
      supabase.from('announcements').select('*').eq('is_active', true).in('target_role', ['all', 'parent']).order('created_at', { ascending: false }).limit(3),
      supabase.from('site_settings').select('value').eq('key', 'contact').maybeSingle(),
      supabase.from('payment_schedules').select('*').eq('parent_id', session.user.id),
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
    ]);

    if (regRes.data) setRegistrations(regRes.data as any);
    if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
    if (setRes.data) setSettings(setRes.data.value as SiteSettings);
    if (schedRes.data) setSchedules(schedRes.data as PaymentSchedule[]);
    if (profRes.data) setProfile(profRes.data as any);
    setLoading(false);
  }

  const handleCopyCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsappLink = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}` : '#';

  return (
    <div className="space-y-8">
      <main className="space-y-8">
        <div className="space-y-8">
          {/* Header Mobile */}
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Academy</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Parent Portal</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/dashboard/notifications')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-500 relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>
              <button onClick={() => navigate('/dashboard/profile')} className="p-3 bg-white rounded-2xl shadow-sm text-slate-500">
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
              <button onClick={() => navigate('/dashboard/children')} className="text-xs font-bold text-blue-600">Manage All</button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-48 bg-white rounded-[32px] border border-slate-100 animate-pulse" />)
              ) : registrations.length > 0 ? (
                registrations.map(reg => {
                  const childSchedules = schedules.filter(s => s.registration_id === reg.id || (s.group_id === reg.group_id && s.group_id));
                  const totalDue = childSchedules.reduce((acc, s) => acc + (s.status === 'pending' ? Number(s.amount) : 0), 0);
                  return <ChildCard key={reg.id} registration={reg} amountDue={totalDue} schedules={childSchedules} />;
                })
              ) : (
                <div className="p-12 bg-white rounded-[32px] border border-slate-100 text-center space-y-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-slate-900">No children registered yet</p>
                    <p className="text-sm text-slate-500">Add your child's details to begin their tech journey.</p>
                  </div>
                  <button onClick={() => navigate('/dashboard/add-child')} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Add your child</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Menu */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/dashboard/payments')} className="p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-3 transition-all hover:border-blue-200 group">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-all shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 text-xs">Payments</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Installments</p>
              </div>
            </button>
            <button onClick={() => navigate('/dashboard/requests')} className="p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-3 transition-all hover:border-blue-200 group">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-all shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 text-xs">Requests</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Slot Changes</p>
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

          {/* Referral Program */}
          <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Gift className="w-32 h-32 rotate-12" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase tracking-widest">Rewards</span>
                  <h3 className="text-xl font-bold">Refer a Friend, Get RM 50</h3>
                </div>
                <p className="text-indigo-100 text-sm max-w-sm">Share your code with other parents. If they sign up, both of you receive a RM 50 credit.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10">
                  <div>
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Your Unique Code</p>
                    <p className="text-lg font-black tracking-tighter">{profile?.referral_code || 'LOADING...'}</p>
                  </div>
                  <button 
                    onClick={handleCopyCode}
                    className="p-3 bg-white text-indigo-600 rounded-xl shadow-lg hover:scale-105 transition-all"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    const text = `Join VM Vibe Academy! Use my referral code ${profile?.referral_code} and we both get RM 50 off. ${window.location.origin}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full md:w-auto bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-50 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share via WA
                </button>
              </div>
            </div>
          </div>

          {/* Support Strip */}
          <div className="p-6 bg-slate-900 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 p-4 opacity-5">
              <MessageSquare className="w-16 h-16 -rotate-12" />
            </div>
            <div className="space-y-1 relative text-center md:text-left">
              <h3 className="text-lg font-bold text-white">Need help?</h3>
              <p className="text-xs text-slate-400">Our support team is available on WhatsApp daily.</p>
            </div>
            <a 
              href={whatsappLink}
              target="_blank"
              className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors relative shadow-lg text-sm"
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
