import { Lightbulb, ListChecks, Terminal, Play, Microscope, RefreshCcw, Presentation } from 'lucide-react';
import { motion } from 'motion/react';

export default function Process() {
  const steps = [
    { icon: Lightbulb, name: 'IDEA', color: 'bg-amber-100 text-amber-600' },
    { icon: ListChecks, name: 'PLAN', color: 'bg-blue-100 text-blue-600' },
    { icon: Terminal, name: 'PROMPT', color: 'bg-emerald-100 text-emerald-600' },
    { icon: Play, name: 'BUILD', color: 'bg-indigo-100 text-indigo-600' },
    { icon: Microscope, name: 'TEST', color: 'bg-rose-100 text-rose-600' },
    { icon: RefreshCcw, name: 'IMPROVE', color: 'bg-purple-100 text-purple-600' },
    { icon: Presentation, name: 'PRESENT', color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <section className="py-24 bg-slate-50 overflow-hidden" id="process">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">How it works</h2>
          <p className="text-lg text-slate-600">Our proven 7-step process to bring any idea to life.</p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2" />

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-4 relative"
              >
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-sm z-10 hover:scale-110 transition-transform`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-400 mb-1">STEP {index + 1}</span>
                  <span className="font-bold text-slate-900 tracking-wider">{step.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
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
