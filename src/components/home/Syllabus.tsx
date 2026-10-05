import { useEffect, useState } from 'react';
import { supabase, type Course } from '../../lib/supabase';
import { motion } from 'motion/react';

export default function Syllabus() {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCourse(data as Course);
      });
  }, []);

  if (!course) return null;

  return (
    <section className="py-20 bg-white" id="course">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">{course.name} Syllabus</h2>
          <p className="text-lg text-slate-600">{course.duration_weeks}-week journey from zero to app hero.</p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-blue-100 -translate-x-1/2 hidden md:block" />
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-100 md:hidden" />

          <div className="space-y-12">
            {(course.syllabus || []).map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-blue-600 rounded-full -translate-x-1/2 ring-4 ring-blue-50 z-10" />

                <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-12">
                  <div className={`p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                      Week {module.week}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{module.topic}</h3>
                  </div>
                </div>
                <div className="hidden md:block w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
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
