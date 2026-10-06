import { useState, useEffect } from 'react';
import { Plus, Minus, Loader2, HelpCircle, MessageSquare, ArrowRight, Search } from 'lucide-react';
import { supabase, type FAQ } from '../lib/supabase';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { cn } from '../lib/utils';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-sm font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              Common Questions
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about our AI-first coding academy, curriculum, and enrollment process.
            </p>
            
            <div className="max-w-xl mx-auto relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search for questions..."
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[32px] shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* FAQ List */}
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <div 
                    key={faq.id}
                    className={cn(
                      "bg-white rounded-[32px] border transition-all overflow-hidden",
                      openIndex === index ? "border-blue-200 shadow-xl shadow-blue-500/5 ring-4 ring-blue-500/5" : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <button
                      className="w-full px-8 py-7 flex items-center justify-between text-left"
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                      <span className="font-bold text-slate-900 md:text-lg pr-8">{faq.question}</span>
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                        openIndex === index ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                      )}>
                        {openIndex === index ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </div>
                    </button>
                    {openIndex === index && (
                      <div className="px-8 pb-8 text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="pt-6 border-t border-slate-50">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100">
                <p className="text-slate-400 font-medium">No questions found matching your search.</p>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto mt-20">
            <div className="bg-slate-900 rounded-[48px] p-8 md:p-16 text-center space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 p-8 opacity-10">
                <MessageSquare className="w-48 h-48 -rotate-12" />
              </div>
              
              <div className="relative space-y-4">
                <h2 className="text-3xl md:text-4xl font-black text-white">Still have questions?</h2>
                <p className="text-slate-400 text-lg max-w-sm mx-auto">
                  Our admissions team is available daily on WhatsApp to help with your enquiries.
                </p>
              </div>

              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href="/register"
                  className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-500/20"
                >
                  Register Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="/#contact"
                  className="w-full sm:w-auto bg-white/10 text-white border border-white/20 px-10 py-5 rounded-full text-lg font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
