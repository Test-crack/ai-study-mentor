import { useState } from 'react';
import { Lock, TrendingUp, ClipboardCheck, Cpu, ChevronRight } from 'lucide-react';
import { InstituteOwnerSidebar } from '../components/InstitiuteOwnerSidebar';
import { InstituteOwnerTopbar } from '../components/InstituteOwnerTopbar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturePreview {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ComingSoonConfig {
  activeTab: string;
  phase: string;
  eta: string;
  title: string;
  subtitle: string;
  accentColor: string;
  features: FeaturePreview[];
}

// ─── Shared Coming Soon Tab ───────────────────────────────────────────────────

function ComingSoonTab({ config }: { config: ComingSoonConfig }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0a] font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <div className="hidden lg:block">
        <InstituteOwnerSidebar
          activeTab={config.activeTab}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <InstituteOwnerTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-8">

            {/* Hero section */}
            <div className="flex flex-col items-center justify-center text-center py-12 px-4">
              {/* Lock icon + phase badge */}
              <div className="relative mb-6">
                <div className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${config.accentColor} flex items-center justify-center shadow-xl`}>
                  <Lock className="h-9 w-9 text-white" />
                </div>
                <span className="absolute -top-2 -right-3 text-xs font-bold bg-brand-teal-600 text-white px-2.5 py-1 rounded-full shadow-md whitespace-nowrap">
                  {config.phase}
                </span>
              </div>

              {/* ETA badge */}
              <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full uppercase tracking-widest mb-4">
                ETA {config.eta}
              </span>

              {/* Title + subtitle */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 max-w-xl">
                {config.title}
              </h1>
              <p className="text-slate-500 dark:text-gray-400 text-base max-w-lg leading-relaxed">
                {config.subtitle}
              </p>
            </div>

            {/* Feature preview cards */}
            <div>
              <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
                What's coming
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {config.features.map((f, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden bg-white dark:bg-[#121214] border border-slate-200 dark:border-[#27272a] rounded-xl shadow-sm p-5 flex flex-col gap-3 opacity-60 select-none"
                  >
                    {/* Blurred overlay to signal "not yet" */}
                    <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[1px] z-10 pointer-events-none rounded-xl" />
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 flex-shrink-0">
                      {f.icon}
                    </div>
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">{f.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-600 pb-6">
              <span>More features are on the roadmap</span>
              <ChevronRight className="h-3 w-3" />
              <span>Stay tuned for updates</span>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// ─── ROI Analytics Page ───────────────────────────────────────────────────────

export function RoiAnalyticsPage() {
  const config: ComingSoonConfig = {
    activeTab: 'roi',
    phase: 'Phase 3',
    eta: 'Q3 2026',
    title: 'Financial Dashboard',
    subtitle:
      'Track revenue per student, cohort ROI, cost-per-result, and subscription health — all in one place.',
    accentColor: 'from-emerald-500 to-teal-600',
    features: [
      {
        title: 'Revenue per Student',
        description: 'Understand which batches and exam types generate the highest return.',
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        title: 'Cost per Band Point',
        description: 'Measure instructional efficiency by linking spend to outcome improvements.',
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        title: 'Subscription Health',
        description: 'Renewal forecasts, churn indicators, and cohort lifetime value.',
        icon: <TrendingUp className="h-4 w-4" />,
      },
    ],
  };
  return <ComingSoonTab config={config} />;
}

// ─── Strategic Reports Page ───────────────────────────────────────────────────

export function StrategicReportPage() {
  const config: ComingSoonConfig = {
    activeTab: 'strategic-reports',
    phase: 'Phase 3',
    eta: 'Q3 2026',
    title: 'Strategic Reports',
    subtitle:
      'Downloadable PDF reports, board-level summaries, and trend narratives to share with stakeholders.',
    accentColor: 'from-brand-teal-500 to-brand-blue-600',
    features: [
      {
        title: 'Monthly Board Report',
        description: 'Auto-generated PDF covering KPIs, risk flags, and outcome trends.',
        icon: <ClipboardCheck className="h-4 w-4" />,
      },
      {
        title: 'Batch Comparison Report',
        description: 'Side-by-side analysis of multiple batches for strategic planning.',
        icon: <ClipboardCheck className="h-4 w-4" />,
      },
      {
        title: 'Outcome Narrative',
        description: 'AI-written natural language summaries of your institute\'s progress.',
        icon: <ClipboardCheck className="h-4 w-4" />,
      },
    ],
  };
  return <ComingSoonTab config={config} />;
}

// ─── AI Calibration Page ──────────────────────────────────────────────────────

export function AiCalibrationPage() {
  const config: ComingSoonConfig = {
    activeTab: 'calibration',
    phase: 'Phase 4',
    eta: 'Q4 2026',
    title: 'AI Calibration & Marketing',
    subtitle:
      'Tune the AI tutor for your teaching methodology, branding, and target student profiles.',
    accentColor: 'from-brand-blue-500 to-brand-blue-700',
    features: [
      {
        title: 'Custom Drill Weighting',
        description: 'Adjust sub-skill focus areas to align with your curriculum priorities.',
        icon: <Cpu className="h-4 w-4" />,
      },
      {
        title: 'Brand Voice Settings',
        description: 'Configure the AI feedback tone and language to match your institute identity.',
        icon: <Cpu className="h-4 w-4" />,
      },
      {
        title: 'Marketing Insights',
        description: 'Export anonymised outcome data for testimonials and campaign materials.',
        icon: <Cpu className="h-4 w-4" />,
      },
    ],
  };
  return <ComingSoonTab config={config} />;
}
