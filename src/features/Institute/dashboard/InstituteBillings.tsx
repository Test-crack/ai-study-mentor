import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Building2,
  Mic,
  BookOpen,
  Sparkles,
  BarChart,
  Target,
  Users
} from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';

// --- Static Data ---
const perStudentFeatures = [
  "Unlimited tutor accounts",
  "Full speech & reading analytics",
  "AI-generated learning plans",
  "Student progress dashboards",
  "Batch management",
  "Email support"
];

const proFeatures = [
  "Everything in Per Student",
  "Org-wide analytics dashboard",
  "Teacher AI calibration reports",
  "Dean's Report (Institutional ROI)",
  "White-label branding",
  "Dedicated account manager",
  "API access & integrations",
  "Priority support"
];

const featuresGrid = [
  {
    icon: Mic,
    title: "Speech Analytics",
    desc: "Detailed fluency, pronunciation, and confidence scoring for spoken English & IELTS."
  },
  {
    icon: BookOpen,
    title: "Reading Comprehension",
    desc: "Two-pass reading assessment with keyword coverage, hesitation tracking, and pronunciation scoring."
  },
  {
    icon: Sparkles,
    title: "AI Learning Plans",
    desc: "Automatic remediation plans generated after every session — personalized to each student's weaknesses."
  },
  {
    icon: BarChart,
    title: "Institutional Reports",
    desc: "Teacher AI calibration, cohort progress, and exportable Dean's Reports for stakeholder reporting."
  },
  {
    icon: Target,
    title: "Struggle Signatures",
    desc: "Classify student issues as Conceptual, Tactical, or Psychological — so tutors know exactly how to help."
  },
  {
    icon: Users,
    title: "Batch Management",
    desc: "Organize students into batches by course type, assign tutors, and track batch-level performance."
  }
];

const faqs = [
  {
    q: "Can we add students mid-month?",
    a: "Billing is prorated. You only pay for the days remaining in the billing cycle."
  },
  {
    q: "Do tutors need separate accounts?",
    a: "You get unlimited free accounts under your institute. Only student seats are billed."
  },
  {
    q: "Can we white-label the platform?",
    a: "With the Institute Pro plan, you can add your logo, brand colors, and custom domain."
  },
  {
    q: "Is student data secure?",
    a: "Data is encrypted at rest and in transit. We're GDPR-compliant and provide data export on request."
  }
];

export default function InstituteBillings() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [studentCount, setStudentCount] = useState(175); // Default matching the video

  // Cost Calculations
  const perStudentRate = 2500;
  const proBaseRate = 50000;
  const proPerStudentRate = 500;

  const costPerStudentPlan = studentCount * perStudentRate;
  const costProPlan = proBaseRate + (studentCount * proPerStudentRate);
  const savings = costPerStudentPlan - costProPlan;

  // Formatting Helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteSidebar 
          activeTab="billings" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        <InstituteTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-16 py-8">
            
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-teal-100 text-brand-teal-700 dark:bg-brand-teal-500/10 dark:text-brand-teal-400 text-xs font-bold tracking-wider uppercase mb-2">
                <Building2 className="w-3.5 h-3.5" /> For Institutes & Universities
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Transform how Your Institute Delivers English Training
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                AI-powered speech analytics, reading assessments, and institutional reporting — all in one platform.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Per Student Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col transition-colors">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Per Student</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹2,500</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm mb-1">per student / month</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 h-10">
                  Perfect for small institutes and coaching centers getting started with AI-powered assessments.
                </p>
                <div className="space-y-4 mb-8 flex-1">
                  {perStudentFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Institute Pro Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-brand-teal-600 dark:border-brand-teal-500 p-8 shadow-xl relative flex flex-col transition-colors">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-teal-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" /> Most Popular
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 mt-2">Institute Pro</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹50,000</span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm mb-1">/ month + ₹500 per student</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 h-10">
                  For universities and large training institutes needing org-wide analytics and white-label options.
                </p>
                <div className="space-y-4 mb-8 flex-1">
                  {proFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-teal-600 dark:text-brand-teal-400 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3.5 px-4 bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-brand-teal-600/20">
                  Contact Sales <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Cost Calculator */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-sm transition-colors">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cost Calculator</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Slide to see which plan is best for your institute size.</p>
              </div>

              {/* Slider */}
              <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Number of Students</label>
                  <span className="bg-brand-teal-50 dark:bg-brand-teal-500/10 text-brand-teal-700 dark:text-brand-teal-400 font-bold px-3 py-1 rounded-lg border border-brand-teal-100 dark:border-brand-teal-500/20">
                    {studentCount}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  step="5"
                  value={studentCount} 
                  onChange={(e) => setStudentCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>10</span>
                  <span>250</span>
                  <span>500+</span>
                </div>
              </div>

              {/* Calculation Output */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Per Student Plan</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(costPerStudentPlan)}</p>
                  <p className="text-xs text-slate-500 mt-1">/month</p>
                </div>

                <div className={`p-6 rounded-xl border ${savings > 0 ? 'bg-brand-teal-50 border-brand-teal-200 dark:bg-brand-teal-900/20 dark:border-brand-teal-800/50' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'} relative`}>
                  {savings > 0 && (
                    <div className="absolute -top-3 left-4 bg-brand-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Best value for you
                    </div>
                  )}
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Institute Pro Plan</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(costProPlan)}</p>
                  <p className="text-xs text-slate-500 mt-1">/month</p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col justify-center">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">You Save</p>
                  <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{savings > 0 ? formatCurrency(savings) : '₹0'}</p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">/month with Institute Pro</p>
                </div>
              </div>

              {/* Quick Reference Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Quick Reference</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="pb-3 font-semibold">Institute Size</th>
                        <th className="pb-3 font-semibold">Per Student</th>
                        <th className="pb-3 font-semibold">Pro Plan</th>
                        <th className="pb-3 font-semibold">Best</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <td className="py-3">Small Coaching Center (30)</td>
                        <td className="py-3">₹75,000</td>
                        <td className="py-3">₹65,000</td>
                        <td className="py-3 font-semibold text-brand-teal-600 dark:text-brand-teal-400">Pro</td>
                      </tr>
                      <tr>
                        <td className="py-3">Mid-size Institute (100)</td>
                        <td className="py-3">₹2,50,000</td>
                        <td className="py-3">₹1,00,000</td>
                        <td className="py-3 font-semibold text-brand-teal-600 dark:text-brand-teal-400">Pro</td>
                      </tr>
                      <tr>
                        <td className="py-3">University Department (300)</td>
                        <td className="py-3">₹7,50,000</td>
                        <td className="py-3">₹2,00,000</td>
                        <td className="py-3 font-semibold text-brand-teal-600 dark:text-brand-teal-400">Pro</td>
                      </tr>
                      <tr>
                        <td className="py-3">Large University (500)</td>
                        <td className="py-3">₹12,50,000</td>
                        <td className="py-3">₹3,00,000</td>
                        <td className="py-3 font-semibold text-brand-teal-600 dark:text-brand-teal-400">Pro</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">What Your Institute Gets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuresGrid.map((feat, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <div className="w-12 h-12 bg-brand-teal-50 dark:bg-brand-teal-500/10 rounded-lg flex items-center justify-center mb-4 border border-brand-teal-100 dark:border-brand-teal-500/20">
                      <feat.icon className="w-6 h-6 text-brand-teal-600 dark:text-brand-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="max-w-3xl mx-auto pb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{faq.q}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}