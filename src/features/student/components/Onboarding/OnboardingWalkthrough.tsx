import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Gamepad2,
  Target,
  ClipboardCheck,
  Headphones,
  PenLine,
  Mic,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';
import testcrackLogo from '@/assets/testcrack-logo.svg';

// ─── SLIDE DEFINITIONS ────────────────────────────────────────────────────────

const slides = [
  {
    id: 0,
    eyebrow: 'Diagnostic-First IELTS Prep',
    headline: 'Daily practice, not cramming.',
    body: 'Every day you open TestCrack, a 20–30 minute session is already waiting. No planning, no deciding what to study. The system knows what you need next and serves it up.',
    cta: 'Next',
  },
  {
    id: 1,
    eyebrow: 'The Same Loop, Every Day',
    headline: 'Four steps. Twenty minutes.',
    body: 'Practice, a vocabulary gate, three targeted drills, then assessments once you have earned them. The structure never changes, so the habit sticks.',
    cta: 'Next',
  },
  {
    id: 2,
    eyebrow: 'One Thing First',
    headline: 'We need to know where you stand.',
    body: 'The diagnostic runs once, covers all four skills, and takes about fifteen minutes. Everything after it is calibrated to the result.',
    cta: 'Set up my diagnostic',
  },
];

// ─── VISUALS ──────────────────────────────────────────────────────────────────

function SkillGridVisual() {
  const skills = [
    { icon: Headphones, label: 'Listening', tag: 'Auto Scored', tagColor: 'text-amber-400' },
    { icon: BookOpen, label: 'Reading', tag: 'Auto Scored', tagColor: 'text-brand-mint' },
    { icon: PenLine, label: 'Writing', tag: 'AI Scored', tagColor: 'text-violet-400' },
    { icon: Mic, label: 'Speaking', tag: 'AI Scored', tagColor: 'text-rose-400' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
      {skills.map((skill) => (
        <div
          key={skill.label}
          className="rounded-2xl border border-brand-line-12 bg-white/[0.03] px-4 py-4"
        >
          <skill.icon className="w-5 h-5 text-white/70 mb-6" strokeWidth={1.5} />
          <p className="font-manrope text-[14px] font-bold text-white">{skill.label}</p>
          <p className={cn('font-jetbrains text-[9.5px] uppercase tracking-[0.14em] mt-0.5', skill.tagColor)}>
            {skill.tag}
          </p>
        </div>
      ))}
    </div>
  );
}

function SessionLoopVisual() {
  const steps = [
    { icon: BookOpen, label: 'Practice', desc: 'Skill module at your level' },
    { icon: Gamepad2, label: 'Daily challenge', desc: 'Vocabulary gate — earn momentum' },
    { icon: Target, label: 'Drills', desc: 'Three targeted sub-skill questions' },
    { icon: ClipboardCheck, label: 'Assessments', desc: 'Unlock once the drills are done' },
  ];

  return (
    <div className="w-full max-w-sm space-y-2">
      {steps.map((step, i) => (
        <div
          key={step.label}
          className="flex items-center gap-4 rounded-2xl border border-brand-line-12 bg-white/[0.03] px-4 py-3.5"
        >
          <span className="font-jetbrains text-[10px] text-brand-mint shrink-0 w-4">
            B{i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-manrope text-[14px] font-bold text-white leading-tight">{step.label}</p>
            <p className="text-[12px] text-brand-on-ink leading-tight mt-0.5">{step.desc}</p>
          </div>
          <step.icon className="w-4 h-4 text-white/40 shrink-0" strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );
}

function DiagnosticInfoVisual() {
  const points = [
    'The difficulty of every drill you get',
    'Which skill becomes your daily priority',
    'The plan your tutor sees on day one',
  ];

  return (
    <div className="w-full max-w-sm rounded-2xl border border-brand-line-12 bg-white/[0.03] p-5">
      <p className="font-jetbrains text-[10px] text-brand-on-ink uppercase tracking-[0.16em] mb-3">
        What the diagnostic sets
      </p>
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-brand-line-12">
        <HelpCircle className="w-6 h-6 text-white shrink-0" strokeWidth={1.5} />
        <span className="font-manrope text-[14px] font-bold text-white">Your baseline band</span>
      </div>
      <ul className="space-y-2.5">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-[13px] text-brand-on-ink leading-snug">
            <span className="text-brand-mint shrink-0">→</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlideVisual({ id }: { id: number }) {
  if (id === 0) return <SkillGridVisual />;
  if (id === 1) return <SessionLoopVisual />;
  return <DiagnosticInfoVisual />;
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
  const isLast = current === slides.length - 1;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-brand-ink-deep font-plex antialiased flex flex-col relative overflow-hidden">
      {/* Faint blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Header — brand mark + slide counter */}
      <header className="relative z-10 px-6 pt-8 pb-2 sm:px-10 lg:px-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={testcrackLogo} alt="TestCrack" className="h-7 w-7 object-contain shrink-0" />
          <span className="font-manrope text-base font-extrabold text-white tracking-[-0.02em]">TestCrack</span>
        </div>
        <span className="font-jetbrains text-[12px] text-brand-on-ink">
          {current + 1} / {slides.length}
        </span>
      </header>

      {/* Slide area */}
      <main className="relative z-10 flex-1 flex items-center px-6 sm:px-10 lg:px-16 py-10">
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-16"
            >
              {/* Text */}
              <div className="w-full lg:w-1/2 lg:max-w-md">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px w-6 shrink-0 bg-brand-mint" aria-hidden="true" />
                  <span className="font-jetbrains text-[10.5px] uppercase tracking-[0.2em] text-brand-mint">
                    {slide.eyebrow}
                  </span>
                </div>
                <h1 className="font-manrope text-[32px] sm:text-[42px] font-extrabold text-white leading-[1.08] tracking-[-0.03em] mb-4">
                  {slide.headline}
                </h1>
                <p className="text-brand-on-ink text-[15px] leading-[1.75]">
                  {slide.body}
                </p>
              </div>

              {/* Visual */}
              <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                <SlideVisual id={slide.id} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer — progress dots + buttons */}
      <footer className="relative z-10 px-6 pb-8 pt-4 sm:px-10 lg:px-16 flex items-center justify-between shrink-0">
        {current > 0 ? (
          <Button
            variant="ghost"
            onClick={goBack}
            className="flex items-center gap-1.5 text-brand-on-ink hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        ) : (
          <span />
        )}

        {/* Progress dots */}
        <div className="hidden sm:flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 h-2 bg-brand-mint'
                  : 'w-2 h-2 bg-white/15'
              )}
            />
          ))}
        </div>

        <Button
          onClick={isLast ? startDiagnostic : goNext}
          className="bg-brand-teal-700 hover:bg-brand-teal-600 text-white flex items-center gap-2 px-5"
        >
          {slide.cta}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </footer>
    </div>
  );
}
