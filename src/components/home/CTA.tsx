import { ArrowRight, Phone, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, type SiteSettings } from '../../lib/supabase';

export default function CTA() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'contact')
      .single()
      .then(({ data }) => {
        if (data) setSettings(data.value as SiteSettings);
      });
  }, []);

  const contact = settings;

  return (
    <section className="py-24 bg-blue-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Ready to see what your child can build?
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Join dozens of other parents in Malaysia who are giving their children the tools to thrive in the AI era. Limited seats available for the next intake.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 group"
              >
                Register Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-xl shadow-blue-100 border border-blue-50 space-y-8">
            <h3 className="text-2xl font-bold text-slate-900">Have questions?</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Call/WhatsApp us</p>
                  <p className="text-lg font-bold text-slate-900">{contact?.phone || '+60 12-345 6789'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Email us</p>
                  <p className="text-lg font-bold text-slate-900">{contact?.email || 'hello@vmvibe.my'}</p>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500 leading-relaxed italic">
                "We typically respond to WhatsApp messages within 1 hour during operating hours."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
