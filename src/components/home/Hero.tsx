import { motion } from 'motion/react';
import { MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, type SiteSettings, type SiteContent } from '../../lib/supabase';

export default function Hero() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [content, setContent] = useState<any>(null);
  const [ageRange, setAgeRange] = useState('Ages 10-17');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [settingsRes, contentRes, ageGroupsRes] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'contact').single(),
        supabase.from('site_content').select('content').eq('section_id', 'hero').single(),
        supabase.from('age_groups').select('min_age, max_age').eq('is_active', true)
      ]);
      
      if (settingsRes.data) setSettings(settingsRes.data.value as SiteSettings);
      if (contentRes.data) setContent(contentRes.data.content);
      if (ageGroupsRes.data) {
        const min = Math.min(...ageGroupsRes.data.map(g => g.min_age));
        const max = Math.max(...ageGroupsRes.data.map(g => g.max_age));
        setAgeRange(`Ages ${min}-${max}`);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="pt-48 pb-32 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  const whatsappLink = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}` : '#';

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-sm font-semibold"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next Intake: October 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] text-wrap-balance"
          >
            {content?.headline || "Your child has an idea."}<br />
            <span className="text-blue-600">{content?.subheadline || "Let AI help them build it."}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            {content?.subtext || `No coding experience needed. ${ageRange}. Small classes, hands-on learning.`}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <a
              href="/register"
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-200 group"
            >
              Register Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5 text-green-500" />
              WhatsApp Us
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 aspect-[16/9] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl md:rounded-[32px] shadow-2xl overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl max-w-lg text-left space-y-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 border-2 border-white rounded-md" />
                </div>
                <h3 className="text-2xl font-bold text-white">Future-Ready Skills</h3>
                <p className="text-blue-50 text-sm leading-relaxed">
                  "My son built his own homework tracker in just 4 weeks. He's more confident and excited about technology than ever before!" — Happy Parent
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
