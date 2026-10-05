import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, ArrowRight, ArrowLeft, Loader2, MessageSquare, XCircle, CreditCard, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ChildForm from '../components/parent/ChildForm';

type Step = 1 | 2 | 3;

export default function Register() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [regStatus, setRegStatus] = useState<'open' | 'closed' | 'waitlist'>('open');
  const [userId, setUserId] = useState<string | null>(null);
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form State
  const [parentData, setParentData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    leadSource: '',
  });

  useEffect(() => {
    async function checkExistingSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If logged in, check if they have children
        const { data: regs } = await supabase.from('registrations').select('id').eq('parent_id', session.user.id);
        if (regs && regs.length > 0) {
          navigate('/dashboard');
        } else {
          navigate('/add-child');
        }
      }
    }
    checkExistingSession();

    async function fetchData() {
      const [settingsRes, sourcesRes, controlRes] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'contact').single(),
        supabase.from('site_settings').select('value').eq('key', 'lead_sources').single(),
        supabase.from('site_settings').select('value').eq('key', 'registration_control').single()
      ]);
      
      if (settingsRes.data) setSettings(settingsRes.data.value);
      if (sourcesRes.data) setLeadSources(sourcesRes.data.value || []);
      if (controlRes.data) setRegStatus(controlRes.data.value.status || 'open');
    }
    fetchData();
  }, [navigate]);

  async function handleRegister() {
    setLoading(true);
    setError(null);

    try {
      // 1. Capture Lead Early
      const { data: lead, error: leadError } = await supabase.from('enquiries').insert({
        name: parentData.fullName,
        email: parentData.email,
        phone: parentData.phone,
        source: 'registration_started',
        message: `Lead source: ${parentData.leadSource}`,
        status: 'incomplete'
      }).select().single();
      
      if (lead) setEnquiryId(lead.id);

      // 2. Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: parentData.email,
        password: parentData.password,
        options: {
          data: {
            full_name: parentData.fullName,
            phone: parentData.phone,
          }
        }
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered') || authError.status === 400) {
           setError('already_exists');
           setLoading(false);
           return;
        }
        throw authError;
      }

      if (authData.user) {
        setUserId(authData.user.id);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (regStatus === 'closed' && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <XCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Registration Closed</h1>
            <p className="text-slate-500">We are currently not accepting new applications. Please contact us via WhatsApp for future intake details.</p>
          </div>
          <Link to="/" className="inline-block text-blue-600 font-bold hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 flex">
          <div className={`h-full bg-blue-600 transition-all duration-500 ${
            step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
          }`} />
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
          )}

          {error && error !== 'already_exists' && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium mb-8">
              {error}
            </div>
          )}

          {error === 'already_exists' && (
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-[24px] mb-8 space-y-4">
              <div className="flex gap-3 text-blue-700">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold">You already have an account.</p>
                  <p className="text-xs">It looks like you've registered with us before. Please log in to your account to add a child.</p>
                </div>
              </div>
              <Link to="/login" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                Log In Now
              </Link>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Step 1: Parent Info</h1>
                <p className="text-slate-500">Create your account to manage your children's learning.</p>
                <div className="flex gap-2 items-center p-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-bold mt-2 border border-blue-100">
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  You can add your children's details next. It takes about 2 minutes.
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Parent Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      placeholder="e.g. Ahmad bin Ali"
                      value={parentData.fullName}
                      onChange={e => setParentData({...parentData, fullName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        placeholder="parent@email.com"
                        value={parentData.email}
                        onChange={e => setParentData({...parentData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        placeholder="+60 1x-xxx xxxx"
                        value={parentData.phone}
                        onChange={e => setParentData({...parentData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Create Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    placeholder="Min 6 characters"
                    value={parentData.password}
                    onChange={e => setParentData({...parentData, password: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">How did you hear about us?</label>
                  <select
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-medium"
                    value={parentData.leadSource}
                    onChange={e => setParentData({...parentData, leadSource: e.target.value})}
                  >
                    <option value="">Select option</option>
                    {leadSources.map(source => <option key={source} value={source}>{source}</option>)}
                  </select>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={loading || !parentData.fullName || !parentData.email || !parentData.password || !parentData.leadSource}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Register
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-slate-500 mt-4">
                  Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Log In</Link>
                </p>
              </div>
            </div>
          )}

          {step === 2 && userId && (
            <ChildForm 
              parentId={userId}
              enquiryId={enquiryId}
              onSuccess={() => setStep(3)}
              onSkip={() => navigate('/dashboard')}
            />
          )}

          {step === 3 && (
            <div className="space-y-10 text-center animate-in zoom-in-95 duration-500">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Application Received!</h1>
                <p className="text-slate-600 text-lg max-w-sm mx-auto leading-relaxed">
                  Fantastic! Your application has been received. Our team will reach out via <span className="font-bold text-slate-900">WhatsApp</span> within 24 hours.
                </p>
                <div className="pt-8 space-y-4">
                  <Link
                    to="/dashboard"
                    className="block w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
