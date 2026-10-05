import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Shield, Lock, Eye, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
              <p className="text-slate-500 font-medium">Last Updated: October 5, 2026</p>
            </div>

            <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600">
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">1</span>
                  </div>
                  Introduction
                </h2>
                <p>
                  At VM Vibe Academy, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information and that of your children. By using our services, you agree to the collection and use of information in accordance with this policy and the Personal Data Protection Act (PDPA) of Malaysia.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">2</span>
                  </div>
                  Information We Collect
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2">Parent Information</h3>
                    <ul className="text-sm space-y-2 list-disc ml-4">
                      <li>Full name and contact details</li>
                      <li>Email address and phone number</li>
                      <li>Payment records and history</li>
                      <li>Account credentials</li>
                    </ul>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2">Child Information</h3>
                    <ul className="text-sm space-y-2 list-disc ml-4">
                      <li>Name and date of birth</li>
                      <li>School and education level</li>
                      <li>Learning progress and attendance</li>
                      <li>Projects and work created during courses</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">3</span>
                  </div>
                  How We Use Information
                </h2>
                <p>We use the collected data for various purposes:</p>
                <ul className="space-y-3 list-none">
                  {[
                    'To provide and maintain our educational services',
                    'To notify you about changes to our classes or schedules',
                    'To provide customer support and communications',
                    'To monitor student progress and learning outcomes',
                    'To process payments and manage accounts',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">4</span>
                  </div>
                  Data Security
                </h2>
                <p>
                  The security of your data is important to us. We implement industry-standard security measures to protect your personal information. However, remember that no method of transmission over the Internet is 100% secure. We use Supabase for secure data storage and authentication.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">5</span>
                  </div>
                  Media Consent
                </h2>
                <p>
                  With your explicit consent, we may take photographs or videos of classes and student work for educational and marketing purposes. You have the right to withdraw this consent at any time through your profile settings or by contacting us.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <span className="text-sm font-black">6</span>
                  </div>
                  Contact Us
                </h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="p-6 bg-slate-900 rounded-[32px] text-white">
                  <p className="font-bold">VM Vibe Academy</p>
                  <p className="text-slate-400">Email: contact@vmvibe.academy</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
