import { MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, type SiteSettings } from '../../lib/supabase';

export default function WhatsAppButton() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'contact')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data.value as SiteSettings);
      });
  }, []);

  if (!settings) return null;

  const whatsappNumber = settings.whatsapp?.replace(/[^0-9]/g, '');
  const link = `https://wa.me/${whatsappNumber}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 hover:scale-110 transition-all group active:scale-95"
      aria-label="Contact us on WhatsApp"
    >
      <MessageSquare className="w-6 h-6" />
      <span className="absolute right-full mr-4 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Chat with us
      </span>
    </a>
  );
}
