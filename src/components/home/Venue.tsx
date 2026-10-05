import { MapPin, Clock, Car, Bus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, type SiteSettings } from '../../lib/supabase';

export default function Venue() {
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
    <section className="py-24 bg-slate-50" id="venue">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Our Venue</h2>
          <p className="text-lg text-slate-600">A safe and modern learning environment in the heart of Kuala Lumpur.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info */}
          <div className="space-y-8">
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Address</h4>
                  <p className="text-slate-600">{contact?.address || '123 Jalan Ampang, Kuala Lumpur'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Opening Hours</h4>
                  <p className="text-slate-600">{contact?.operating_hours}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                <Car className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-sm">Parking</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">{contact?.venue_note || 'Free basement parking available.'}</p>
                </div>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                <Bus className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 text-sm">Transport</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">Only 5-min walk from KLCC LRT station. Very convenient!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Embed */}
          <div className="h-[400px] bg-slate-200 rounded-3xl overflow-hidden relative shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.78453535!2d101.71!3d3.15!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMDknMDAuMCJOIDEwMcKwNDInMzYuMCJF!5e0!3m2!1sen!2smy!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
