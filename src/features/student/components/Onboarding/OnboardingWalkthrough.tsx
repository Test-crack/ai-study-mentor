import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Gamepad2,
  Target,
  ClipboardCheck,
  Headphones,
  PenLine,
  Mic,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';

// ─── SLIDE DEFINITIONS ────────────────────────────────────────────────────────

const slides = [
  {
    id: 0,
    headline: 'Welcome to TestCrack',
    subHeadline: 'Your IELTS preparation, structured for real results',
    body: 'TestCrack is built around one idea: consistent daily practice beats cramming. Every day you open the app, a fresh 20–30 minute session is ready for you — no planning required. The system knows exactly what you need to work on and serves it up automatically.',
    visual: 'welcome',
  },
  {
    id: 1,
    headline: 'What Happens Every Day',
    subHeadline: 'A focused loop designed to build your band score steadily',
    body: 'Each session follows the same proven four-step structure, every single day.',
    visual: 'session',
  },
  {
    id: 2,
    headline: "First, Let's Find Your Level",
    subHeadline: 'A one-time diagnostic across all four IELTS skills',
    body: 'Before your daily sessions begin, TestCrack needs to understand where you are right now. The diagnostic covers all four skills and takes about 15–20 minutes. Your answers set your baseline band score and determine the difficulty of every question going forward. You only do this once.',
    visual: 'diagnostic',
  },
];

// ─── VISUALS ──────────────────────────────────────────────────────────────────

function WelcomeVisual() {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
        <GraduationCap className="w-12 h-12 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
      </div>
      <div className="flex gap-2 mt-2">
        {['Listening', 'Reading', 'Writing', 'Speaking'].map((skill) => (
          <span
            key={skill}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function SessionVisual() {
  const steps = [
    { icon: BookOpen, label: 'Practice', desc: 'Skill module at your level', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { icon: Gamepad2, label: 'Daily Challenge', desc: 'Vocab gate — earn momentum', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { icon: Target, label: 'Drills', desc: '3 targeted sub-skill questions', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { icon: ClipboardCheck, label: 'Assessments', desc: 'IA & Mock (unlocks after drills)', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <div className="w-full py-4 space-y-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-3">
          {/* Step number + connector */}
          <div className="flex flex-col items-center w-8 shrink-0">
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mt-1" />
            )}
          </div>
          {/* Card */}
          <div className={cn('flex-1 flex items-center gap-3 rounded-xl px-3 py-2.5', step.bg)}>
            <step.icon className={cn('w-5 h-5 shrink-0', step.color)} />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DiagnosticVisual() {
  const skills = [
    { icon: Headphones, label: 'Listening', color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-500/10' },
    { icon: BookOpen, label: 'Reading', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { icon: PenLine, label: 'Writing', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { icon: Mic, label: 'Speaking', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 py-4 w-full">
      {skills.map((skill) => (
        <div
          key={skill.label}
          className={cn(
            'flex flex-col items-center gap-2 rounded-2xl px-4 py-5',
            skill.bg
          )}
        >
          <skill.icon className={cn('w-7 h-7', skill.color)} strokeWidth={1.5} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{skill.label}</span>
        </div>
      ))}
    </div>
  );
}

function SlideVisual({ id }: { id: number }) {
  if (id === 0) return <WelcomeVisual />;
  if (id === 1) return <SessionVisual />;
  return <DiagnosticVisual />;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OnboardingWalkthrough() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const navigate = useNavigate();

  const goNext = () => {
    setDirection(1);
    setCurrent((p) => Math.min(p + 1, slides.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setCurrent((p) => Math.max(p - 1, 0));
  };

  const startDiagnostic = () => navigate('/student/diagnosis');

  const slide = slides[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Header — brand mark only */}
      <header className="px-6 pt-8 pb-2 flex items-center justify-between">
        <span className="text-lg font-bold text-indigo-600 tracking-tight">TestCrack</span>
        <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">
          {current + 1} / {slides.length}
        </span>
      </header>

      {/* Slide area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* Visual */}
              <SlideVisual id={slide.id} />

              {/* Text */}
              <div className="mt-2">
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                  {slide.subHeadline}
                </p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  {slide.headline}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {slide.body}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer — progress dots + buttons */}
      <footer className="px-6 pb-10 pt-4 flex flex-col items-center gap-6 w-full max-w-md mx-auto">
        {/* Progress dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 h-2 bg-indigo-600'
                  : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'
              )}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full">
          {current > 0 && (
            <Button
              variant="ghost"
              size="lg"
              onClick={goBack}
              className="flex items-center gap-1 text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}

          <div className={cn('flex-1', current === 0 && 'w-full')}>
            {current < slides.length - 1 ? (
              <Button
                size="lg"
                onClick={goNext}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={startDiagnostic}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
              >
                Start Your Diagnostic
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}