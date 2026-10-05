import { useState, useEffect } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { supabase, type FAQ } from '../../lib/supabase';

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setFaqs(data as FAQ[]);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="py-24 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (faqs.length === 0) return null;

  return (
    <section className="py-24 bg-white" id="faq">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">FAQ</h2>
          <p className="text-lg text-slate-600">Everything you need to know before joining.</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={faq.id}
              className={`border rounded-2xl transition-all ${openIndex === index ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-bold text-slate-900">{faq.question}</span>
                {openIndex === index ? <Minus className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-slate-400" />}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
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
