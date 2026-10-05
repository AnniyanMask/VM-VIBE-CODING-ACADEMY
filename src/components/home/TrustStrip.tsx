import { Users, Shield, Cpu, Zap, Star, Heart, Award, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ICON_MAP: any = { Users, Shield, Cpu, Zap, Star, Heart, Award, CheckCircle };

export default function TrustStrip() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('site_content')
      .select('content')
      .eq('section_id', 'trust_strip')
      .single()
      .then(({ data }) => {
        if (data) setItems(data.content.items);
      });
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`grid grid-cols-2 lg:grid-cols-${Math.min((items || []).length, 4)} gap-8 md:gap-12`}>
          {(items || []).map((item, index) => {
            const Icon = ICON_MAP[item.icon] || Star;
            return (
              <div key={index} className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 text-center md:text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-slate-900 font-bold tracking-tight text-lg uppercase md:normal-case">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
