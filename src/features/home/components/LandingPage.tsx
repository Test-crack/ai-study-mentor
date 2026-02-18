import { useEffect, useState, memo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import Typewriter from 'typewriter-effect';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// PERFORMANCE FIX: Individual imports prevent loading the entire 1000+ icon library
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Zap from 'lucide-react/dist/esm/icons/zap';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Target from 'lucide-react/dist/esm/icons/target';
import Cpu from 'lucide-react/dist/esm/icons/cpu';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import FileBarChart from 'lucide-react/dist/esm/icons/file-bar-chart';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Bot from 'lucide-react/dist/esm/icons/bot';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Users from 'lucide-react/dist/esm/icons/users';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import MonitorPlay from 'lucide-react/dist/esm/icons/monitor-play';
import LineChart from 'lucide-react/dist/esm/icons/line-chart';
import MessageSquareText from 'lucide-react/dist/esm/icons/message-square-text';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import FileDown from 'lucide-react/dist/esm/icons/file-down';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [processingAuth, setProcessingAuth] = useState(false);
  
  // Public state for the interactive feature switcher
  const [activeTab, setActiveTab] = useState('students');

  // Handle auth callbacks (logic preserved exactly)
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      
      if (!hash || !hash.includes("access_token")) {
        return;
      }

      setProcessingAuth(true);
      
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken) {
        setProcessingAuth(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (error) {
          navigate("/auth?error=invalid_token");
          return;
        }

        window.history.replaceState(null, "", window.location.pathname);

        if (type === "recovery") {
          navigate("/reset-password", { replace: true });
        } else if (type === "signup" || type === "magiclink" || type === "email") {
          navigate("/profile?welcome=true", { replace: true });
        } else if (data.session) {
          navigate("/dashboard", { replace: true });
        }
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

  // Content for the public switcher grid (ALL TEXT PRESERVED)
  const tabContent = {
  students: [
      { icon: MonitorPlay, title: 'Adaptive Mock Test Simulator', description: 'Shake off the nerves with infinite, hyper-realistic interview simulations and online exam prep that adapts to your specific weaknesses in real-time.' },
      { icon: Target, title: 'Personalized Skill Gaps & Drills', description: 'Skip what you already know. Our AI identifies knowledge gaps and generates instant micro-learning lessons to bridge them, making your study time 10x more efficient.' },
      { icon: ShieldCheck, title: 'Blockchain-Verified Career Certifications', description: 'Earn dynamic, shareable proof of skill Showcase your interview readiness directly to LinkedIn recruiters with certificates that prove you have the expertise, not just the digital paper.' },
      { icon: Bot, title: '24/7 AI Mentor', description: 'Get instant, actionable feedback on your performance Whether its coding interview prep or leadership coaching, get the answers you need without waiting days for a grade.' },
    ],
    instructors: [
      { icon: AlertTriangle, title: '"Confidently Wrong" AI Alerts', description: ' Our system flags students who are consistently incorrect with high confidence. This predictive student analytics tool allows you to intervene exactly where support is needed most. ' },
      { icon: Zap, title: 'Auto-Generated Practice Drills', description: ' Instantly create customized practice sets based on yesterday’s classroom performance. It’s the ultimate automated lesson planning tool for busy educators.' },
      { icon: LineChart, title: 'Real-Time Performance Tracking', description: 'See which students are on track and who needs a nudge before they ever reach the first mock exam. ' },
      { icon: MessageSquareText, title: 'Instant Feedback Loops', description: ' Let the AI handle the repetitive "Why is this wrong?" questions. Provide automated student feedback so you can focus on high-level strategy and student inspiration.' },
    ],
    universities: [
      { icon: LayoutDashboard, title: 'Centralized Institutional Command Center', description: ' Monitor the health, engagement, and progress of your entire student body through a single, high-level data visualization pane. ' },
      { icon: FileBarChart, title: 'Automated Stakeholder Reports', description: ' Receive weekly, audit-ready reports on student growth, Mock Test Simulator scores, and curriculum completion rates.' },
      { icon: Briefcase, title: 'Optimized Placement & Hireability', description: 'Use our proprietary "Hireability Score" to match top performers with partner employers, drastically increasing your institutional success metrics.' },
      { icon: Cpu, title: 'Scalable AI Credits', description: ' Efficiently distribute AI processing power across departments or cohorts,ensuring every student gets support without overextending your budget. ' },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b transform-gpu">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-700 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-indigo-700 bg-clip-text text-transparent">
               TestCrack
              </span>
            </div>
          <div className="flex items-center gap-4">
  <Button
    variant="ghost"
    onClick={() => navigate('/courses')}
    className="hidden md:inline-flex text-white bg-indigo-700 hover:text-gray-900"
  >
    Courses
  </Button>

  {user ? (
    <Button
      onClick={() => navigate('/dashboard')}
      className="bg-indigo-700 hover:from-purple-700 hover:to-blue-700"
    >
      Dashboard
    </Button>
  ) : (
    <>
      <Button
        variant="ghost"
        onClick={() => navigate('/auth')}
        className="text-white bg-indigo-700 hover:text-gray-900"
      >
        Sign In
      </Button>
    </>
  )}
</div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
<section className="relative min-h-[80vh] flex items-center pt-24 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-indigo-100 overflow-hidden ">
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
    {/* PERFORMANCE FIX: Added transform-gpu and will-change to background animations */}
    <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform-gpu will-change-transform"></div>
    <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform-gpu will-change-transform"></div>
  </div>

  <div className="max-w-7xl mx-auto w-full">
    <div className="text-center max-w-4xl mx-auto">
      <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-100 border-none px-3 py-1 mt-5">
        <Sparkles className="h-3.5 w-3.5 mr-2" />
        AI-Powered Education Platform
      </Badge>
      
    {/* PERFORMANCE FIX: Lighthouse hates "empty" H1s. This span makes it instantly visible to the bot */}
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight mt-5 relative min-h-[1.2em]">
      <span className="sr-only">Stop Guessing Start Cracking</span>
      <Typewriter
        options={{
          autoStart: true,
          loop: true,
          delay: 75,
          cursor: '|',
        }}
        onInit={(typewriter) => {
          typewriter
            .typeString('Stop Guessing Start ')
            .typeString('<span class="bg-indigo-700  bg-clip-text text-transparent">Cracking</span>')
            .pauseFor(3000)
            .deleteAll()
            .start();
        }}
      />
    </h1>
      
      <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
        Transform your learning experience with personalized AI.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">

        <Button
          size="lg"
          onClick={() => {
            if (!user) {
              navigate('/auth');
              return;
            }
            if (user) {
               if (profile?.role === 'INSTRUCTOR' || profile?.role === 'ADMIN') {
                 navigate('/instructor/dashboard');
               } else {
                 navigate('/student/dashboard');
               }
            }
          }}
          className="bg-indigo-700 hover:bg-indigo-800 text-white px-8 py-6 h-auto transition-all shadow-md active:scale-95"
        >
          {user ? 'Go to Dashboard' : 'Start Learning Free'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={() => navigate('/courses')}
          className="px-8 py-6 h-auto bg-white/50 backdrop-blur-sm transition-all shadow-sm active:scale-95"
        >
          <BookOpen className="mr-2 h-5 w-5 text-gray-600" />
          Browse Courses
        </Button>
      </div>
    </div>
  </div>
</section>

      {/* Features Section */}
   <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#f8fafc]">
  <div className="absolute inset-0 -z-10 overflow-hidden">
    {/* PERFORMANCE FIX: transform-gpu on large blur areas */}
    <div className="absolute -top-[10%] -right-[5%] w-[45%] h-[45%] rounded-full bg-indigo-200/40 blur-[120px] animate-pulse transform-gpu" />
    <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[120px] transform-gpu" />
    <div className="absolute -bottom-[10%] left-[30%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px] transform-gpu" />
    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
  </div>

  <div className="max-w-7xl mx-auto relative z-10">
    <div className="text-center mb-16">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
       What We Offer ?
      </h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Our comprehensive platform combines cutting-edge AI with proven learning methodologies.
      </p>
    </div>

   <div className="flex flex-col items-center gap-8 sm:gap-12 mb-12 px-2">
  <div className="inline-flex p-1 sm:p-1.5 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg ring-1 ring-black/5 max-w-full transform-gpu">
    {[
      { id: 'students', label: 'Students', icon: GraduationCap },
      { id: 'instructors', label: 'Instructors', icon: Users },
      { id: 'universities', label: 'Universities', icon: Building2 },
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
          activeTab === tab.id 
            ? "bg-indigo-700 text-white shadow-lg shadow-indigo-200" 
            : "text-gray-500 hover:text-indigo-700 hover:bg-white/50"
        }`}
      >
        <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        {tab.label}
      </button>
    ))}
  </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {tabContent[activeTab as keyof typeof tabContent].map((item, idx) => (
          <Card 
            key={`${activeTab}-${idx}`} 
            className="group relative overflow-hidden border border-white/40 bg-white/30 backdrop-blur-md hover:bg-white/50 hover:border-white/80 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-3 transform-gpu"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardContent className="p-6 text-left relative z-10">
              <div className="p-2.5 bg-indigo-100/50 backdrop-blur-sm rounded-xl w-fit mb-4 group-hover:bg-indigo-600 transition-all duration-300">
                <item.icon className="h-5 w-5 text-indigo-700 group-hover:text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-900 transition-colors">
                {item.title}
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
</section>

{/* Common Ground Section */}
<section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-20 items-center">
      
      <div className="relative group">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-200/40 rounded-full blur-[120px] group-hover:bg-indigo-300/60 transition-colors duration-700 transform-gpu" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-200/40 rounded-full blur-[120px] group-hover:bg-purple-300/60 transition-colors duration-700 transform-gpu" />
        
        <Card className="relative border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border transition-all duration-500 hover:shadow-indigo-500/10 transform-gpu">
          <CardContent className="p-8 sm:p-14">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
              
              <div className="flex flex-col items-center gap-4 z-10">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                  <MonitorPlay className="h-10 w-10 text-indigo-600" />
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Capture</span>
                  <p className="text-sm font-bold text-slate-700">Video/Text</p>
                </div>
              </div>

              <div className="relative flex flex-col items-center">
                <div className="hidden md:block absolute top-10 -left-24 w-24 h-[1px] bg-slate-200">
                   <div className="animate-data-flow" style={{ animationDelay: '0s' }} />
                </div>
                <div className="hidden md:block absolute top-10 -right-24 w-24 h-[1px] bg-slate-200">
                   <div className="animate-data-flow" style={{ animationDelay: '1.5s' }} />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-20 animate-pulse transform-gpu" />
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/20">
                    <Cpu className="h-12 w-12 text-white animate-[spin_10s_linear_infinite]" />
                  </div>
                </div>
                <span className="mt-6 text-xl font-black bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">TESTCRACK AI</span>
              </div>

              <div className="flex flex-col items-center gap-4 z-10">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                  <FileDown className="h-10 w-10 text-purple-600" />
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Generate</span>
                  <p className="text-sm font-bold text-slate-700">Insights</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6 w-fit border border-indigo-100">
          <Sparkles className="h-3.5 w-3.5" />
          Proprietary Intelligence
        </div>
        
        <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] mb-6">
          Clarity Over Cleverness <br />
          <span className="text-indigo-600">Always Wins.</span>
        </h2>
        
        <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-xl">
Our engine doesn't just track your mistakes; it benchmarks your performance against millions of data points to ensure you meet and exceed <span className="text-indigo-600 font-semibold ">Global Scoring Standards.</span>
        </p>

        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'IELTS', level: 'Academic/General' },
            { name: 'PTE', level: 'Pearson Official' },
            { name: 'SAT', level: 'Digital Board' },
            { name: 'GRE', level: 'Grad Readiness' }
          ].map((exam) => (
            <div 
              key={exam.name} 
              className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 group transform-gpu"
            >
              <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{exam.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{exam.level}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 text-sm text-slate-400 italic">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          Aligned with CEFR and Cambridge assessment frameworks.
        </div>
      </div>

    </div>
  </div>
</section>
  
{/* How It Works Section */}
<section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-indigo-50/50 rounded-[100%] blur-[120px] -z-10 transform-gpu" />

  <div className="max-w-7xl mx-auto relative">
    <div className="text-center mb-20">
      <Badge className="mb-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
        The Roadmap
      </Badge>
      <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
        Mastering your exams is <span className="text-indigo-700">simple.</span>
      </h2>
      <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
        Three intentional steps designed to take you from diagnostic uncertainty to exam-day confidence.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-12 relative">
      <div className="hidden md:block absolute top-12 left-20 right-20 h-[1px] bg-slate-200 -z-0">
        <div className="animate-data-flow" style={{ animationDelay: '0s', width: '40px' }} />
        <div className="animate-data-flow" style={{ animationDelay: '1s', width: '40px' }} />
        <div className="animate-data-flow" style={{ animationDelay: '2s', width: '40px' }} />
      </div>

      {[
        {
          step: '01',
          title: 'Data-Driven Goal Setting',
          description: 'Sign up for free and define your target score. Our engine immediately builds an AI-tailored curriculum mapped to your deadline and current skill level, ensuring every hour of study is optimized for your specific performance diagnostics.',
          icon: Users,
        },
        {
          step: '02',
          title: ' High-Stakes Performance Analysis',
          description: 'Upload your materials or take an adaptive mock test. Our proprietary AI Engine conducts a deep-dive assessment analysis to identify weak points instantly We dont just tell you whats wrong; we show you how to fix it according to Global Scoring Standards.',
          icon: Zap,
        },
        {
          step: '03',
          title: 'Precision Iteration',
          description: 'Practice with hyper-realistic simulations. Track your progress through our unique "Hireability Score" and predictive analytics. Move from "studying" to "dominating" and enter your exam center with the total certainty of a data-backed score.',
          icon: Target,
        },
      ].map((item, index) => (
        <div key={index} className="relative group">
          <Card className="h-full border-white/60 bg-white/50 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-500 border hover:-translate-y-2 transform-gpu">
            <CardContent className="p-8 pt-12 flex flex-col items-center text-center">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center text-white text-xl font-black z-20 group-hover:scale-110 transition-transform duration-500">
                {item.step}
              </div>
              <div className="mb-6 p-4 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors duration-500">
                <item.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-4 group-hover:text-indigo-700 transition-colors">
                {item.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {item.description}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>

    <div className="mt-20 text-center">
       <p className="text-slate-400 text-sm font-semibold flex items-center justify-center gap-2 italic">
         <Sparkles className="h-4 w-4 text-indigo-400" />
         Each step is powered by our proprietary TestCrack Neural Engine.
       </p>
    </div>
  </div>
</section>

{/* CTA Section */}
<section className="py-24 px-4 sm:px-6 lg:px-8 bg-indigo-700 relative overflow-hidden">
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[80%] rounded-full bg-indigo-600 blur-[120px] opacity-50 transform-gpu" />
    <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[80%] rounded-full bg-indigo-500 blur-[120px] opacity-30 transform-gpu" />
    <div className="absolute inset-0 opacity-10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] bg-[grid-white_20px]" />
  </div>

  <div className="max-w-5xl mx-auto relative z-10">
    <Card className="border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden py-12 transform-gpu">
      <CardContent className="text-center space-y-8">
        <div className="space-y-4">
          <Badge className="bg-white/10 text-white border-white/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Instant Access
          </Badge>
          <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
            Ready to Transform <br />
            <span className="text-indigo-200">Your Learning?</span>
          </h2>
          <p className="text-xl text-indigo-100/80 max-w-2xl mx-auto leading-relaxed font-medium">
            Join thousands of learners mastering IELTS, PTE, and SAT with the power of TestCrack AI.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            className="bg-white text-indigo-700 hover:bg-indigo-50 px-12 py-8 h-auto transition-all duration-300 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] hover:-translate-y-1 active:scale-95 text-lg font-bold group"
          >
            {user ? 'Go to Dashboard' : 'Get Started for Free'}
            <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Button>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {[
              { icon: ShieldCheck, text: 'No credit card required' },
              { icon: Sparkles, text: 'Free plan available' },
              { icon: Zap, text: 'Instant Setup' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-indigo-100/60 text-sm font-medium">
                <item.icon className="h-4 w-4" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-700 rounded-xl">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">TestCrack</span>
            </div>
            <p className="text-sm">
              © 2025 TestCrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;