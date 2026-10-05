import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import ChildForm from '../components/parent/ChildForm';
import { ArrowLeft } from 'lucide-react';

export default function AddChild() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUserId(session.user.id);
      }
      setLoading(false);
    }
    checkUser();
  }, [navigate]);

  if (loading || !userId) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 md:px-6 pt-32 pb-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden p-8 md:p-12">
            <ChildForm 
              parentId={userId} 
              onSuccess={() => navigate('/dashboard')} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
