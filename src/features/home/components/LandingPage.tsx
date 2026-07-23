import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import Typewriter from 'typewriter-effect';
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

import Mic from 'lucide-react/dist/esm/icons/mic';
import Laptop from 'lucide-react/dist/esm/icons/laptop';
import Flame from 'lucide-react/dist/esm/icons/flame';

const DEMO_WHATSAPP_NUMBER = '919995684689';

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

  if (processingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600">Verifying your account...</p>
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
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transform-gpu">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold text-indigo-700">TestCrack</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center pt-24 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-indigo-100 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10" aria-hidden="true">
          <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform-gpu will-change-transform"></div>
          <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform-gpu will-change-transform"></div>
        </div>
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-3 py-1 mt-5">
              <Sparkles className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
              Diagnostic-First IELTS Prep for Institutes
            </Badge>
            {/* CLS Fix: Replaced min-h-[1.2em] with explicit responsive min-heights to reserve layout space */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight mt-5 relative min-h-[96px] sm:min-h-[120px] md:min-h-[144px]">
              <span className="sr-only">Lift Your Institute's Band Score Average Measurably.</span>
              <div aria-hidden="true">
                <Typewriter
                  options={{ autoStart: true, loop: true, delay: 75, cursor: '|' }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString("Lift Your Institute's Band Score Average ")
                      .typeString('<span class="text-indigo-700">Measurably.</span>')
                      .pauseFor(3000)
                      .deleteAll()
                      .start();
                  }}
                />
              </div>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed text-balance">
              <span className="block mt-2">A complete education ecosystem for Kerala's coaching institutes — diagnostic-first IELTS prep, a daily drill loop students stick to, adaptive assessments every three days, and a live Real Band score your tutors can act on.</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" variant="outline" onClick={() => setDemoModalOpen(true)} className="px-8 py-6 h-auto bg-indigo-700 hover:bg-indigo-800 text-white transition-all shadow-md active:scale-95 border-none">
                <MessageSquareText className="mr-2 h-5 w-5 text-white" aria-hidden="true" />
                <span className='text-white font-bold'>Request Demo</span>
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/dashdemo')} className="px-8 py-6 h-auto bg-white hover:bg-gray-50 text-indigo-700 border-indigo-100 transition-all shadow-sm active:scale-95">
                <MonitorPlay className="mr-2 h-5 w-5 text-indigo-700" aria-hidden="true" />
                <span className='font-bold'>View Demo</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">The Industry Challenge</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-4 mb-6">
              Hidden roadblocks limiting your <span className="text-indigo-600">growth.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Traditional coaching methods are burning out tutors and capping student outcomes. Here is what is standing in the way of your institute's scale.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
            <Card className="flex-1 w-full bg-white/50 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 transform-gpu z-10 group">
              <CardContent className="p-8">
                <div className="p-3 bg-red-50 rounded-xl w-fit mb-6 group-hover:bg-red-100 transition-colors" aria-hidden="true">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-indigo-700 transition-colors">Band scores plateau — and nobody knows why</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Without sub-skill data, tutors can't see whether a student is stuck on coherence, grammar, or fluency — so practice stays generic and scores stay flat.</p>
              </CardContent>
            </Card>
            <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shrink-0 z-20 -mx-4 shadow-md" aria-hidden="true">
              <ArrowRight className="h-4 w-4" />
            </div>
            <Card className="flex-1 w-full bg-white/50 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 transform-gpu z-10 group">
              <CardContent className="p-8">
                <div className="p-3 bg-amber-50 rounded-xl w-fit mb-6 group-hover:bg-amber-100 transition-colors" aria-hidden="true">
                  <Hourglass className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-indigo-700 transition-colors">Tutors spend hours marking, not teaching</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Manual essay and speaking corrections eat 40–60% of tutor time — time that could be spent on high-value coaching and intervention.</p>
              </CardContent>
            </Card>
            <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white shrink-0 z-20 -mx-4 shadow-md" aria-hidden="true">
              <ArrowRight className="h-4 w-4" />
            </div>
            <Card className="flex-1 w-full bg-white/50 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 transform-gpu z-10 group">
              <CardContent className="p-8">
                <div className="p-3 bg-blue-50 rounded-xl w-fit mb-6 group-hover:bg-blue-100 transition-colors" aria-hidden="true">
                  <RefreshCw className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-indigo-700 transition-colors">Students disengage silently before exam day</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Without daily habits and visible progress, students drift away mid-course — and you find out only when they stop showing up. Lost revenue, lost referrals.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#f8fafc]">
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[10%] -right-[5%] w-[45%] h-[45%] rounded-full bg-indigo-200/40 blur-[120px] animate-pulse transform-gpu" />
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[120px] transform-gpu" />
          <div className="absolute -bottom-[10%] left-[30%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px] transform-gpu" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">One Platform. Three Wins.</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Students build a daily habit, tutors get actionable data, and institute owners get measurable outcomes.</p>
          </div>
          <div className="flex flex-col items-center gap-8 sm:gap-12 mb-12 px-2">
            <div className="inline-flex p-1 sm:p-1.5 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg ring-1 ring-black/5 max-w-full transform-gpu" role="tablist" aria-label="Target Audience Features">
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
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id ? "bg-indigo-700 text-white shadow-lg shadow-indigo-200" : "text-gray-500 hover:text-indigo-700 hover:bg-white/50"
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
                  className="group relative overflow-hidden border border-white/40 bg-white/30 backdrop-blur-md hover:bg-white/50 hover:border-white/80 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-3 transform-gpu"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  <CardContent className="p-6 text-left relative z-10">
                    <div className="p-2.5 bg-indigo-100/50 backdrop-blur-sm rounded-xl w-fit mb-4 group-hover:bg-indigo-600 transition-all duration-300" aria-hidden="true">
                      <item.icon className="h-5 w-5 text-indigo-700 group-hover:text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-900 transition-colors">{item.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">What TestCrack Delivers</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-4 mb-6">
              Tools your institute can use <span className="text-indigo-600">today.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">Every feature exists for one reason: a daily learning loop students actually complete, with clear, trackable proof for tutors and owners.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {toolsData.map((tool, index) => (
              <Card key={index} className="border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 transform-gpu flex flex-col h-full">
                <CardContent className="p-8 flex flex-col h-full relative">
                  <div className="p-3 bg-indigo-50 rounded-xl w-fit mb-6" aria-hidden="true">
                    <tool.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{tool.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">{tool.description}</p>
                  <div className="mt-auto">
                    <Badge
                      variant="secondary"
                      className={`px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md border ${
                        tool.status === 'LIVE'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                          : tool.status === 'BETA'
                            ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-50'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-50'
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
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative group">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-200/40 rounded-full blur-[120px] group-hover:bg-indigo-300/60 transition-colors duration-700 transform-gpu" aria-hidden="true" />
              <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-200/40 rounded-full blur-[120px] group-hover:bg-purple-300/60 transition-colors duration-700 transform-gpu" aria-hidden="true" />
              <Card className="relative border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border transition-all duration-500 hover:shadow-indigo-500/10 transform-gpu">
                <CardContent className="p-8 sm:p-14">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
                    <div className="flex flex-col items-center gap-4 z-10">
                      <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform duration-500" aria-hidden="true">
                        <User className="h-10 w-10 text-purple-600" />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Diagnostic</span>
                        <p className="text-sm font-bold text-slate-700">Band 5.5</p>
                      </div>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="hidden md:block absolute top-10 -left-24 w-24 h-[1px] bg-slate-200" aria-hidden="true">
                        <div className="animate-data-flow" style={{ animationDelay: '0s' }} />
                      </div>
                      <div className="hidden md:block absolute top-10 -right-24 w-24 h-[1px] bg-slate-200" aria-hidden="true">
                        <div className="animate-data-flow" style={{ animationDelay: '1.5s' }} />
                      </div>
                      <div className="relative" aria-hidden="true">
                        <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-20 animate-pulse transform-gpu" />
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/20">
                          <Cpu className="h-12 w-12 text-white animate-[spin_10s_linear_infinite]" />
                        </div>
                      </div>
                      <span className="mt-6 text-xl font-black bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">TESTCRACK ENGINE</span>
                    </div>
                    <div className="flex flex-col items-center gap-4 z-10">
                      <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform duration-500" aria-hidden="true">
                        <User className="h-10 w-10 text-purple-600" />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Real Band</span>
                        <p className="text-sm font-bold text-slate-700">Band 7.5</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6 w-fit border border-indigo-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Nine Scoring Engines
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                From Diagnostic <br />
                <span className="text-indigo-600">to Real Band.</span>
              </h2>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-xl">
                Nine scoring engines grade every drill, assessment, and mock against <span className="text-indigo-600 font-semibold">official IELTS band descriptors</span> — updating each student's live competency matrix after every attempt. No guesswork, no inflated scores.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Listening', level: 'Accuracy Engine' },
                  { name: 'Reading', level: 'Accuracy Engine' },
                  { name: 'Writing', level: 'Grammar · Coherence · Task · Vocab' },
                  { name: 'Speaking', level: 'Fluency · WPM · Pronunciation' }
                ].map((skill) => (
                  <div key={skill.name} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 group transform-gpu">
                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{skill.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{skill.level}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-3 text-sm text-slate-400 italic">
                <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                Scored against IELTS band descriptors, 0–9 scale, rounded to the nearest 0.5.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-indigo-50/50 rounded-[100%] blur-[120px] -z-10 transform-gpu" aria-hidden="true" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              The Learning Loop
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Band improvement, made <span className="text-indigo-700">systematic.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
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
                <Card className="h-full border-white/60 bg-white/50 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-500 border hover:-translate-y-2 transform-gpu">
                  <CardContent className="p-8 pt-12 flex flex-col items-center text-center">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center text-white text-xl font-black z-20 group-hover:scale-110 transition-transform duration-500" aria-hidden="true">
                      {item.step}
                    </div>
                    <div className="mb-6 p-4 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors duration-500" aria-hidden="true">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-4 group-hover:text-indigo-700 transition-colors">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.description}</p>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          <div className="mt-20 text-center">
            <p className="text-slate-400 text-sm font-semibold flex items-center justify-center gap-2 italic">
              <Sparkles className="h-4 w-4 text-indigo-400" aria-hidden="true" />
              Diagnostic → Daily Loop → IA → Mock → Real Band. Every step measured.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-indigo-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[80%] rounded-full bg-indigo-600 blur-[120px] opacity-50 transform-gpu" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[80%] rounded-full bg-indigo-500 blur-[120px] opacity-30 transform-gpu" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Card className="border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden py-12 transform-gpu">
            <CardContent className="text-center space-y-8">
              <div className="space-y-4">
                <Badge className="bg-white/10 text-white border-white/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Pilot Onboarding Open
                </Badge>
                <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
                  Ready to Lift Your <br />
                  <span className="text-indigo-200">Batch Averages?</span>
                </h2>
                <p className="text-xl text-indigo-100/80 max-w-2xl mx-auto leading-relaxed font-medium">
                  Join the Kerala coaching institutes piloting TestCrack — diagnostic-first IELTS prep with measurable outcomes from week one.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6">
                <Button size="lg" onClick={() => setDemoModalOpen(true)} className="px-10 py-6 h-auto bg-white hover:bg-indigo-50 text-indigo-700 font-black text-lg transition-all shadow-xl active:scale-95 border-none">
                  <MessageSquareText className="mr-2 h-5 w-5" aria-hidden="true" />
                  Request Demo
                </Button>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                  {[
                    { icon: Zap, text: 'Structured Institute Onboarding' },
                    { icon: MessageSquareText, text: 'WhatsApp-First Outreach' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-indigo-100/60 text-sm font-medium">
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-indigo-50/60 rounded-[100%] blur-[140px] -z-10 transform-gpu" aria-hidden="true" />
        <div className="max-w-4xl mx-auto relative">

          <div className="text-center mb-14">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Get in Touch</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-4 mb-4">
              We'd love to <span className="text-indigo-600">hear from you.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Reach out directly — whether you have a question, want a walkthrough, or are ready to onboard your institute.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">

            {/* Email card */}
            <a
              href="mailto:officialtestcrack@gmail.com"
              className="group flex items-start gap-5 p-7 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-3.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-700 transition-colors duration-300 shrink-0" aria-hidden="true">
                <Mail className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email us</p>
                <p className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors break-all">
                  officialtestcrack@gmail.com
                </p>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  For partnerships, onboarding queries, or general enquiries — we reply within one working day.
                </p>
              </div>
            </a>

            {/* WhatsApp card */}
            <a
              href="https://wa.me/919995684689"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-5 p-7 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-3.5 rounded-xl bg-emerald-50 group-hover:bg-indigo-700 transition-colors duration-300 shrink-0" aria-hidden="true">
                <Phone className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">WhatsApp us</p>
                <p className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  +91 99956 84689
                </p>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Fastest way to reach us. Chat directly with the TestCrack team about demos or pilot onboarding.
                </p>
              </div>
            </a>

          </div>

          {/* CTA nudge */}
          <div className="mt-10 text-center">
            <Button
              onClick={() => setDemoModalOpen(true)}
              className="px-8 py-5 h-auto bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm transition-all shadow-md active:scale-95 border-none"
            >
              <MessageSquareText className="mr-2 h-4 w-4" aria-hidden="true" />
              Or fill out the demo request form
            </Button>
          </div>

        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400">

        {/* Main footer grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Brand column — spans 2 cols on large screens */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Logo + name */}
              <div className="flex items-center space-x-3">
                <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
                <div>
                  <span className="text-lg font-black text-white">TestCrack</span>
                  <span className="block text-[10px] font-bold text-indigo-400 tracking-widest uppercase">for Institutes</span>
                </div>
              </div>

              {/* Short description */}
              <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                Diagnostic-first IELTS prep for Kerala's coaching institutes. Daily drills students stick to, adaptive assessments every three days, and a Real Band score your tutors can act on.
              </p>

              {/* Contact info */}
              <div className="flex flex-col gap-3">
                <a href="mailto:officialtestcrack@gmail.com" className="flex items-center gap-3 text-sm text-gray-500 hover:text-indigo-400 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center group-hover:bg-indigo-700 group-hover:border-indigo-600 transition-all" aria-hidden="true">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  officialtestcrack@gmail.com
                </a>
                <a href="https://wa.me/919995684689" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-500 hover:text-indigo-400 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center group-hover:bg-indigo-700 group-hover:border-indigo-600 transition-all" aria-hidden="true">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  +91 99956 84689
                </a>
                <a href="https://testcrack.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-500 hover:text-indigo-400 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center group-hover:bg-indigo-700 group-hover:border-indigo-600 transition-all" aria-hidden="true">
                    <Globe className="h-3.5 w-3.5" />
                  </div>
                  testcrack.com
                </a>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="w-7 h-7 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center" aria-hidden="true">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  Kochi, Kerala
                </div>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-3 pt-1">
                <a href="https://www.linkedin.com/in/test-crack-aa92203b0/" target="_blank" rel="noopener noreferrer" aria-label="Visit TestCrack on LinkedIn"
                  className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-indigo-700 hover:border-indigo-600 hover:text-white transition-all">
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="https://www.instagram.com/testcrackforinstitutes/" target="_blank" rel="noopener noreferrer" aria-label="Visit TestCrack on Instagram"
                  className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-indigo-700 hover:border-indigo-600 hover:text-white transition-all">
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href="https://www.youtube.com/@TESTCRACK-1" target="_blank" rel="noopener noreferrer" aria-label="Visit TestCrack on YouTube"
                  className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:bg-indigo-700 hover:border-indigo-600 hover:text-white transition-all">
                  <Youtube className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Links columns */}
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="flex flex-col gap-5">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">{heading}</h4>
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.isDemo ? (
                        <button
                          onClick={() => setDemoModalOpen(true)}
                          className="text-sm text-gray-500 hover:text-indigo-400 transition-colors text-left flex items-center gap-1.5 group"
                        >
                          <MessageSquareText className="h-3.5 w-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5 group"
                        >
                          <span className="w-1 h-1 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
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
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Copyright */}
            <p className="text-xs text-gray-600 text-center sm:text-left">
              © 2026 TestCrack. Diagnostic-first IELTS prep for institutes. All rights reserved.
            </p>

            {/* Status badges */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-900 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                Platform Live
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950 border border-indigo-900 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                Kerala-first EdTech
              </span>
            </div>

          </div>
        </div>

      </footer>

      {/* Demo Request Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeDemoModal}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-700 rounded-lg" aria-hidden="true">
                  <MessageSquareText className="h-4 w-4 text-white" />
                </div>
                <h3 id="demo-modal-title" className="text-lg font-black text-slate-900">Request a Demo</h3>
              </div>
              <button onClick={closeDemoModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" aria-label="Close demo request">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {demoSubmitted ? (
              <div className="px-6 py-10 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center" aria-hidden="true">
                  <ShieldCheck className="h-7 w-7 text-emerald-500" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Request sent!</h4>
                <p className="text-sm text-slate-600 leading-relaxed">We've opened WhatsApp with your details pre-filled. Hit send there and our team will get back to you within one working day.</p>
                <Button onClick={closeDemoModal} className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold">Done</Button>
              </div>
            ) : (
              <div className="px-6 py-6 space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed">Tell us about your institute and we'll reach out on WhatsApp to schedule a walkthrough.</p>
                {[
                  { field: 'name' as const, label: 'Your Name *', placeholder: 'e.g. Priya Nair', type: 'text' },
                  { field: 'institute' as const, label: 'Institute Name *', placeholder: 'e.g. Crest IELTS Academy, Kochi', type: 'text' },
                  { field: 'city' as const, label: 'City', placeholder: 'e.g. Kochi', type: 'text' },
                  { field: 'whatsapp' as const, label: 'WhatsApp Number *', placeholder: 'e.g. 9876543210', type: 'tel' },
                  { field: 'email' as const, label: 'Email', placeholder: 'e.g. priya@crestielts.in', type: 'email' },
                ].map((input) => (
                  <div key={input.field} className="space-y-1.5">
                    <label htmlFor={`demo-${input.field}`} className="text-xs font-bold text-slate-700 uppercase tracking-wide">{input.label}</label>
                    <input
                      id={`demo-${input.field}`}
                      type={input.type}
                      value={demoForm[input.field]}
                      onChange={(e) => handleDemoField(input.field, e.target.value)}
                      placeholder={input.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                ))}
                <Button
                  onClick={handleDemoSubmit}
                  disabled={!demoForm.name.trim() || !demoForm.institute.trim() || !demoForm.whatsapp.trim()}
                  className="w-full py-6 h-auto bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold transition-all active:scale-[0.98]"
                >
                  <MessageSquareText className="mr-2 h-5 w-5" aria-hidden="true" />
                  Send via WhatsApp
                </Button>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">Opens WhatsApp with your details pre-filled — nothing is sent until you press send there.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;