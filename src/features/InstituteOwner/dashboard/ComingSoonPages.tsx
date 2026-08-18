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
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <InstituteOwnerSidebar
        activeTab={config.activeTab}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <InstituteOwnerTopbar />
        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 max-w-[90rem] mx-auto pb-16">

            {/* Hero section */}
            <div className="flex flex-col items-center justify-center text-center py-10 sm:py-12 px-4 max-w-md mx-auto">
              {/* Lock icon + phase badge */}
              <div className="relative mb-6">
                <div className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${config.accentColor} flex items-center justify-center shadow-sm`}>
                  <Lock className="h-9 w-9 text-white" />
                </div>
                <span className="absolute -top-2 -right-3 font-jetbrains text-[10px] font-bold tracking-[0.1em] uppercase bg-brand-teal-600 text-white px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                  {config.phase}
                </span>
              </div>

              {/* ETA badge */}
              <span className="font-jetbrains text-[10px] font-bold bg-brand-bg-alt border border-brand-line text-brand-text-mute px-3 py-1.5 rounded-full uppercase tracking-[0.15em] mb-4">
                ETA {config.eta}
              </span>

              {/* Title + subtitle */}
              <h1 className="font-manrope text-2xl sm:text-4xl font-black tracking-tight text-brand-text mb-3 w-full max-w-xl">
                {config.title}
              </h1>
              <p className="text-brand-text-mute text-sm sm:text-base w-full max-w-lg leading-relaxed">
                {config.subtitle}
              </p>
            </div>

            {/* Feature preview cards */}
            <div>
              <p className="text-center font-jetbrains text-[11px] font-bold text-brand-text-mute uppercase tracking-[0.2em] mb-5">
                What's coming
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl mx-auto">
                {config.features.map((f, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden bg-white border border-brand-line rounded-2xl shadow-sm p-5 flex flex-col gap-3 opacity-60 select-none"
                  >
                    {/* Blurred overlay to signal "not yet" */}
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] z-10 pointer-events-none rounded-2xl" />
                    <div className="h-9 w-9 rounded-xl bg-brand-bg-alt flex items-center justify-center text-brand-text-mute flex-shrink-0">
                      {f.icon}
                    </div>
                    <p className="font-semibold text-sm text-brand-text">{f.title}</p>
                    <p className="text-xs text-brand-text-mute leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-brand-text-mute pb-6 px-4 text-center">
              <span>More features are on the roadmap</span>
              <ChevronRight className="h-3 w-3" />
              <span>Stay tuned for updates</span>
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
    accentColor: 'from-brand-teal-500 to-brand-teal-700',
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
