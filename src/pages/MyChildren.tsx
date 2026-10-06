import { useEffect, useState } from 'react';
import { supabase, type Registration, type AgeGroup, type ClassSlot, type PaymentPlan } from '../lib/supabase';
import { User, School, BookOpen, Edit3, Plus, ArrowLeft, Loader2, Save, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateAge, cn } from '../lib/utils';

export default function MyChildren() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');

    const [regRes, ageRes] = await Promise.all([
      supabase.from('registrations').select('*, class_slots(*, courses(*), age_groups(*))').eq('parent_id', session.user.id),
      supabase.from('age_groups').select('*')
    ]);

    if (regRes.data) setRegistrations(regRes.data as any);
    if (ageRes.data) setAgeGroups(ageRes.data);
    setLoading(false);
  }

  const handleEdit = (reg: Registration) => {
    setEditingId(reg.id);
    setFormData({
      school: reg.school,
      experience_level: reg.experience_level
    });
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from('registrations')
      .update(formData)
      .eq('id', id);
    
    if (!error) {
      setEditingId(null);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen">
      
      <main className="container mx-auto space-y-8">
        <div className="space-y-8">
          <header className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-white rounded-xl shadow-sm text-slate-500 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Children</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrolled Children</p>
            </div>
          </header>

          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : registrations.map((reg) => (
              <div key={reg.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{reg.student_name}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          {formatDate(reg.student_dob)} • {calculateAge(reg.student_dob)} Years Old
                        </p>
                      </div>
                    </div>
                    {editingId === reg.id ? (
                      <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                    ) : (
                      <button onClick={() => handleEdit(reg)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit3 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current School</label>
                      {editingId === reg.id ? (
                        <input 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                          value={formData.school || ''}
                          onChange={e => setFormData({ ...formData, school: e.target.value })}
                        />
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                          <School className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-bold text-slate-700">{reg.school || 'Not specified'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Experience Level</label>
                      {editingId === reg.id ? (
                        <select 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                          value={formData.experience_level || ''}
                          onChange={e => setFormData({ ...formData, experience_level: e.target.value })}
                        >
                          <option>Beginner (No coding)</option>
                          <option>Some experience (Scratch/Robotics)</option>
                          <option>Intermediate (Python/JS)</option>
                        </select>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-bold text-slate-700">{reg.experience_level || 'Beginner'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingId === reg.id && (
                    <button 
                      onClick={() => handleSave(reg.id)}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  )}

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                      To change <strong>Date of Birth</strong> or <strong>Class Slot</strong>, please submit a <button onClick={() => navigate('/dashboard/requests')} className="underline font-bold">Change Request</button> to our admin team.
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <button 
              onClick={() => navigate('/dashboard/add-child')}
              className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[40px] text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-2 font-bold"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Plus className="w-6 h-6" />
              </div>
              <span>Register Another Child</span>
              <p className="text-[10px] font-normal">Family plan (RM450) automatically applies for 2 children.</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}
