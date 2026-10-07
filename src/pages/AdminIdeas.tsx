import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Lightbulb, Search, MessageSquare, Save, Loader2, 
  RefreshCw, ChevronRight, User, Calendar, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AdminIdeas() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function fetchIdeas() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_ideas')
        .select('*, registrations(student_name, class_slots(day_of_week, start_time))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
      
      // Initialize feedback state
      const feedbackMap: { [key: string]: string } = {};
      data?.forEach(idea => {
        feedbackMap[idea.id] = idea.instructor_feedback || '';
      });
      setFeedback(feedbackMap);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveFeedback(ideaId: string) {
    setSaving(ideaId);
    try {
      const { error } = await supabase
        .from('student_ideas')
        .update({ 
          instructor_feedback: feedback[ideaId],
          updated_at: new Date().toISOString()
        })
        .eq('id', ideaId);

      if (error) throw error;
      
      // Notify student
      const idea = ideas.find(i => i.id === ideaId);
      if (idea?.registrations?.student_user_id) {
        await supabase.from('notifications').insert({
          user_id: idea.registrations.student_user_id,
          title: 'Feedback on your idea!',
          content: 'An instructor left feedback on your app idea in the Sandbox.',
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    } finally {
      setSaving(null);
    }
  }

  const filtered = ideas.filter(idea => 
    idea.registrations?.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Idea Sandbox</h1>
          <p className="text-slate-500">Review student app ideas and provide feedback</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ideas or students..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchIdeas}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((idea) => (
            <div key={idea.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-8 md:w-2/3 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{idea.registrations?.student_name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {idea.registrations?.class_slots?.day_of_week} @ {idea.registrations?.class_slots?.start_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(idea.created_at), 'dd MMM yyyy')}
                  </span>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed font-medium">{idea.content}</p>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 md:w-1/3 border-t md:border-t-0 md:border-l border-slate-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Instructor Feedback</h4>
                </div>
                <textarea 
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium min-h-[120px]"
                  placeholder="Great idea! Try using Gemini for the prompt logic..."
                  value={feedback[idea.id] || ''}
                  onChange={e => setFeedback({ ...feedback, [idea.id]: e.target.value })}
                />
                <button 
                  onClick={() => saveFeedback(idea.id)}
                  disabled={saving === idea.id}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {saving === idea.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Feedback
                </button>
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Lightbulb className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium italic">No app ideas found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
