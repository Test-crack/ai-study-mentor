import { Fragment, useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

import testcrackLogo from '@/assets/testcrack-logo.svg';
import LanguageToggle from './LanguageToggle';
import { useLandingLanguage } from '../hooks/useLandingLanguage';
import '../styles/landingMalayalam.css';
import {
  GraduationCap,
  Zap,
  User,
  Target,
  Cpu,
  FileBarChart,
  LayoutDashboard,
  Sparkles,
  Users,
  Building2,
  MonitorPlay,
  LineChart,
  MessageSquareText,
  AlertTriangle,
  ShieldCheck,
  UserRound,
  X,
  Mail,
  Globe,
  MapPin,
  Linkedin,
  Instagram,
  Youtube,
  Phone,
} from 'lucide-react';

import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Hourglass from 'lucide-react/dist/esm/icons/hourglass';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';

import Mic from 'lucide-react/dist/esm/icons/mic';
import Laptop from 'lucide-react/dist/esm/icons/laptop';
import Flame from 'lucide-react/dist/esm/icons/flame';
import Play from 'lucide-react/dist/esm/icons/play';

const DEMO_WHATSAPP_NUMBER = '919995684689';

/**
 * Hero metric strip.
 *
 * ⚠️ TODO(marketing): these are PLACEHOLDER figures taken from the design mock.
 * They are outcome claims about real institutes and are NOT sourced from the
 * platform. Replace with verified numbers or delete the strip before shipping —
 * unlike the Band 5.5 / 7.5 values, these sit outside a product mockup and read
 * as factual claims.
 */
const HERO_METRICS = [
  { key: 'bandLift', value: '+2.0', accent: false },
  { key: 'institutesLive', value: '18', accent: false },
  { key: 'streakRetention', value: '92%', accent: true },
] as const;

/**
 * Non-text parts of the page, keyed to match src/features/home/i18n/landingCopy.ts.
 * Icons, links, and statuses live here so English and Malayalam can never drift
 * apart on where a link points or which icon a card gets — the copy file holds
 * text and nothing else.
 */
const TAB_ICONS = {
  students: [Target, Zap, Cpu, LineChart],
  instructors: [AlertTriangle, LineChart, Users, MessageSquareText],
  institutes: [LayoutDashboard, FileBarChart, ShieldCheck, Building2],
} as const;

const TAB_IDS = ['students', 'instructors', 'institutes'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_NAV_ICONS: Record<TabId, typeof GraduationCap> = {
  students: GraduationCap,
  instructors: Users,
  institutes: Building2,
};

const TOOL_META = [
  { icon: Target, status: 'LIVE' },
  { icon: Zap, status: 'LIVE' },
  { icon: Cpu, status: 'LIVE' },
  { icon: Laptop, status: 'LIVE' },
  { icon: Mic, status: 'LIVE' },
  { icon: LayoutDashboard, status: 'BETA' },
] as const;

const SKILL_KEYS = ['listening', 'reading', 'writing', 'speaking'] as const;

const HOW_IT_WORKS_META = [
  { step: '01', icon: Target },
  { step: '02', icon: Flame },
  { step: '03', icon: LineChart },
] as const;

const CTA_PILL_ICONS = { onboarding: Zap, outreach: MessageSquareText } as const;

/**
 * Footer link targets. Labels come from the copy file, matched by these keys.
 */
const FOOTER_SECTIONS = [
  {
    key: 'platform',
    links: [
      { key: 'diagnosticAssessment', href: '#' },
      { key: 'dailyDrillEngine', href: '#' },
      { key: 'lexigrid', href: '#' },
      { key: 'adaptiveAssessments', href: '#' },
      { key: 'mockTests', href: '#' },
      { key: 'aiScoring', href: '#' },
    ],
  },
  {
    key: 'institutes',
    links: [
      { key: 'commandCenter', href: '#' },
      { key: 'tutorDashboards', href: '#' },
      { key: 'batchReports', href: '#' },
      { key: 'atRiskDetection', href: '#' },
      { key: 'pilotOnboarding', href: '#' },
      { key: 'viewDemo', href: '/dashdemo' },
    ],
  },
  {
    key: 'company',
    links: [
      { key: 'about', href: '#' },
      { key: 'forStudents', href: '#' },
      { key: 'forTutors', href: '#' },
      { key: 'forInstitutes', href: '#' },
      { key: 'requestDemo', href: '#', isDemo: true },
    ],
  },
] as const;

const DEMO_FIELDS = [
  { field: 'name', type: 'text' },
  { field: 'institute', type: 'text' },
  { field: 'city', type: 'text' },
  { field: 'whatsapp', type: 'tel' },
  { field: 'email', type: 'email' },
] as const;

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { lang, setLang, copy } = useLandingLanguage();
  const [processingAuth, setProcessingAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('students');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    institute: '',
    city: '',
    whatsapp: '',
    email: '',
  });

  const handleDemoField = (field: keyof typeof demoForm, value: string) => {
    setDemoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDemoSubmit = () => {
    if (!demoForm.name.trim() || !demoForm.institute.trim() || !demoForm.whatsapp.trim()) return;
    const message = encodeURIComponent(
      `Hi TestCrack team! I'd like to request a demo.\n\nName: ${demoForm.name}\nInstitute: ${demoForm.institute}\nCity: ${demoForm.city || '-'}\nWhatsApp: ${demoForm.whatsapp}\nEmail: ${demoForm.email || '-'}`
    );
    window.open(`https://wa.me/${DEMO_WHATSAPP_NUMBER}?text=${message}`, '_blank');
    setDemoSubmitted(true);
  };

  const closeDemoModal = () => {
    setDemoModalOpen(false);
    setDemoSubmitted(false);
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes("access_token")) return;
      setProcessingAuth(true);
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (!accessToken) { setProcessingAuth(false); return; }
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });
        if (error) { navigate("/login?error=invalid_token"); return; }
        window.history.replaceState(null, "", window.location.pathname);
        if (type === "recovery") navigate("/reset-password", { replace: true });
        else if (type === "signup" || type === "magiclink" || type === "email") navigate("/profile?welcome=true", { replace: true });
        else if (data.session) navigate("/dashboard", { replace: true });
      } catch (err) {
        setProcessingAuth(false);
      }
    };
    handleAuthCallback();
  }, [navigate]);

  // Animates the hero's "+2.0" band-lift badge up from 0 on mount, so the
  // improvement reads as something that happened rather than a static label.
  const [bandLift, setBandLift] = useState(0);
  useEffect(() => {
    const target = 2.0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBandLift(target);
      return;
    }
    let raf: number;
    let cancelled = false;
    const runCountUp = () => {
      const duration = 1200;
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setBandLift(eased * target);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    // rAF is throttled to near-zero on background/prerendered tabs — if the
    // page loads hidden, wait for it to become visible before counting up.
    if (document.hidden) {
      const onVisible = () => {
        if (!document.hidden) {
          document.removeEventListener('visibilitychange', onVisible);
          runCountUp();
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        cancelled = true;
        document.removeEventListener('visibilitychange', onVisible);
        cancelAnimationFrame(raf);
      };
    }
    runCountUp();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  if (processingAuth) {
    return (
      <div className="min-h-screen bg-brand-teal-wash flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto"></div>
          <p className="text-brand-text-mute">{copy.authProcessing}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      lang={lang}
      data-landing-lang={lang}
      className="min-h-screen bg-white font-plex text-brand-text antialiased"
    >

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-ink border-b border-brand-line-12 transform-gpu">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center space-x-2">
              <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
              <span className="font-manrope text-xl font-extrabold tracking-[-0.03em] text-brand-bg">TestCrack</span>
            </div>
            <LanguageToggle value={lang} onChange={setLang} groupLabel={copy.nav.languageGroupLabel} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-ink-deep pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Faint blueprint grid + a single soft glow, per the approved mock */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #2EE8A6 1px, transparent 1px), linear-gradient(to bottom, #2EE8A6 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-1/3 h-[460px] w-[460px] rounded-full bg-brand-teal opacity-20 blur-[150px]"
        />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-16 items-center">

            {/* LEFT — copy */}
            <div className="text-left">
              <div className="flex items-center gap-3 mb-7">
                <span className="h-px w-7 shrink-0 bg-brand-mint" aria-hidden="true" />
                <span className="font-jetbrains text-[11px] uppercase tracking-[0.2em] text-brand-mint">
                  {copy.hero.eyebrow}
                </span>
              </div>

              {/* Static headline, matching the approved mock. Renders on first
                  paint with no reserved-height trick and no layout shift. */}
              <h1 className="font-manrope text-[40px] sm:text-[52px] xl:text-[64px] font-extrabold leading-[1.04] tracking-[-0.03em] text-white mb-6">
                {copy.hero.headline}{' '}
                <span className="text-brand-mint">{copy.hero.headlineAccent}</span>
              </h1>

              <p className="max-w-[540px] text-[16.5px] leading-[1.75] text-brand-on-ink mb-9">
                {copy.hero.subhead}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={() => setDemoModalOpen(true)}
                  className="group h-auto rounded-md border-none bg-brand-teal px-6 py-3 text-[14.5px] font-semibold text-white shadow-none transition-colors duration-150 hover:bg-brand-teal-dark active:scale-95"
                >
                  {copy.hero.requestDemo}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashdemo')}
                  className="h-auto rounded-md border border-brand-line-25 bg-transparent px-6 py-3 text-[14.5px] font-semibold text-brand-bg shadow-none transition-colors duration-150 hover:border-brand-line-60 hover:bg-brand-wash-06 active:scale-95"
                >
                  <Play className="mr-2 h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  {copy.hero.viewDemo}
                </Button>
              </div>

              {/* Metric strip — see HERO_METRICS: values are placeholders, not verified figures */}
              <div className="mt-12 max-w-[560px] border-t border-brand-line-14 pt-7">
                <dl className="grid grid-cols-3 gap-px bg-brand-line-14">
                  {HERO_METRICS.map((metric) => (
                    <div key={metric.key} className="bg-brand-ink-deep px-4 first:pl-0">
                      <dd className={`font-jetbrains text-[24px] font-bold tracking-[-0.02em] ${metric.accent ? 'text-brand-mint' : 'text-white'}`}>
                        {metric.value}
                      </dd>
                      <dt className="mt-1.5 text-[12.5px] text-brand-on-ink-mute">{copy.hero.metrics[metric.key]}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* RIGHT — explicit before/after comparison. Diagnostic and Real Band sit
                side by side at every breakpoint; the middle column is a slim connector
                (engine badge + drifting arrow + a count-up "+X.X" delta) so the
                improvement reads as a fact, not something inferred from colour. */}
            <div className="relative rounded-2xl border border-brand-line-16 bg-brand-ink/60 backdrop-blur-sm px-4 py-8 sm:px-8 sm:py-10 lg:justify-self-end lg:w-[94%] lg:translate-x-3 xl:translate-x-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">

                {/* Before */}
                <div className="flex flex-col items-center gap-2.5 sm:gap-3 text-center">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-white/95 border border-brand-teal-300/25">
                    <User className="h-7 w-7 sm:h-8 sm:w-8 text-brand-teal-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-jetbrains text-[9px] sm:text-[10.5px] uppercase tracking-[0.14em] text-brand-teal-300">{copy.hero.diagnosticLabel}</p>
                    <p className="mt-1 font-jetbrains text-[15px] sm:text-[18px] font-bold text-white whitespace-nowrap">{copy.hero.diagnosticBand}</p>
                  </div>
                </div>

                {/* Connector: engine badge, drifting arrow, count-up delta */}
                <div className="flex flex-col items-center gap-2 px-0.5 sm:px-2">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-teal to-brand-warm opacity-40 blur-md animate-pulse" aria-hidden="true" />
                    <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br from-brand-ink-deep via-brand-teal to-brand-warm shadow-xl">
                      <Cpu className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-[spin_10s_linear_infinite]" aria-hidden="true" />
                    </div>
                  </div>
                  <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-warm animate-arrow-drift" aria-hidden="true" />
                  <span className="rounded-full border border-brand-warm/30 bg-brand-warm/10 px-2 sm:px-2.5 py-0.5 sm:py-1 font-jetbrains text-[11px] sm:text-[13px] font-bold text-brand-warm whitespace-nowrap">
                    +{bandLift.toFixed(1)}
                  </span>
                </div>

                {/* After */}
                <div className="flex flex-col items-center gap-2.5 sm:gap-3 text-center">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-white/95 border border-brand-warm/25">
                    <User className="h-7 w-7 sm:h-8 sm:w-8 text-brand-warm" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-jetbrains text-[9px] sm:text-[10.5px] uppercase tracking-[0.14em] text-brand-warm">{copy.hero.realBandLabel}</p>
                    <p className="mt-1 font-jetbrains text-[15px] sm:text-[18px] font-bold text-white whitespace-nowrap">{copy.hero.realBand}</p>
                  </div>
                </div>

              </div>
              <p className="mt-6 sm:mt-7 text-center font-jetbrains text-[10px] sm:text-[10.5px] uppercase tracking-[0.16em] text-brand-on-ink-mute">
                {copy.hero.engineCaption}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-bg relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">{copy.pains.eyebrow}</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-6 leading-[1.1] tracking-[-0.04em]">
              {copy.pains.headline} <span className="text-brand-teal">{copy.pains.headlineAccent}</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-3xl mx-auto leading-[1.7]">
              {copy.pains.subhead}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
            {[
              { icon: TrendingDown, iconWrap: 'bg-brand-warm-tint', iconColor: 'text-brand-warm' },
              { icon: Hourglass, iconWrap: 'bg-brand-blue-tint', iconColor: 'text-brand-blue' },
              { icon: RefreshCw, iconWrap: 'bg-brand-bg-alt', iconColor: 'text-brand-ink' },
            ].map((meta, idx) => (
              <Fragment key={idx}>
                {idx > 0 && (
                  <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal text-white shrink-0 z-20 -mx-4" aria-hidden="true">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
                <Card className="flex-1 w-full bg-white border border-brand-line rounded-none shadow-none transform-gpu z-10 group">
                  <CardContent className="p-8">
                    <div className={`p-3 ${meta.iconWrap} rounded-[4px] w-fit mb-6`} aria-hidden="true">
                      <meta.icon className={`h-6 w-6 ${meta.iconColor}`} />
                    </div>
                    <h3 className="font-manrope text-[22px] font-bold text-brand-ink mb-3 leading-tight tracking-[-0.02em]">{copy.pains.cards[idx].title}</h3>
                    <p className="text-brand-text-mute text-[15px] leading-[1.7]">{copy.pains.cards[idx].description}</p>
                  </CardContent>
                </Card>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mb-4 leading-[1.1] tracking-[-0.04em]">{copy.features.headline}</h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-2xl mx-auto leading-[1.7]">{copy.features.subhead}</p>
          </div>
          <div className="flex flex-col items-center gap-8 sm:gap-12 mb-12 px-2">
            <div className="inline-flex p-1 bg-brand-bg-alt rounded-md border border-brand-line max-w-full transform-gpu" role="tablist" aria-label={copy.features.tablistLabel}>
              {TAB_IDS.map((tabId) => {
                const TabIcon = TAB_NAV_ICONS[tabId];
                return (
                  <button
                    key={tabId}
                    id={`tab-${tabId}`}
                    role="tab"
                    aria-selected={activeTab === tabId}
                    aria-controls={`panel-${tabId}`}
                    onClick={() => setActiveTab(tabId)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-[4px] text-[11px] sm:text-[14.5px] font-semibold transition-colors duration-150 whitespace-nowrap ${
                      activeTab === tabId ? "bg-brand-teal text-white" : "text-brand-text-mute hover:text-brand-teal"
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
                    {copy.features.tabs[tabId]}
                  </button>
                );
              })}
            </div>
            <div 
              id={`panel-${activeTab}`} 
              role="tabpanel" 
              aria-labelledby={`tab-${activeTab}`} 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl"
            >
              {copy.features[activeTab].map((item, idx) => {
                const ItemIcon = TAB_ICONS[activeTab][idx];
                return (
                  <Card
                    key={`${activeTab}-${idx}`}
                    className="group relative overflow-hidden border border-brand-line bg-white rounded-none shadow-none animate-in fade-in slide-in-from-bottom-3 transform-gpu"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <CardContent className="p-6 text-left relative z-10">
                      <div className="p-2.5 bg-brand-teal-wash rounded-[4px] w-fit mb-4" aria-hidden="true">
                        <ItemIcon className="h-5 w-5 text-brand-teal" />
                      </div>
                      <h4 className="font-manrope text-[17px] font-bold text-brand-ink mb-2 tracking-[-0.02em]">{item.title}</h4>
                      <p className="text-brand-text-mute text-[14.5px] leading-[1.7]">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-brand-bg-alt relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">{copy.tools.eyebrow}</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-6 leading-[1.1] tracking-[-0.04em]">
              {copy.tools.headline} <span className="text-brand-teal">{copy.tools.headlineAccent}</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-3xl mx-auto leading-[1.7]">{copy.tools.subhead}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-line border border-brand-line">
            {TOOL_META.map((meta, index) => (
              <Card key={index} className="border-0 bg-white rounded-none shadow-none transform-gpu flex flex-col h-full">
                <CardContent className="p-8 flex flex-col h-full relative">
                  <div className="p-3 bg-brand-teal-wash rounded-[4px] w-fit mb-6" aria-hidden="true">
                    <meta.icon className="h-6 w-6 text-brand-teal" />
                  </div>
                  <h3 className="font-manrope text-[20px] font-bold text-brand-ink mb-4 tracking-[-0.02em]">{copy.tools.items[index].title}</h3>
                  <p className="text-brand-text-mute text-[14.5px] leading-[1.7] mb-8 flex-grow">{copy.tools.items[index].description}</p>
                  <div className="mt-auto">
                    <Badge
                      variant="secondary"
                      className={`px-3 py-1 font-jetbrains text-[10.5px] font-normal tracking-[0.14em] uppercase rounded-[4px] border ${
                        meta.status === 'LIVE'
                          ? 'bg-brand-teal-wash text-brand-teal border-brand-teal-tint hover:bg-brand-teal-wash'
                          : 'bg-brand-warm-tint text-brand-warm border-[#F7D9C7] hover:bg-brand-warm-tint'
                      }`}
                    >
                      {meta.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Common Ground Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 mb-6 w-fit font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.engines.eyebrow}
              </div>
              <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink leading-[1.1] tracking-[-0.04em] mb-6">
                {copy.engines.headline} <br />
                <span className="text-brand-teal">{copy.engines.headlineAccent}</span>
              </h2>
              <p className="text-brand-text-mute text-[18px] leading-[1.7] max-w-xl">
                {copy.engines.bodyBefore}
                <span className="text-brand-teal font-semibold">{copy.engines.bodyHighlight}</span>
                {copy.engines.bodyAfter}
              </p>
              <div className="mt-8 flex items-center gap-3 text-[13px] text-brand-text-mute">
                <ShieldCheck className="h-5 w-5 text-brand-teal shrink-0" aria-hidden="true" />
                {copy.engines.note}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-brand-line border border-brand-line">
              {SKILL_KEYS.map((key) => (
                <div key={key} className="p-6 bg-white transform-gpu">
                  <h3 className="font-manrope text-[20px] font-bold text-brand-ink tracking-[-0.02em]">{copy.engines.skills[key].name}</h3>
                  <p className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.14em] mt-1">{copy.engines.skills[key].level}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-brand-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-transparent text-brand-teal hover:bg-transparent border-none px-0 py-1 rounded-none font-jetbrains text-[11px] font-normal uppercase tracking-[0.18em]">
              {copy.howItWorks.badge}
            </Badge>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mb-6 leading-[1.1] tracking-[-0.04em]">
              {copy.howItWorks.headline} <span className="text-brand-teal">{copy.howItWorks.headlineAccent}</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-2xl mx-auto leading-[1.7]">
              {copy.howItWorks.subhead}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {HOW_IT_WORKS_META.map((meta, index) => (
              <div key={index} className="relative group">
                <Card className="h-full bg-white border border-brand-line rounded-none shadow-none transform-gpu">
                  <CardContent className="p-8 pt-12 flex flex-col items-center text-center">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-md bg-brand-teal flex items-center justify-center text-white font-jetbrains text-xl font-bold z-20" aria-hidden="true">
                      {meta.step}
                    </div>
                    <div className="mb-6 p-4 rounded-[4px] bg-brand-teal-wash text-brand-teal" aria-hidden="true">
                      <meta.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-manrope text-[20px] font-bold text-brand-ink mb-4 tracking-[-0.02em]">{copy.howItWorks.steps[index].title}</h3>
                    <p className="text-brand-text-mute text-[14.5px] leading-[1.7]">{copy.howItWorks.steps[index].description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          <div className="mt-20 text-center">
            <p className="font-jetbrains text-brand-text-mute text-[12px] uppercase tracking-[0.14em] flex items-center justify-center gap-2">
              <span className="h-4 w-4 text-brand-teal" aria-hidden="true" />
              {copy.howItWorks.footnote}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-brand-ink relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <Card className="border border-brand-line-16 bg-transparent rounded-none shadow-none overflow-hidden py-12 transform-gpu">
            <CardContent className="text-center space-y-8">
              <div className="space-y-4">
                <Badge className="bg-transparent text-brand-teal-soft hover:bg-transparent border-none px-0 py-1 rounded-none font-jetbrains text-[11px] font-normal uppercase tracking-[0.18em]">
                  {copy.cta.badge}
                </Badge>
                <h2 className="font-manrope text-4xl sm:text-6xl font-extrabold text-brand-bg leading-[1.05] tracking-[-0.04em]">
                  {copy.cta.headline} <br />
                  <span className="text-brand-teal-soft">{copy.cta.headlineAccent}</span>
                </h2>
                <p className="text-[18px] text-brand-on-ink max-w-2xl mx-auto leading-[1.7]">
                  {copy.cta.subhead}
                </p>
              </div>
              <div className="flex flex-col items-center gap-6">
                <Button size="lg" onClick={() => setDemoModalOpen(true)} className="px-7 py-[15px] h-auto rounded-md bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-[15.5px] transition-colors duration-150 active:scale-95 border-none">
                  <MessageSquareText className="mr-2 h-5 w-5" aria-hidden="true" />
                  {copy.cta.requestDemo}
                </Button>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                  {(['onboarding', 'outreach'] as const).map((pill) => {
                    const PillIcon = CTA_PILL_ICONS[pill];
                    return (
                      <div key={pill} className="flex items-center gap-2 text-brand-on-ink-mute text-[13px]">
                        <PillIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {copy.cta.pills[pill]}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative">

          <div className="text-center mb-14">
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">{copy.contact.eyebrow}</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-4 leading-[1.1] tracking-[-0.04em]">
              {copy.contact.headline} <span className="text-brand-teal">{copy.contact.headlineAccent}</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-xl mx-auto leading-[1.7]">
              {copy.contact.subhead}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">

            {/* Email card */}
            <a
              href="mailto:officialtestcrack@gmail.com"
              className="group flex items-start gap-5 p-7 border border-brand-line bg-white hover:border-brand-teal transition-colors duration-150"
            >
              <div className="p-3.5 rounded-[4px] bg-brand-teal-wash shrink-0" aria-hidden="true">
                <Mail className="h-6 w-6 text-brand-teal" />
              </div>
              <div>
                <p className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.16em] mb-1">{copy.contact.emailLabel}</p>
                <p className="font-manrope text-[17px] font-bold text-brand-ink break-all">
                  officialtestcrack@gmail.com
                </p>
                <p className="text-[14.5px] text-brand-text-mute mt-1.5 leading-[1.7]">
                  {copy.contact.emailNote}
                </p>
              </div>
            </a>

            {/* WhatsApp card */}
            <a
              href="https://wa.me/919995684689"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-5 p-7 border border-brand-line bg-white hover:border-brand-teal transition-colors duration-150"
            >
              <div className="p-3.5 rounded-[4px] bg-emerald-50 shrink-0" aria-hidden="true">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.16em] mb-1">{copy.contact.whatsappLabel}</p>
                <p className="font-manrope text-[17px] font-bold text-brand-ink">
                  +91 99956 84689
                </p>
                <p className="text-[14.5px] text-brand-text-mute mt-1.5 leading-[1.7]">
                  {copy.contact.whatsappNote}
                </p>
              </div>
            </a>

          </div>

          {/* CTA nudge */}
          <div className="mt-10 text-center">
            <Button
              onClick={() => setDemoModalOpen(true)}
              className="px-7 py-[15px] h-auto rounded-md bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-[15.5px] transition-colors duration-150 active:scale-95 border-none"
            >
              <MessageSquareText className="mr-2 h-4 w-4" aria-hidden="true" />
              {copy.contact.formNudge}
            </Button>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-brand-ink-deep text-brand-on-ink">

        {/* Main footer grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Brand column — spans 2 cols on large screens */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Logo + name */}
              <div className="flex items-center space-x-3">
                <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
                <div>
                  <span className="font-manrope text-[18px] font-extrabold tracking-[-0.03em] text-brand-bg">TestCrack</span>
                  <span className="block font-jetbrains text-[10.5px] text-brand-teal-soft tracking-[0.16em] uppercase">{copy.footer.tagline}</span>
                </div>
              </div>

              {/* Short description */}
              <p className="text-[14px] text-brand-on-ink leading-[1.65] max-w-sm">
                {copy.footer.description}
              </p>

              {/* Contact info */}
              <div className="flex flex-col gap-3">
                <a href="mailto:officialtestcrack@gmail.com" className="flex items-center gap-3 text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 group">
                  <div className="w-7 h-7 rounded-[4px] bg-brand-ink border border-white/10 flex items-center justify-center group-hover:bg-brand-teal group-hover:border-brand-teal-dark transition-all" aria-hidden="true">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  officialtestcrack@gmail.com
                </a>
                <a href="https://wa.me/919995684689" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 group">
                  <div className="w-7 h-7 rounded-[4px] bg-brand-ink border border-white/10 flex items-center justify-center group-hover:bg-brand-teal group-hover:border-brand-teal-dark transition-all" aria-hidden="true">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  +91 99956 84689
                </a>
                <a href="https://testcrack.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 group">
                  <div className="w-7 h-7 rounded-[4px] bg-brand-ink border border-white/10 flex items-center justify-center group-hover:bg-brand-teal group-hover:border-brand-teal-dark transition-all" aria-hidden="true">
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                  testcrack.com
                </a>
                <div className="flex items-center gap-3 text-[14px] text-brand-on-ink">
                  <div className="w-7 h-7 rounded-[4px] bg-brand-ink border border-white/10 flex items-center justify-center" aria-hidden="true">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  {copy.footer.location}
                </div>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-3 pt-1">
                <a href="https://www.linkedin.com/in/test-crack-aa92203b0/" target="_blank" rel="noopener noreferrer" aria-label="Visit TestCrack on LinkedIn"
                  className="w-9 h-9 rounded-[4px] bg-brand-ink border border-white/10 flex items-center justify-center text-brand-on-ink hover:bg-brand-teal hover:border-brand-teal-dark hover:text-white transition-all">
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="https://www.instagram.com/testcrackforinstitutes/" target="_blank" rel="noopener noreferrer" aria-label="Visit TestCrack on Instagram"
                  className="w-9 h-9 rounded-[4px] bg-brand-ink border border-white/10 flex items-center justify-center text-brand-on-ink hover:bg-brand-teal hover:border-brand-teal-dark hover:text-white transition-all">
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="https://www.youtube.com/@TESTCRACK-1" target="_blank" rel="noopener noreferrer" aria-label="Visit TestCrack on YouTube"
                  className="w-9 h-9 rounded-[4px] bg-brand-ink border border-white/10 flex items-center justify-center text-brand-on-ink hover:bg-brand-teal hover:border-brand-teal-dark hover:text-white transition-all">
                  <Youtube className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Links columns */}
            {FOOTER_SECTIONS.map((section) => {
              const column = copy.footer.columns[section.key];
              return (
                <div key={section.key} className="flex flex-col gap-5">
                  <h4 className="font-jetbrains text-[10.5px] text-brand-teal-soft uppercase tracking-[0.16em]">{column.heading}</h4>
                  <ul className="flex flex-col gap-3">
                    {section.links.map((link) => {
                      const label = (column.links as Record<string, string>)[link.key];
                      return (
                        <li key={link.key}>
                          {'isDemo' in link && link.isDemo ? (
                            <button
                              onClick={() => setDemoModalOpen(true)}
                              className="text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 text-left flex items-center gap-1.5 group"
                            >
                              <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                              {label}
                            </button>
                          ) : (
                            <a
                              href={link.href}
                              className="text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 flex items-center gap-1.5 group"
                            >
                              <span className="w-1 h-1 shrink-0 rounded-full bg-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                              {label}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Copyright */}
            <p className="text-[13px] text-brand-on-ink-mute text-center sm:text-left">
              {copy.footer.copyright}
            </p>

            {/* Status badges */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#0C2E2A] border border-[#12463F] font-jetbrains text-[10.5px] text-brand-teal-soft uppercase tracking-[0.14em]">
                <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-brand-teal-soft animate-pulse" aria-hidden="true" />
                {copy.footer.badges.platformLive}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#12283A] border border-[#1D3A50] font-jetbrains text-[10.5px] text-brand-on-ink uppercase tracking-[0.14em]">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                {copy.footer.badges.keralaFirst}
              </span>
            </div>

          </div>
        </div>

      </footer>

      {/* Demo Request Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-brand-ink/70" onClick={closeDemoModal}>
          <div className="w-full max-w-md bg-white border border-brand-line overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-line bg-brand-bg">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-teal rounded-[4px]" aria-hidden="true">
                  <MessageSquareText className="h-4 w-4 text-white" />
                </div>
                <h3 id="demo-modal-title" className="font-manrope text-[18px] font-extrabold text-brand-ink tracking-[-0.02em]">{copy.demoModal.title}</h3>
              </div>
              <button onClick={closeDemoModal} className="p-1.5 rounded-[4px] text-brand-text-mute hover:text-brand-ink hover:bg-brand-bg-alt transition-colors duration-150" aria-label={copy.demoModal.closeLabel}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {demoSubmitted ? (
              <div className="px-6 py-10 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center" aria-hidden="true">
                  <ShieldCheck className="h-7 w-7 text-emerald-500" />
                </div>
                <h4 className="font-manrope text-[20px] font-bold text-brand-ink tracking-[-0.02em]">{copy.demoModal.sentTitle}</h4>
                <p className="text-[14.5px] text-brand-text-mute leading-[1.7]">{copy.demoModal.sentBody}</p>
                <Button onClick={closeDemoModal} className="rounded-md bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-[15.5px] transition-colors duration-150">{copy.demoModal.done}</Button>
              </div>
            ) : (
              <div className="px-6 py-6 space-y-4">
                <p className="text-[14.5px] text-brand-text-mute leading-[1.7]">{copy.demoModal.intro}</p>
                {DEMO_FIELDS.map((input) => (
                  <div key={input.field} className="space-y-1.5">
                    <label htmlFor={`demo-${input.field}`} className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.14em]">{copy.demoModal.fields[input.field].label}</label>
                    <input
                      id={`demo-${input.field}`}
                      type={input.type}
                      value={demoForm[input.field]}
                      onChange={(e) => handleDemoField(input.field, e.target.value)}
                      placeholder={copy.demoModal.fields[input.field].placeholder}
                      className="w-full px-4 py-2.5 rounded-[4px] border border-brand-line text-[14.5px] text-brand-text placeholder:text-brand-text-mute focus:outline-none focus:border-brand-teal transition-colors duration-150"
                    />
                  </div>
                ))}
                <Button
                  onClick={handleDemoSubmit}
                  disabled={!demoForm.name.trim() || !demoForm.institute.trim() || !demoForm.whatsapp.trim()}
                  className="w-full py-[15px] h-auto rounded-md bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white font-semibold text-[15.5px] transition-colors duration-150 active:scale-[0.98]"
                >
                  <MessageSquareText className="mr-2 h-5 w-5" aria-hidden="true" />
                  {copy.demoModal.submit}
                </Button>
                <p className="text-[12px] text-brand-text-mute text-center leading-[1.6]">{copy.demoModal.disclaimer}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;