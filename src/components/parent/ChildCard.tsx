import { type Registration, type PaymentSchedule } from '../../lib/supabase';
import { User, CheckCircle2, Clock, CreditCard, ChevronRight, ExternalLink, Share2, Rocket } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Props = {
  registration: Registration;
  amountDue?: number;
  schedules?: PaymentSchedule[];
};

export default function ChildCard({ registration, amountDue, schedules = [] }: Props) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const steps = [
    { id: 'pending', label: 'Applied', icon: Clock },
    { id: 'approved', label: 'Approved', icon: CheckCircle2 },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 }
  ];

  const handleShare = () => {
    const url = `${window.location.origin}/share/${registration.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Map backend status to UI steps
  let currentStepIndex = 0;
  if (registration.status === 'approved') currentStepIndex = 1;
  
  const hasSchedules = schedules.length > 0;
  const allPaid = hasSchedules && schedules.every(s => s.status === 'paid');
  const somePaid = hasSchedules && schedules.some(s => s.status === 'paid' || (s.payments && s.payments.length > 0));

  if (registration.status === 'approved' && hasSchedules) {
    if (allPaid) {
      currentStepIndex = 3;
    } else if (somePaid) {
      currentStepIndex = 2;
    } else {
      currentStepIndex = 2; 
    }
  } else if (registration.status === 'approved' && (registration.payments?.length ?? 0) > 0) {
    const slipsPaid = registration.payments?.every(p => p.status === 'verified');
    currentStepIndex = slipsPaid ? 3 : 2;
  }

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{registration.student_name}</h3>
              <p className="text-sm text-slate-500">{registration.class_slots?.age_groups?.name} Track</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className={cn(
                "p-3 rounded-xl transition-all flex items-center gap-2",
                copied ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400 hover:text-blue-600"
              )}
              title="Copy Progress Share Link"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button 
              onClick={() => navigate(`/dashboard/children`)}
              className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Link if exists */}
        {registration.project_url && (
          <div className="bg-blue-600 p-4 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Project is Live!</p>
                <p className="text-xs font-bold truncate max-w-[120px] md:max-w-none">Try my child's app</p>
              </div>
            </div>
            <a 
              href={registration.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-all"
            >
              Launch App
            </a>
          </div>
        )}

        {/* Status Tracker */}
        <div className="relative pt-2 pb-4 px-2">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2" />
          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-4 border-white transition-all",
                    isPast ? "bg-emerald-500 text-white" :
                    isCurrent ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200" :
                    "bg-slate-100 text-slate-400"
                  )}>
                    <step.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest text-center min-w-[60px]",
                    isPast ? "text-emerald-600" :
                    isCurrent ? "text-blue-600" :
                    "text-slate-400"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {registration.class_slots?.day_of_week}s @ {registration.class_slots?.start_time?.slice(0, 5)}
          </div>
          {amountDue !== undefined && amountDue > 0 && (
            <div className="flex flex-col">
              <div className="text-xs font-bold text-rose-500 mt-1">
                RM {amountDue} Due
              </div>
              {registration.discount_amount > 0 && (
                <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                  Applied RM {registration.discount_amount} Reduction
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {(registration.status === 'approved' || allPaid) && registration.class_slots?.class_type === 'online' && registration.class_slots?.online_meeting_url && (
            <a 
              href={registration.class_slots.online_meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
            >
              <ExternalLink className="w-3 h-3" />
              Join
            </a>
          )}
          <button 
            onClick={() => navigate('/dashboard/schedule')}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
