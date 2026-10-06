import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { HelpCircle, ChevronDown, CheckCircle2, Laptop, Battery, UserCircle, Droplets, Info, ExternalLink, MessageSquare } from 'lucide-react';
import Header from '../components/layout/Header';
import { cn } from '../lib/utils';

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

type ChecklistItem = {
  item: string;
  required: boolean;
};

const ICON_MAP: Record<string, any> = {
  'Laptop': Laptop,
  'Charger': Battery,
  'Google Account': UserCircle,
  'Water bottle': Droplets
};

export default function HelpPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [faqRes, checklistRes, settingsRes] = await Promise.all([
      supabase.from('faqs').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('site_settings').select('value').eq('key', 'course_checklist').maybeSingle(),
      supabase.from('site_settings').select('value').eq('key', 'contact').maybeSingle()
    ]);

    if (faqRes.data) setFaqs(faqRes.data);
    if (checklistRes.data) setChecklist(checklistRes.data.value);
    if (settingsRes.data) setSettings(settingsRes.data.value);
    setLoading(false);
  }

  const whatsappLink = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}` : '#';

  return (
    <div className="min-h-screen">
      <main className="container mx-auto space-y-8">
        <div className="space-y-12">
          <header className="text-center space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">How can we help?</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Support & Resources</p>
          </header>

          {/* Checklist */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Class Checklist</h2>
            </div>
            
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 space-y-6">
              <p className="text-sm text-slate-500 leading-relaxed">Please ensure your child brings these items to every class session:</p>
              
              <div className="grid grid-cols-1 gap-4">
                {checklist.map((item, i) => {
                  const Icon = ICON_MAP[item.item.split(' ')[0]] || ICON_MAP[item.item.split('(')[0].trim()] || Info;
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">{item.item}</p>
                        {item.required ? (
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Mandatory</span>
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended</span>
                        )}
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-blue-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-blue-100" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <div className="p-8 bg-blue-600 rounded-[40px] text-white space-y-6 shadow-2xl shadow-blue-200">
            <div className="space-y-2">
              <h3 className="text-2xl font-black">Still have questions?</h3>
              <p className="text-blue-100 text-sm">Our team is happy to help with any academy related enquiries.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href={whatsappLink}
                target="_blank"
                className="flex-1 bg-white text-blue-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                WhatsApp Us
              </a>
              <a 
                href={`mailto:${settings?.email || 'hello@vmvibe.my'}`}
                className="flex-1 bg-blue-700 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-lg"
              >
                <ExternalLink className="w-5 h-5" />
                Email Support
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
