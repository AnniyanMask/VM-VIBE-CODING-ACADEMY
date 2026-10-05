import { Palette, Rocket, Target, ShieldCheck, Star, Heart, Award, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ICON_MAP: any = { Palette, Rocket, Target, ShieldCheck, Star, Heart, Award, CheckCircle };

export default function Benefits() {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('site_content')
      .select('content')
      .eq('section_id', 'benefits')
      .single()
      .then(({ data }) => {
        if (data) setContent(data.content);
      });
  }, []);

  if (!content) return null;

  return (
    <section className="py-24 bg-slate-50" id="benefits">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">{content.title}</h2>
          <p className="text-lg text-slate-600">{content.subtext}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {(content.items || []).map((benefit: any, index: number) => {
            const Icon = ICON_MAP[benefit.icon] || Star;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{benefit.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
          >
            Register Now
          </a>
        </div>
      </div>
    </section>
  );
}
