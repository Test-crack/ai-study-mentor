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
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text">

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
          <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16 py-4 sm:py-8">

            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="font-jetbrains inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-teal-100 text-brand-teal-700 text-xs font-bold tracking-wider uppercase mb-2">
                <Building2 className="w-3.5 h-3.5" /> For Institutes &amp; Universities
              </div>
              <h1 className="font-manrope text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-brand-text tracking-tight leading-tight">
                Transform how Your Institute Delivers English Training
              </h1>
              <p className="text-base sm:text-lg text-brand-text-mute">
                AI-powered speech analytics, reading assessments, and institutional reporting — all in one platform.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">

              {/* Per Student Card */}
              <div className="bg-white rounded-2xl border border-brand-line p-6 sm:p-8 shadow-sm flex flex-col">
                <h3 className="font-manrope text-xl font-bold text-brand-text mb-2">Per Student</h3>
                <div className="flex flex-wrap items-end gap-1 mb-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-brand-text">₹2,500</span>
                  <span className="text-brand-text-mute text-sm mb-1">per student / month</span>
                </div>
                <p className="text-sm text-brand-text-mute mb-8 sm:h-10">
                  Perfect for small institutes and coaching centers getting started with AI-powered assessments.
                </p>
                <div className="space-y-4 mb-8 flex-1">
                  {perStudentFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-teal-600 shrink-0" />
                      <span className="text-sm text-brand-text">{feature}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3.5 px-4 min-h-[44px] bg-brand-bg-alt hover:bg-brand-teal-50 text-brand-text font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-brand-line">
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Institute Pro Card */}
              <div className="bg-white rounded-2xl border-2 border-brand-teal-600 p-6 sm:p-8 shadow-sm relative flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-teal-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5" /> Most Popular
                </div>
                <h3 className="font-manrope text-xl font-bold text-brand-text mb-2 mt-2">Institute Pro</h3>
                <div className="flex flex-wrap items-end gap-1 mb-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-brand-text">₹50,000</span>
                  <span className="text-brand-text-mute text-sm mb-1">/ month + ₹500 per student</span>
                </div>
                <p className="text-sm text-brand-text-mute mb-8 sm:h-10">
                  For universities and large training institutes needing org-wide analytics and white-label options.
                </p>
                <div className="space-y-4 mb-8 flex-1">
                  {proFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-teal-600 shrink-0" />
                      <span className="text-sm text-brand-text font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3.5 px-4 min-h-[44px] bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                  Contact Sales <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Cost Calculator */}
            <div className="bg-white rounded-2xl border border-brand-line p-4 sm:p-6 md:p-10 shadow-sm">
              <div className="mb-8">
                <h2 className="font-manrope text-xl sm:text-2xl font-bold text-brand-text">Cost Calculator</h2>
                <p className="text-brand-text-mute mt-1 text-sm sm:text-base">Slide to see which plan is best for your institute size.</p>
              </div>

              {/* Slider */}
              <div className="mb-10 sm:mb-12">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <label className="font-semibold text-brand-text">Number of Students</label>
                  <span className="bg-brand-teal-50 text-brand-teal-700 font-bold px-3 py-1 rounded-lg border border-brand-teal-100 tabular-nums">
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
                  className="w-full h-2 bg-brand-bg-alt rounded-lg appearance-none cursor-pointer accent-brand-teal-600"
                />
                <div className="font-jetbrains flex justify-between text-xs text-brand-text-mute mt-2 font-medium">
                  <span>10</span>
                  <span>250</span>
                  <span>500+</span>
                </div>
              </div>

              {/* Calculation Output */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
                <div className="bg-brand-bg-alt p-4 sm:p-6 rounded-xl border border-brand-line">
                  <p className="font-jetbrains text-xs font-bold text-brand-text-mute uppercase tracking-wider mb-2">Per Student Plan</p>
                  <p className="text-2xl font-bold text-brand-text tabular-nums">{formatCurrency(costPerStudentPlan)}</p>
                  <p className="text-xs text-brand-text-mute mt-1">/month</p>
                </div>

                <div className={`p-4 sm:p-6 rounded-xl border ${savings > 0 ? 'bg-brand-teal-50 border-brand-teal-200' : 'bg-brand-bg-alt border-brand-line'} relative`}>
                  {savings > 0 && (
                    <div className="absolute -top-3 left-4 bg-brand-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3" /> Best value for you
                    </div>
                  )}
                  <p className="font-jetbrains text-xs font-bold text-brand-text-mute uppercase tracking-wider mb-2">Institute Pro Plan</p>
                  <p className="text-2xl font-bold text-brand-text tabular-nums">{formatCurrency(costProPlan)}</p>
                  <p className="text-xs text-brand-text-mute mt-1">/month</p>
                </div>

                <div className="bg-emerald-50 p-4 sm:p-6 rounded-xl border border-emerald-200 flex flex-col justify-center sm:col-span-2 lg:col-span-1">
                  <p className="font-jetbrains text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">You Save</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">{savings > 0 ? formatCurrency(savings) : '₹0'}</p>
                  <p className="text-xs text-emerald-600/80 mt-1 font-medium">/month with Institute Pro</p>
                </div>
              </div>

              {/* Quick Reference Table */}
              <div>
                <h3 className="font-manrope text-sm font-bold text-brand-text mb-4">Quick Reference</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[520px]">
                    <thead className="font-jetbrains text-[11px] text-brand-text-mute uppercase tracking-wider border-b border-brand-line">
                      <tr>
                        <th className="pb-3 font-semibold">Institute Size</th>
                        <th className="pb-3 font-semibold">Per Student</th>
                        <th className="pb-3 font-semibold">Pro Plan</th>
                        <th className="pb-3 font-semibold">Best</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line text-brand-text">
                      <tr>
                        <td className="py-3">Small Coaching Center (30)</td>
                        <td className="py-3 tabular-nums">₹75,000</td>
                        <td className="py-3 tabular-nums">₹65,000</td>
                        <td className="py-3 font-semibold text-brand-teal-600">Pro</td>
                      </tr>
                      <tr>
                        <td className="py-3">Mid-size Institute (100)</td>
                        <td className="py-3 tabular-nums">₹2,50,000</td>
                        <td className="py-3 tabular-nums">₹1,00,000</td>
                        <td className="py-3 font-semibold text-brand-teal-600">Pro</td>
                      </tr>
                      <tr>
                        <td className="py-3">University Department (300)</td>
                        <td className="py-3 tabular-nums">₹7,50,000</td>
                        <td className="py-3 tabular-nums">₹2,00,000</td>
                        <td className="py-3 font-semibold text-brand-teal-600">Pro</td>
                      </tr>
                      <tr>
                        <td className="py-3">Large University (500)</td>
                        <td className="py-3 tabular-nums">₹12,50,000</td>
                        <td className="py-3 tabular-nums">₹3,00,000</td>
                        <td className="py-3 font-semibold text-brand-teal-600">Pro</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div>
              <h2 className="font-manrope text-xl sm:text-2xl font-bold text-brand-text mb-6 sm:mb-8 text-center">What Your Institute Gets</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {featuresGrid.map((feat, idx) => (
                  <div key={idx} className="bg-white p-5 sm:p-6 rounded-xl border border-brand-line shadow-sm">
                    <div className="w-12 h-12 bg-brand-teal-50 rounded-lg flex items-center justify-center mb-4 border border-brand-teal-100">
                      <feat.icon className="w-6 h-6 text-brand-teal-600" />
                    </div>
                    <h3 className="font-manrope text-lg font-bold text-brand-text mb-2">{feat.title}</h3>
                    <p className="text-sm text-brand-text-mute leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="max-w-3xl mx-auto pb-12">
              <h2 className="font-manrope text-xl sm:text-2xl font-bold text-brand-text mb-6 sm:mb-8 text-center">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white p-5 sm:p-6 rounded-xl border border-brand-line shadow-sm">
                    <h3 className="font-manrope font-bold text-brand-text mb-2 text-base">{faq.q}</h3>
                    <p className="text-sm text-brand-text-mute leading-relaxed">{faq.a}</p>
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
