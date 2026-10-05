import { useState, useEffect } from 'react';
import { supabase, type ClassSlot, type AgeGroup } from '../../lib/supabase';
import { User, Calendar, School, BookOpen, Users, CheckCircle2, ArrowRight, Loader2, CreditCard, Plus, Trash2 } from 'lucide-react';
import { calculateAge } from '../../lib/utils';
import { cn } from '../../lib/utils';

type Props = {
  parentId: string;
  onSuccess: () => void;
  onSkip?: () => void;
  enquiryId?: string | null;
};

export default function ChildForm({ parentId, onSuccess, onSkip, enquiryId }: Props) {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<any[]>([]);
  const [regControl, setRegControl] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([{
    name: '',
    dob: '',
    school: '',
    experience: 'Beginner (No coding)',
    slotId: '',
  }]);

  const [paymentPlanId, setPaymentPlanId] = useState('');
  const [consents, setConsents] = useState({
    terms: false,
    media: false,
  });

  useEffect(() => {
    async function fetchData() {
      const [slotsRes, ageGroupsRes, availRes, plansRes, controlRes] = await Promise.all([
        supabase.from('class_slots').select('*, age_groups(*), courses(*)'),
        supabase.from('age_groups').select('*'),
        supabase.from('slot_availability').select('*'),
        supabase.from('payment_plans').select('*').eq('is_active', true),
        supabase.from('site_settings').select('value').eq('key', 'registration_control').single()
      ]);
      
      if (slotsRes.data && availRes.data) {
        const slotsWithAvail = slotsRes.data.map(slot => {
          const avail = availRes.data.find(a => a.slot_id === slot.id);
          return { ...slot, seats_left: avail?.seats_left ?? slot.total_seats };
        });
        setSlots(slotsWithAvail);
      }
      if (ageGroupsRes.data) setAgeGroups(ageGroupsRes.data);
      if (plansRes.data) setPaymentPlans(plansRes.data);
      if (controlRes.data) setRegControl(controlRes.data.value);
    }
    fetchData();
  }, []);

  // Suggested Plan Logic
  useEffect(() => {
    if (!paymentPlanId && paymentPlans.length > 0) {
      if (students.length === 2) {
        const familyPlan = paymentPlans.find(p => p.children_count === 2);
        if (familyPlan) setPaymentPlanId(familyPlan.id);
      } else {
        const fullPlan = paymentPlans.find(p => p.installment_count === 1 && p.children_count === 1);
        if (fullPlan) setPaymentPlanId(fullPlan.id);
      }
    }
  }, [students.length, paymentPlans, paymentPlanId]);

  const addStudent = () => {
    setStudents([...students, {
      name: '',
      dob: '',
      school: '',
      experience: 'Beginner (No coding)',
      slotId: '',
    }]);
  };

  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const updateStudent = (index: number, data: any) => {
    const newStudents = [...students];
    newStudents[index] = { ...newStudents[index], ...data };
    setStudents(newStudents);
  };

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      const groupId = crypto.randomUUID();
      const selectedPlan = paymentPlans.find(p => p.id === paymentPlanId);

      // 1. Prepare registrations
      const initialStatus = regControl?.status === 'waitlist' ? 'waitlist' : 'pending';
      
      const registrations = students.map(s => ({
        parent_id: parentId,
        group_id: groupId,
        enquiry_id: enquiryId,
        student_name: s.name,
        student_dob: s.dob,
        school: s.school,
        experience_level: s.experience,
        slot_id: s.slotId,
        payment_plan_id: paymentPlanId,
        terms_accepted_at: new Date().toISOString(),
        media_consent: consents.media,
        status: initialStatus
      }));

      const { data: regData, error: regError } = await supabase.from('registrations').insert(registrations).select();
      if (regError) throw regError;

      // 2. Sibling Request Logic (If different slots)
      const slotIds = students.map(s => s.slotId);
      const uniqueSlots = new Set(slotIds);
      if (students.length > 1 && uniqueSlots.size > 1) {
        await supabase.from('sibling_requests').insert({
          registration_id: regData[0].id,
          message: `Sibling group (${students.length} children) registered in different slots. Request to attend together if possible.`,
        });
      }

      // 3. Create Payment Schedule
      if (selectedPlan) {
        const scheduleEntries = [];
        for (let i = 0; i < selectedPlan.installment_count; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          scheduleEntries.push({
            parent_id: parentId,
            group_id: groupId,
            amount: selectedPlan.fee / selectedPlan.installment_count,
            due_date: dueDate.toISOString().split('T')[0],
            installment_number: i + 1,
            status: 'pending'
          });
        }
        await supabase.from('payment_schedules').insert(scheduleEntries);
      }

      // 4. Update Enquiry if applicable
      if (enquiryId) {
        await supabase.from('enquiries').update({ status: 'registered' }).eq('id', enquiryId);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedPlan = paymentPlans.find(p => p.id === paymentPlanId);
  const totalAmount = selectedPlan?.fee || 0;
  const basePlan = paymentPlans.find(p => p.installment_count === 1 && p.children_count === 1);
  const standardPrice = (basePlan?.fee || 250) * students.length;
  const savings = standardPrice - totalAmount;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Child Details</h1>
        <p className="text-slate-500">Add information for each child attending the course.</p>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-10">
        {students.map((student, index) => {
          const age = student.dob ? calculateAge(student.dob) : 0;
          const suitableAgeGroup = ageGroups.find(g => age >= g.min_age && age <= g.max_age);
          const isOutsideRange = student.dob && !suitableAgeGroup;
          
          return (
            <div key={index} className="space-y-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group/child">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-full tracking-widest">Child {index + 1}</span>
                {index > 0 && (
                  <button onClick={() => removeStudent(index)} className="text-rose-500 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium"
                    placeholder="Child Name"
                    value={student.name}
                    onChange={e => updateStudent(index, { name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium"
                      value={student.dob}
                      onChange={e => updateStudent(index, { dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current School</label>
                    <input
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium"
                      placeholder="e.g. SK Bangsar"
                      value={student.school}
                      onChange={e => updateStudent(index, { school: e.target.value })}
                    />
                  </div>
                </div>

                {student.dob && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${isOutsideRange ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    <Users className="w-4 h-4" />
                    {isOutsideRange ? 'Outside regular age range. Contact us for special arrangement.' : `Suitable for ${suitableAgeGroup?.name} track.`}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Preferred Slot</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl appearance-none font-medium"
                    value={student.slotId}
                    onChange={e => updateStudent(index, { slotId: e.target.value })}
                  >
                    <option value="">Select a slot</option>
                    {slots.map(slot => (
                      <option key={slot.id} value={slot.id} disabled={slot.seats_left <= 0}>
                        {slot.day_of_week} {slot.start_time.slice(0, 5)} ({slot.age_groups?.name}) — {slot.seats_left} seats left
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        <button 
          onClick={addStudent}
          className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[32px] text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          Add Another Child
        </button>

        <div className="space-y-6 pt-8 border-t border-slate-100">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Choose Payment Plan</h3>
            <p className="text-sm text-slate-500">Select the plan that works best for your family.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {paymentPlans.filter(p => p.children_count <= students.length).map(plan => (
              <label 
                key={plan.id}
                className={`relative p-6 rounded-[28px] border-2 transition-all cursor-pointer group ${
                  paymentPlanId === plan.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <input type="radio" className="hidden" name="plan" checked={paymentPlanId === plan.id} onChange={() => setPaymentPlanId(plan.id)} />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900 text-xl">{plan.name}</p>
                      {plan.children_count > 1 && <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Sibling Rate</span>}
                    </div>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-600">RM {plan.fee}</p>
                    {plan.installment_count > 1 && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plan.installment_count} Installments</p>}
                  </div>
                </div>
                {plan.children_count === students.length && students.length > 1 && (
                  <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Recommended for your selection
                  </div>
                )}
              </label>
            ))}
          </div>

          <div className="p-8 bg-slate-900 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCard className="w-32 h-32 rotate-12" />
            </div>
            
            <div className="relative space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest">Summary</span>
                <span className="bg-slate-800 px-3 py-1 rounded-full font-bold">{students.length} {students.length === 1 ? 'Child' : 'Children'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount Due</span>
                <span className="text-3xl font-black text-blue-400">RM {totalAmount}</span>
              </div>
              {savings > 0 && (
                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-emerald-400 font-bold text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span>Sibling Savings Applied</span>
                  </div>
                  <span>RM {savings} Saved</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600" checked={consents.terms} onChange={e => setConsents({...consents, terms: e.target.checked})} />
              <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                I agree to the <a href="/terms-of-service" target="_blank" className="text-blue-600 font-bold underline">Terms of Service</a> and <a href="/privacy-policy" target="_blank" className="text-blue-600 font-bold underline">Privacy Policy</a>. I understand that my data is processed in accordance with PDPA guidelines.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600" checked={consents.media} onChange={e => setConsents({...consents, media: e.target.checked})} />
              <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                (Optional) I give consent for photos/videos of my child to be used for educational and marketing purposes by VM Vibe Academy.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleSave}
              disabled={loading || !paymentPlanId || !consents.terms || students.some(s => !s.name || !s.slotId || !s.dob)}
              className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm & Submit Application'}
            </button>
            {onSkip && (
              <button onClick={onSkip} className="text-slate-500 font-bold text-sm hover:text-blue-600 transition-colors py-2">
                Skip for now, I'll add my child later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
