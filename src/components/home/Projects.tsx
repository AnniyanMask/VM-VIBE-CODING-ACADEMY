import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabase, type ProjectExample } from '../../lib/supabase';

export default function Projects() {
  const [projects, setProjects] = useState<ProjectExample[]>([]);

  useEffect(() => {
    supabase
      .from('project_examples')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setProjects(data as ProjectExample[]);
      });
  }, []);

  if (projects.length === 0) return null;

  return (
    <section className="py-24 bg-white" id="projects">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">What your child will build</h2>
          <p className="text-lg text-slate-600">Real-world projects they can show off to family and friends.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(projects || []).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative h-[300px] rounded-3xl overflow-hidden cursor-default shadow-lg"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-90`} />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <span className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">{project.category}</span>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">{project.title}</h3>
                <p className="text-white/80 leading-relaxed max-w-sm">
                  {project.description}
                </p>
              </div>

              <div className="absolute top-8 right-8 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 border-2 border-white rounded-sm" />
              </div>
            </motion.div>
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
