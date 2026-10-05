import { Shield, Eye, Lock, HeartHandshake, Star, Award, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ICON_MAP: any = { Shield, Eye, Lock, HeartHandshake, Star, Award, CheckCircle };

export default function Safety() {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('site_content')
      .select('content')
      .eq('section_id', 'safety')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContent(data.content);
      });
  }, []);

  if (!content) return null;

  return (
    <section className="py-20 bg-white" id="safety">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-blue-600 rounded-[32px] md:rounded-[48px] p-8 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                {content.title}
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed">
                {content.subtext}
              </p>
              <div className="flex gap-4">
                <a href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-blue-50 transition-colors">
                  Join Safely
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(content.items || []).map((point: any, index: number) => {
                const Icon = ICON_MAP[point.icon] || Shield;
                return (
                  <div key={index} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                    <Icon className="w-8 h-8 text-blue-200 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">{point.title}</h3>
                    <p className="text-blue-50 text-sm leading-relaxed">
                      {point.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
