import { type Registration } from '../../lib/supabase';
import { User, CheckCircle2, Clock, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

type Props = {
  registration: Registration;
  amountDue?: number;
};

export default function ChildCard({ registration, amountDue }: Props) {
  const navigate = useNavigate();
  
  const steps = [
    { id: 'pending', label: 'Applied', icon: Clock },
    { id: 'approved', label: 'Approved', icon: CheckCircle2 },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 }
  ];

  // Map backend status to UI steps
  let currentStepIndex = 0;
  if (registration.status === 'approved') currentStepIndex = 1;
  // If payment logic exists, set to 2
  const hasPayments = (registration.payments?.length ?? 0) > 0;
  const allPaid = registration.status === 'approved' && hasPayments && registration.payments?.every(p => p.status === 'verified');
  
  if (registration.status === 'approved' && hasPayments) currentStepIndex = 2;
  if (allPaid) currentStepIndex = 3;

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
          <button 
            onClick={() => navigate(`/children`)}
            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Status Tracker */}
        <div className="relative pt-2 pb-4 px-2">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2" />
          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isFuture = idx > currentStepIndex;

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
                    "text-[10px] font-black uppercase tracking-widest",
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
        <button 
          onClick={() => navigate('/schedule')}
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          View Schedule
        </button>
      </div>
    </div>
  );
}
