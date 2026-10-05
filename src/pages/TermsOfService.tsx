import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FileText, Gavel, Scale, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 md:px-6 pt-32 pb-20 max-w-4xl">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Go Back
        </button>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-16 space-y-12">
            <div className="space-y-4 text-center md:text-left">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto md:mx-0">
                <FileText className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
              <p className="text-slate-500 font-medium">Last Updated: October 5, 2026</p>
            </div>

            <div className="prose prose-slate prose-lg max-w-none space-y-10 text-slate-600">
              <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 flex gap-4 items-start">
                <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                <p className="text-sm text-blue-800 font-medium leading-relaxed">
                  By enrolling your child in VM Vibe Academy, you agree to comply with these terms. Please read them carefully to ensure a smooth learning experience for your child.
                </p>
              </div>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">1</span>
                  </div>
                  Enrollment & Fees
                </h2>
                <div className="space-y-4">
                  <p>
                    Enrollment is confirmed only upon receipt of the registration fee or the first installment. All fees are non-refundable except in cases where a course is cancelled by the Academy.
                  </p>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Payment Rules</h3>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Installments must be paid before the 7th of each month.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Late payments may result in a temporary suspension of classes.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Sibling discounts apply only when both children are active.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">2</span>
                  </div>
                  Attendance & Make-up Classes
                </h2>
                <p>
                  Regular attendance is crucial for your child's progress. We understand emergencies happen:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Notice must be given at least 24 hours before a class for an excused absence.</li>
                  <li>One make-up class per month is permitted, subject to slot availability.</li>
                  <li>No-shows without notice will not be eligible for make-up classes.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">3</span>
                  </div>
                  Student Conduct
                </h2>
                <p>
                  We strive to maintain a safe and encouraging environment. Students are expected to:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Respect instructors and fellow students.</li>
                  <li>Use AI tools responsibly and ethically as guided by instructors.</li>
                  <li>Avoid disruptive behavior that hinders others' learning.</li>
                </ul>
                <p className="text-sm italic">
                  The Academy reserves the right to terminate enrollment for persistent behavioral issues.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">4</span>
                  </div>
                  Intellectual Property
                </h2>
                <p>
                  All educational materials provided by VM Vibe Academy remain the property of the Academy. Projects created by students remain the property of the student, though the Academy may showcase them as part of the student's portfolio.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">5</span>
                  </div>
                  Limitation of Liability
                </h2>
                <p>
                  VM Vibe Academy is not liable for any personal injury or loss of property occurring on premises, though we maintain strict safety protocols. By agreeing to these terms, you waive any claims against the Academy for such occurrences.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">6</span>
                  </div>
                  Governing Law
                </h2>
                <p>
                  These Terms of Service are governed by the laws of Malaysia. Any disputes shall be subject to the exclusive jurisdiction of the Malaysian courts.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
