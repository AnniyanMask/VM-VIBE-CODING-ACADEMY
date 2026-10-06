import { useEffect, useState } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import { 
  User, Phone, Mail, Lock, Shield, Camera, Loader2, Save, History, Check, X, AlertCircle, LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [consentHistory, setConsentHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    media_consent: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const [profRes, consentRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('consent_logs').select('*').eq('parent_id', session.user.id).order('created_at', { ascending: false })
    ]);

    if (profRes.data) {
      const p = profRes.data as Profile;
      setProfile(p);
      setFormData({
        full_name: p.full_name || '',
        phone: p.phone || '',
        media_consent: false // This will be updated below if we had a previous setting
      });
      
      // Get current media consent from registrations (since it's per registration in current schema, we might want a global one too)
      // For now, let's look at the profile or the latest consent log
    }

    if (consentRes.data) {
      setConsentHistory(consentRes.data);
      if (consentRes.data.length > 0) {
        setFormData(prev => ({ ...prev, media_consent: consentRes.data[0].media_consent }));
      }
    }

    setLoading(false);
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Update Profile
    const { error: profError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (profError) {
      showMessage('error', 'Failed to update profile');
      setSaving(false);
      return;
    }

    // 2. Update Consent Log if changed
    const lastConsent = consentHistory[0]?.media_consent;
    if (formData.media_consent !== lastConsent) {
      await supabase.from('consent_logs').insert({
        parent_id: session.user.id,
        media_consent: formData.media_consent,
        action: 'updated'
      });
      
      // Also update all registrations for this parent to reflect new consent?
      // Usually consent is a global preference that applies to future or all.
      await supabase.from('registrations')
        .update({ media_consent: formData.media_consent })
        .eq('parent_id', session.user.id);
    }

    showMessage('success', 'Profile updated successfully');
    setSaving(false);
    fetchProfile();
  }

  async function handlePasswordReset() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      showMessage('error', error.message);
    } else {
      showMessage('success', 'Password reset email sent!');
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen">
      <main className="container mx-auto space-y-8">
        <div className="space-y-8">
          <header>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profile Settings</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal Information</p>
          </header>

          {message && (
            <div className={cn(
              "p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4",
              message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
            )}>
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{profile?.email}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account ID: {profile?.id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="tel"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="button" 
                    onClick={handlePasswordReset}
                    className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                  >
                    <Lock className="w-4 h-4" />
                    Send Password Reset Email
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Privacy & Consent</h3>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer group hover:bg-blue-50/50 transition-all">
                  <div className="pt-1">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.media_consent}
                      onChange={e => setFormData({ ...formData, media_consent: e.target.checked })}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">Media Consent (Photos & Videos)</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      I agree to allow the academy to take photos/videos of my children during classes for educational and promotional purposes.
                    </p>
                  </div>
                </label>

                {consentHistory.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-400">
                      <History className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Consent History</span>
                    </div>
                    <div className="space-y-2">
                      {consentHistory.slice(0, 3).map((log, i) => (
                        <div key={log.id} className="flex justify-between items-center text-[10px] font-bold">
                          <div className="flex items-center gap-2">
                            {log.media_consent ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-rose-500" />}
                            <span className="text-slate-600">{log.media_consent ? 'Consent Given' : 'Consent Withdrawn'}</span>
                          </div>
                          <span className="text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-bold shadow-xl hover:bg-slate-800 transition-all text-lg flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              Save All Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
