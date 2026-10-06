import { Mail, Phone, MapPin, Facebook, Instagram, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, type SiteSettings } from '../../lib/supabase';

export default function Footer() {
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

  const contact = settings;

  return (
    <footer className="bg-slate-900 text-slate-300 py-16 px-4 md:px-6" id="contact">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              VM Vibe <span className="text-blue-400">Academy</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Empowering the next generation of creators and builders in Malaysia through responsible AI education and hands-on coding.
            </p>
            <div className="flex gap-4">
              <a href={contact?.facebook} className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors">
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a href={contact?.instagram} className="p-2 bg-slate-800 rounded-lg hover:bg-blue-600 transition-colors">
                <Instagram className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-white font-semibold">Quick Links</h4>
            <ul className="space-y-4">
              <li><a href="/#course" className="hover:text-blue-400 transition-colors">Course Syllabus</a></li>
              <li><a href="/#schedule" className="hover:text-blue-400 transition-colors">Class Schedule</a></li>
              <li><a href="/faq" className="hover:text-blue-400 transition-colors">Common Questions</a></li>
              <li><a href="/register" className="hover:text-blue-400 transition-colors">Register Now</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-white font-semibold">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-400 shrink-0" />
                <span>{contact?.phone}</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                <span>{contact?.email}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
                <span className="text-sm">{contact?.address}</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="space-y-6">
            <h4 className="text-white font-semibold">Operating Hours</h4>
            <p className="text-slate-400 leading-relaxed">
              {contact?.operating_hours}
            </p>
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} VM Vibe Academy. All rights reserved.
              </p>
              <div className="mt-2 flex gap-4 text-xs">
                <a href="/privacy-policy" className="hover:text-white">Privacy Policy</a>
                <a href="/terms-of-service" className="hover:text-white">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
