import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

import testcrackLogo from '@/assets/testcrack-logo.svg';
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
  { value: '+2.0', label: 'avg band lift', accent: false },
  { value: '18', label: 'institutes live', accent: false },
  { value: '92%', label: 'streak retention', accent: true },
] as const;

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [processingAuth, setProcessingAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
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
          <p className="text-brand-text-mute">Verifying your account...</p>
        </div>
      </div>
    );
  }

  const tabContent = {
    students: [
      { icon: Target, title: 'Diagnostic-First Start', description: 'A one-time, four-skill baseline assessment (Listening, Reading, Writing, Speaking) builds your personal competency matrix — so from day one, you only drill what is actually weak.' },
      { icon: Zap, title: 'Daily Drill Loop + DCS', description: 'Three targeted micro-drills and the LexiGrid vocabulary game every day. Your Daily Competency Score gives you visible proof of progress before you even open a textbook.' },
      { icon: Cpu, title: 'Adaptive Internal Assessments', description: 'Every three days, a 40-minute IA tests your two weakest sub-skills at your current band level. AI grades writing and speaking instantly — with feedback, not just a score.' },
      { icon: LineChart, title: 'Real Band + Momentum', description: 'Monthly full-length mocks produce a Real Band score you can trust. Momentum points and daily streaks reward consistency — and unlock extra drills and earned mocks.' },
    ],
    instructors: [
      { icon: AlertTriangle, title: 'At-Risk Auto Detection', description: 'Rule-based flags from real data — broken streaks, missed internal assessments, declining bands, students stuck before diagnostics. Intervene before they drop, not after.' },
      { icon: LineChart, title: 'Live Band Score Table', description: 'Every student\'s current band vs. target band, gap-sorted, with trend arrows from their last two assessments. Know exactly who needs you this week.' },
      { icon: Users, title: 'Student Deep Dive', description: 'IA history with sub-skill breakdowns, mock band progression, 14-day drill trends, and sub-skill coverage maps — one page per student, zero spreadsheets.' },
      { icon: MessageSquareText, title: 'Zero Manual Marking', description: 'Nine AI scoring engines grade drills, writing tasks, and speaking responses against IELTS band descriptors. You review feedback and coach — the marking is done.' },
    ],
    institutes: [
      { icon: LayoutDashboard, title: 'Institute Command Center', description: 'Cohort band averages, IA completion rates, engagement health, and goal-achievement segmentation across every batch — in one daily-updated view.' },
      { icon: FileBarChart, title: 'Batch Snapshot Reports', description: 'One-page, printable batch performance summaries: engagement this week, IA results, mock outcomes, and the at-risk list. Ready for parents and stakeholders.' },
      { icon: ShieldCheck, title: 'Diagnostic → Outcome Proof', description: 'Show measurable improvement from baseline diagnostic to current Real Band per student and per batch — the proof that sells your institute.' },
      { icon: Building2, title: 'B2B Onboarding + WhatsApp Outreach', description: 'Built for Kerala\'s coaching ecosystem: structured institute onboarding, role-based access for your team, and WhatsApp nudges for disengaged students. (Outreach in build.)' },
    ],
  };

  const toolsData = [
    { icon: Target, title: "Diagnostic Assessment Engine", description: "Every student starts with a four-skill baseline. Band scores and sub-skill breakdowns seed a live competency matrix — so practice is targeted from day one, not generic.", status: "LIVE" },
    { icon: Zap, title: "Daily Drill Engine + LexiGrid", description: "Three daily micro-drills targeting weak sub-skills, plus a daily vocabulary game. The Daily Competency Score gates progress and shows tutors exactly who practised today.", status: "LIVE" },
    { icon: Cpu, title: "Adaptive Internal Assessments", description: "A 40-minute assessment every three days, auto-scheduled. Difficulty adapts to the student's current band; missed sessions carry forward so weak skills never slip through.", status: "LIVE" },
    { icon: Laptop, title: "Monthly Mock Tests + Real Band", description: "Full IELTS simulations across all four skills, producing a Real Band score updated monthly. Motivated students can earn extra mocks with momentum points.", status: "LIVE" },
    { icon: Mic, title: "AI Speaking & Writing Scoring", description: "Nine scoring engines grade fluency, WPM, filler words, grammar, coherence, task response, and vocabulary against IELTS band descriptors — instantly, with feedback rationale.", status: "LIVE" },
    { icon: LayoutDashboard, title: "Tutor & Institute Dashboards", description: "Batch engagement pulse, at-risk detection, band overview tables, student deep dives, and institute-level outcome reports — currently in pilot build for partner institutes.", status: "BETA" },
  ];

  const footerLinks = {
    Platform: [
      { label: 'Diagnostic Assessment', href: '#' },
      { label: 'Daily Drill Engine', href: '#' },
      { label: 'LexiGrid Vocabulary', href: '#' },
      { label: 'Adaptive Assessments', href: '#' },
      { label: 'Mock Tests', href: '#' },
      { label: 'AI Scoring Engines', href: '#' },
    ],
    Institutes: [
      { label: 'Command Center', href: '#' },
      { label: 'Tutor Dashboards', href: '#' },
      { label: 'Batch Reports', href: '#' },
      { label: 'At-Risk Detection', href: '#' },
      { label: 'Pilot Onboarding', href: '#' },
      { label: 'View Demo', href: '/dashdemo' },
    ],
    Company: [
      { label: 'About TestCrack', href: '#' },
      { label: 'For Students', href: '#' },
      { label: 'For Tutors', href: '#' },
      { label: 'For Institutes', href: '#' },
      { label: 'Request Demo', href: '#', isDemo: true },
    ],
  };

  return (
    <div className="min-h-screen bg-white font-plex text-brand-text antialiased">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-ink border-b border-brand-line-12 transform-gpu">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
              <span className="font-manrope text-xl font-extrabold tracking-[-0.03em] text-brand-bg">TestCrack</span>
            </div>
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
                  Diagnostic-First IELTS Prep for Institutes
                </span>
              </div>

              {/* Static headline, matching the approved mock. Renders on first
                  paint with no reserved-height trick and no layout shift. */}
              <h1 className="font-manrope text-[40px] sm:text-[52px] xl:text-[64px] font-extrabold leading-[1.04] tracking-[-0.03em] text-white mb-6">
                Lift your institute's band score average{' '}
                <span className="text-brand-mint">measurably.</span>
              </h1>

              <p className="max-w-[540px] text-[16.5px] leading-[1.75] text-brand-on-ink mb-9">
                A complete education ecosystem for Kerala's coaching institutes — daily drills students stick to, assessments every three days, and a Real Band score tutors can act on.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={() => setDemoModalOpen(true)}
                  className="group h-auto rounded-md border-none bg-brand-teal px-6 py-3 text-[14.5px] font-semibold text-white shadow-none transition-colors duration-150 hover:bg-brand-teal-dark active:scale-95"
                >
                  Request Demo
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashdemo')}
                  className="h-auto rounded-md border border-brand-line-25 bg-transparent px-6 py-3 text-[14.5px] font-semibold text-brand-bg shadow-none transition-colors duration-150 hover:border-brand-line-60 hover:bg-brand-wash-06 active:scale-95"
                >
                  <Play className="mr-2 h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  View Demo
                </Button>
              </div>

              {/* Metric strip — see HERO_METRICS: values are placeholders, not verified figures */}
              <div className="mt-12 max-w-[560px] border-t border-brand-line-14 pt-7">
                <dl className="grid grid-cols-3 gap-px bg-brand-line-14">
                  {HERO_METRICS.map((metric) => (
                    <div key={metric.label} className="bg-brand-ink-deep px-4 first:pl-0">
                      <dd className={`font-jetbrains text-[24px] font-bold tracking-[-0.02em] ${metric.accent ? 'text-brand-mint' : 'text-white'}`}>
                        {metric.value}
                      </dd>
                      <dt className="mt-1.5 text-[12.5px] text-brand-on-ink-mute">{metric.label}</dt>
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
                    <p className="font-jetbrains text-[9px] sm:text-[10.5px] uppercase tracking-[0.14em] text-brand-teal-300">Diagnostic</p>
                    <p className="mt-1 font-jetbrains text-[15px] sm:text-[18px] font-bold text-white whitespace-nowrap">Band 5.5</p>
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
                    <p className="font-jetbrains text-[9px] sm:text-[10.5px] uppercase tracking-[0.14em] text-brand-warm">Real Band</p>
                    <p className="mt-1 font-jetbrains text-[15px] sm:text-[18px] font-bold text-white whitespace-nowrap">Band 7.5</p>
                  </div>
                </div>

              </div>
              <p className="mt-6 sm:mt-7 text-center font-jetbrains text-[10px] sm:text-[10.5px] uppercase tracking-[0.16em] text-brand-on-ink-mute">
                via the TestCrack Engine
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-bg relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">The Industry Challenge</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-6 leading-[1.1] tracking-[-0.04em]">
              Hidden roadblocks limiting your <span className="text-brand-teal">growth.</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-3xl mx-auto leading-[1.7]">
              Traditional coaching methods are burning out tutors and capping student outcomes. Here is what is standing in the way of your institute's scale.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
            <Card className="flex-1 w-full bg-white border border-brand-line rounded-none shadow-none transform-gpu z-10 group">
              <CardContent className="p-8">
                <div className="p-3 bg-brand-warm-tint rounded-[4px] w-fit mb-6" aria-hidden="true">
                  <TrendingDown className="h-6 w-6 text-brand-warm" />
                </div>
                <h3 className="font-manrope text-[22px] font-bold text-brand-ink mb-3 leading-tight tracking-[-0.02em]">Band scores plateau — and nobody knows why</h3>
                <p className="text-brand-text-mute text-[15px] leading-[1.7]">Without sub-skill data, tutors can't see whether a student is stuck on coherence, grammar, or fluency — so practice stays generic and scores stay flat.</p>
              </CardContent>
            </Card>
            <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal text-white shrink-0 z-20 -mx-4" aria-hidden="true">
              <ArrowRight className="h-4 w-4" />
            </div>
            <Card className="flex-1 w-full bg-white border border-brand-line rounded-none shadow-none transform-gpu z-10 group">
              <CardContent className="p-8">
                <div className="p-3 bg-brand-blue-tint rounded-[4px] w-fit mb-6" aria-hidden="true">
                  <Hourglass className="h-6 w-6 text-brand-blue" />
                </div>
                <h3 className="font-manrope text-[22px] font-bold text-brand-ink mb-3 leading-tight tracking-[-0.02em]">Tutors spend hours marking, not teaching</h3>
                <p className="text-brand-text-mute text-[15px] leading-[1.7]">Manual essay and speaking corrections eat 40–60% of tutor time — time that could be spent on high-value coaching and intervention.</p>
              </CardContent>
            </Card>
            <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal text-white shrink-0 z-20 -mx-4" aria-hidden="true">
              <ArrowRight className="h-4 w-4" />
            </div>
            <Card className="flex-1 w-full bg-white border border-brand-line rounded-none shadow-none transform-gpu z-10 group">
              <CardContent className="p-8">
                <div className="p-3 bg-brand-bg-alt rounded-[4px] w-fit mb-6" aria-hidden="true">
                  <RefreshCw className="h-6 w-6 text-brand-ink" />
                </div>
                <h3 className="font-manrope text-[22px] font-bold text-brand-ink mb-3 leading-tight tracking-[-0.02em]">Students disengage silently before exam day</h3>
                <p className="text-brand-text-mute text-[15px] leading-[1.7]">Without daily habits and visible progress, students drift away mid-course — and you find out only when they stop showing up. Lost revenue, lost referrals.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mb-4 leading-[1.1] tracking-[-0.04em]">One Platform. Three Wins.</h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-2xl mx-auto leading-[1.7]">Students build a daily habit, tutors get actionable data, and institute owners get measurable outcomes.</p>
          </div>
          <div className="flex flex-col items-center gap-8 sm:gap-12 mb-12 px-2">
            <div className="inline-flex p-1 bg-brand-bg-alt rounded-md border border-brand-line max-w-full transform-gpu" role="tablist" aria-label="Target Audience Features">
              {[
                { id: 'students', label: 'Students', icon: GraduationCap },
                { id: 'instructors', label: 'Tutors', icon: Users },
                { id: 'institutes', label: 'Institutes', icon: Building2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-[4px] text-[11px] sm:text-[14.5px] font-semibold transition-colors duration-150 whitespace-nowrap ${
                    activeTab === tab.id ? "bg-brand-teal text-white" : "text-brand-text-mute hover:text-brand-teal"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div 
              id={`panel-${activeTab}`} 
              role="tabpanel" 
              aria-labelledby={`tab-${activeTab}`} 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl"
            >
              {tabContent[activeTab as keyof typeof tabContent].map((item, idx) => (
                <Card
                  key={`${activeTab}-${idx}`}
                  className="group relative overflow-hidden border border-brand-line bg-white rounded-none shadow-none animate-in fade-in slide-in-from-bottom-3 transform-gpu"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardContent className="p-6 text-left relative z-10">
                    <div className="p-2.5 bg-brand-teal-wash rounded-[4px] w-fit mb-4" aria-hidden="true">
                      <item.icon className="h-5 w-5 text-brand-teal" />
                    </div>
                    <h4 className="font-manrope text-[17px] font-bold text-brand-ink mb-2 tracking-[-0.02em]">{item.title}</h4>
                    <p className="text-brand-text-mute text-[14.5px] leading-[1.7]">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-brand-bg-alt relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">What TestCrack Delivers</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-6 leading-[1.1] tracking-[-0.04em]">
              Tools your institute can use <span className="text-brand-teal">today.</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-3xl mx-auto leading-[1.7]">Every feature exists for one reason: a daily learning loop students actually complete, with clear, trackable proof for tutors and owners.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-line border border-brand-line">
            {toolsData.map((tool, index) => (
              <Card key={index} className="border-0 bg-white rounded-none shadow-none transform-gpu flex flex-col h-full">
                <CardContent className="p-8 flex flex-col h-full relative">
                  <div className="p-3 bg-brand-teal-wash rounded-[4px] w-fit mb-6" aria-hidden="true">
                    <tool.icon className="h-6 w-6 text-brand-teal" />
                  </div>
                  <h3 className="font-manrope text-[20px] font-bold text-brand-ink mb-4 tracking-[-0.02em]">{tool.title}</h3>
                  <p className="text-brand-text-mute text-[14.5px] leading-[1.7] mb-8 flex-grow">{tool.description}</p>
                  <div className="mt-auto">
                    <Badge
                      variant="secondary"
                      className={`px-3 py-1 font-jetbrains text-[10.5px] font-normal tracking-[0.14em] uppercase rounded-[4px] border ${
                        tool.status === 'LIVE'
                          ? 'bg-brand-teal-wash text-brand-teal border-brand-teal-tint hover:bg-brand-teal-wash'
                          : tool.status === 'BETA'
                            ? 'bg-brand-warm-tint text-brand-warm border-[#F7D9C7] hover:bg-brand-warm-tint'
                            : 'bg-brand-bg text-brand-text-mute border-brand-line hover:bg-brand-bg'
                      }`}
                    >
                      {tool.status}
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
                Nine Scoring Engines
              </div>
              <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink leading-[1.1] tracking-[-0.04em] mb-6">
                From Diagnostic <br />
                <span className="text-brand-teal">to Real Band.</span>
              </h2>
              <p className="text-brand-text-mute text-[18px] leading-[1.7] max-w-xl">
                Nine scoring engines grade every drill, assessment, and mock against <span className="text-brand-teal font-semibold">official IELTS band descriptors</span> — updating each student's live competency matrix after every attempt. No guesswork, no inflated scores.
              </p>
              <div className="mt-8 flex items-center gap-3 text-[13px] text-brand-text-mute">
                <ShieldCheck className="h-5 w-5 text-brand-teal" aria-hidden="true" />
                Scored against IELTS band descriptors, 0–9 scale, rounded to the nearest 0.5.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-brand-line border border-brand-line">
              {[
                { name: 'Listening', level: 'Accuracy Engine' },
                { name: 'Reading', level: 'Accuracy Engine' },
                { name: 'Writing', level: 'Grammar · Coherence · Task · Vocab' },
                { name: 'Speaking', level: 'Fluency · WPM · Pronunciation' }
              ].map((skill) => (
                <div key={skill.name} className="p-6 bg-white transform-gpu">
                  <h3 className="font-manrope text-[20px] font-bold text-brand-ink tracking-[-0.02em]">{skill.name}</h3>
                  <p className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.14em] mt-1">{skill.level}</p>
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
              The Learning Loop
            </Badge>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mb-6 leading-[1.1] tracking-[-0.04em]">
              Band improvement, made <span className="text-brand-teal">systematic.</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-2xl mx-auto leading-[1.7]">
              Three connected stages take every student from baseline uncertainty to a Real Band score they — and you — can trust.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {[
              { step: '01', title: 'Diagnose', description: 'Every student takes a one-time, four-skill baseline assessment on joining. Band scores and sub-skill breakdowns seed their personal competency matrix — so the platform knows exactly where to focus before the first drill.', icon: Target },
              { step: '02', title: 'Drill Daily', description: 'Each day, students complete targeted micro-drills on their weakest sub-skills plus the LexiGrid vocabulary game. Momentum points, daily streaks, and the Daily Competency Score turn practice into a habit — and show tutors who is engaged.', icon: Flame },
              { step: '03', title: 'Assess & Prove', description: 'Adaptive Internal Assessments every three days and a full mock test every month keep the competency matrix honest. The Real Band score moves visibly toward the target — measurable proof of progress for students, parents, and your institute.', icon: LineChart },
            ].map((item, index) => (
              <div key={index} className="relative group">
                <Card className="h-full bg-white border border-brand-line rounded-none shadow-none transform-gpu">
                  <CardContent className="p-8 pt-12 flex flex-col items-center text-center">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-md bg-brand-teal flex items-center justify-center text-white font-jetbrains text-xl font-bold z-20" aria-hidden="true">
                      {item.step}
                    </div>
                    <div className="mb-6 p-4 rounded-[4px] bg-brand-teal-wash text-brand-teal" aria-hidden="true">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-manrope text-[20px] font-bold text-brand-ink mb-4 tracking-[-0.02em]">{item.title}</h3>
                    <p className="text-brand-text-mute text-[14.5px] leading-[1.7]">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          <div className="mt-20 text-center">
            <p className="font-jetbrains text-brand-text-mute text-[12px] uppercase tracking-[0.14em] flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-teal" aria-hidden="true" />
              Diagnostic → Daily Loop → IA → Mock → Real Band. Every step measured.
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
                  Pilot Onboarding Open
                </Badge>
                <h2 className="font-manrope text-4xl sm:text-6xl font-extrabold text-brand-bg leading-[1.05] tracking-[-0.04em]">
                  Ready to Lift Your <br />
                  <span className="text-brand-teal-soft">Batch Averages?</span>
                </h2>
                <p className="text-[18px] text-brand-on-ink max-w-2xl mx-auto leading-[1.7]">
                  Join the Kerala coaching institutes piloting TestCrack — diagnostic-first IELTS prep with measurable outcomes from week one.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6">
                <Button size="lg" onClick={() => setDemoModalOpen(true)} className="px-7 py-[15px] h-auto rounded-md bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-[15.5px] transition-colors duration-150 active:scale-95 border-none">
                  <MessageSquareText className="mr-2 h-5 w-5" aria-hidden="true" />
                  Request Demo
                </Button>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                  {[
                    { icon: Zap, text: 'Structured Institute Onboarding' },
                    { icon: MessageSquareText, text: 'WhatsApp-First Outreach' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-brand-on-ink-mute text-[13px]">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      {item.text}
                    </div>
                  ))}
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
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">Get in Touch</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-4 leading-[1.1] tracking-[-0.04em]">
              We'd love to <span className="text-brand-teal">hear from you.</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-xl mx-auto leading-[1.7]">
              Reach out directly — whether you have a question, want a walkthrough, or are ready to onboard your institute.
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
                <p className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.16em] mb-1">Email us</p>
                <p className="font-manrope text-[17px] font-bold text-brand-ink break-all">
                  officialtestcrack@gmail.com
                </p>
                <p className="text-[14.5px] text-brand-text-mute mt-1.5 leading-[1.7]">
                  For partnerships, onboarding queries, or general enquiries — we reply within one working day.
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
                <p className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.16em] mb-1">WhatsApp us</p>
                <p className="font-manrope text-[17px] font-bold text-brand-ink">
                  +91 99956 84689
                </p>
                <p className="text-[14.5px] text-brand-text-mute mt-1.5 leading-[1.7]">
                  Fastest way to reach us. Chat directly with the TestCrack team about demos or pilot onboarding.
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
              Or fill out the demo request form
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
                  <span className="block font-jetbrains text-[10.5px] text-brand-teal-soft tracking-[0.16em] uppercase">for Institutes</span>
                </div>
              </div>

              {/* Short description */}
              <p className="text-[14px] text-brand-on-ink leading-[1.65] max-w-sm">
                Diagnostic-first IELTS prep for Kerala's coaching institutes. Daily drills students stick to, adaptive assessments every three days, and a Real Band score your tutors can act on.
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
                  Kochi, Kerala
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
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="flex flex-col gap-5">
                <h4 className="font-jetbrains text-[10.5px] text-brand-teal-soft uppercase tracking-[0.16em]">{heading}</h4>
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.isDemo ? (
                        <button
                          onClick={() => setDemoModalOpen(true)}
                          className="text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 text-left flex items-center gap-1.5 group"
                        >
                          <MessageSquareText className="h-3.5 w-3.5 text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          className="text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 flex items-center gap-1.5 group"
                        >
                          <span className="w-1 h-1 rounded-full bg-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Copyright */}
            <p className="text-[13px] text-brand-on-ink-mute text-center sm:text-left">
              © 2026 TestCrack. Diagnostic-first IELTS prep for institutes. All rights reserved.
            </p>

            {/* Status badges */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#0C2E2A] border border-[#12463F] font-jetbrains text-[10.5px] text-brand-teal-soft uppercase tracking-[0.14em]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal-soft animate-pulse" aria-hidden="true" />
                Platform Live
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#12283A] border border-[#1D3A50] font-jetbrains text-[10.5px] text-brand-on-ink uppercase tracking-[0.14em]">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                Kerala-first EdTech
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
                <h3 id="demo-modal-title" className="font-manrope text-[18px] font-extrabold text-brand-ink tracking-[-0.02em]">Request a Demo</h3>
              </div>
              <button onClick={closeDemoModal} className="p-1.5 rounded-[4px] text-brand-text-mute hover:text-brand-ink hover:bg-brand-bg-alt transition-colors duration-150" aria-label="Close demo request">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {demoSubmitted ? (
              <div className="px-6 py-10 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center" aria-hidden="true">
                  <ShieldCheck className="h-7 w-7 text-emerald-500" />
                </div>
                <h4 className="font-manrope text-[20px] font-bold text-brand-ink tracking-[-0.02em]">Request sent!</h4>
                <p className="text-[14.5px] text-brand-text-mute leading-[1.7]">We've opened WhatsApp with your details pre-filled. Hit send there and our team will get back to you within one working day.</p>
                <Button onClick={closeDemoModal} className="rounded-md bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-[15.5px] transition-colors duration-150">Done</Button>
              </div>
            ) : (
              <div className="px-6 py-6 space-y-4">
                <p className="text-[14.5px] text-brand-text-mute leading-[1.7]">Tell us about your institute and we'll reach out on WhatsApp to schedule a walkthrough.</p>
                {[
                  { field: 'name' as const, label: 'Your Name *', placeholder: 'e.g. Priya Nair', type: 'text' },
                  { field: 'institute' as const, label: 'Institute Name *', placeholder: 'e.g. Crest IELTS Academy, Kochi', type: 'text' },
                  { field: 'city' as const, label: 'City', placeholder: 'e.g. Kochi', type: 'text' },
                  { field: 'whatsapp' as const, label: 'WhatsApp Number *', placeholder: 'e.g. 9876543210', type: 'tel' },
                  { field: 'email' as const, label: 'Email', placeholder: 'e.g. priya@crestielts.in', type: 'email' },
                ].map((input) => (
                  <div key={input.field} className="space-y-1.5">
                    <label htmlFor={`demo-${input.field}`} className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.14em]">{input.label}</label>
                    <input
                      id={`demo-${input.field}`}
                      type={input.type}
                      value={demoForm[input.field]}
                      onChange={(e) => handleDemoField(input.field, e.target.value)}
                      placeholder={input.placeholder}
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
                  Send via WhatsApp
                </Button>
                <p className="text-[12px] text-brand-text-mute text-center leading-[1.6]">Opens WhatsApp with your details pre-filled — nothing is sent until you press send there.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;