// Spoken English onboarding walkthrough.
//
// The SE twin of OnboardingWalkthrough. It exists as a separate component rather
// than a branch inside that one because every slide's copy AND visual differs:
// SE is one skill (speaking), scored on the CEFR ladder via six subskills, with
// no bands, no four-skill grid, and no vocabulary-gate/IA/mock loop. Selected by
// OnboardingDispatch in App.tsx, so the IELTS path is untouched.
//
// Copy rules (SPOKEN-ENGLISH-STUDENT-FRONTEND-SPEC.md §6 + §7.6):
//   - the FULL CEFR disclaimer must appear at onboarding,
//   - never print a 0–9 band or a "/9" suffix,
//   - never use the banned terms near a score ("certified", "certificate",
//     "certification", "official CEFR level", "CEFR accredited", "recognised by
//     the Council of Europe").
// Everything described below is what the SE flow actually does today: the viva
// diagnostic, then a 3-drill gate that opens the dashboard, then per-subskill
// practice against the six-subskill profile.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Headphones,
  Target,
  Gauge,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { examDisplay } from '@/features/student/config/examDisplay';
import { SE_SUBSKILLS } from '@/features/student/config/spokenEnglishSubskills';
import testcrackLogo from '@/assets/testcrack-logo.svg';

// The dashboard's unlock gate is 3 drills (SpokenEnglishDashboardPage's
// DRILLS_TO_UNLOCK). Kept in sync by name here so the copy can't quietly drift.
const DRILLS_TO_UNLOCK = 3;

// ─── SLIDE DEFINITIONS ────────────────────────────────────────────────────────

const slides = [
  {
    id: 0,
    eyebrow: 'Spoken English on TestCrack',
    headline: 'One skill. Spoken out loud.',
    body: 'This is a speaking course, so everything here is measured by how you actually talk — not by reading passages or writing essays. You speak, we listen, and you get a picture of where your English sits.',
    cta: 'Next',
  },
  {
    id: 1,
    eyebrow: 'How You Are Measured',
    headline: 'Six parts of one skill.',
    body: 'Speaking is not a single score. Your voice is read across six separate subskills and placed on the CEFR ladder, from A1 through C2. Two people at the same level can be strong and weak in completely different places.',
    cta: 'Next',
  },
  {
    id: 2,
    eyebrow: 'One Thing First',
    headline: 'We need to hear you speak.',
    body: `The diagnostic is a short set of spoken prompts — you record your answers, and can re-record any of them before submitting. It runs once. After it, ${DRILLS_TO_UNLOCK} quick drills open up your dashboard, and everything you practise from then on is aimed at your weakest subskills.`,
    cta: 'Set up my diagnostic',
  },
];

// ─── VISUALS ──────────────────────────────────────────────────────────────────

function SpeakingFocusVisual() {
  const rows = [
    { icon: Mic, label: 'You record', desc: 'Short spoken answers, in your own words' },
    { icon: Headphones, label: 'We listen', desc: 'Every answer is reviewed for the six subskills' },
    { icon: Gauge, label: 'You get a level', desc: 'A CEFR estimate placed from A1 up to C2' },
  ];

  return (
    <div className="w-full max-w-sm space-y-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-4 rounded-2xl border border-brand-line-12 bg-white/[0.03] px-4 py-3.5"
        >
          <row.icon className="w-4 h-4 text-brand-mint shrink-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <p className="font-manrope text-[14px] font-bold text-white leading-tight">{row.label}</p>
            <p className="text-[12px] text-brand-on-ink leading-tight mt-0.5">{row.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubskillGridVisual() {
  return (
    <div className="w-full max-w-sm">
      <div className="grid grid-cols-2 gap-2.5">
        {SE_SUBSKILLS.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-brand-line-12 bg-white/[0.03] px-3.5 py-3"
          >
            <p className="font-manrope text-[13px] font-bold text-white leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      {/* The CEFR ladder, shown as a ladder rather than a number line — there is
          no 0–9 scale anywhere in SE. */}
      <div className="mt-3 flex items-center gap-1.5">
        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl, i) => (
          <div key={lvl} className="flex-1 text-center">
            <div
              className={cn('h-1.5 rounded-full', i <= 2 ? 'bg-brand-mint/70' : 'bg-white/15')}
            />
            <span className="font-jetbrains text-[9.5px] text-brand-on-ink mt-1 block">{lvl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosticInfoVisual() {
  const points = [
    'Which subskills become your daily priority',
    `The ${DRILLS_TO_UNLOCK} drills that open your dashboard`,
    'The coaching notes written back to you',
  ];

  return (
    <div className="w-full max-w-sm rounded-2xl border border-brand-line-12 bg-white/[0.03] p-5">
      <p className="font-jetbrains text-[10px] text-brand-on-ink uppercase tracking-[0.16em] mb-3">
        What the diagnostic sets
      </p>
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-brand-line-12">
        <Target className="w-6 h-6 text-white shrink-0" strokeWidth={1.5} />
        <span className="font-manrope text-[14px] font-bold text-white">Your starting CEFR level</span>
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
  if (id === 0) return <SpeakingFocusVisual />;
  if (id === 1) return <SubskillGridVisual />;
  return <DiagnosticInfoVisual />;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SpokenEnglishOnboarding() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const navigate = useNavigate();
  const { profile } = useAuth();

  const display = examDisplay(profile?.examId);
  // StudentExamLayout rewrites a wrong first segment anyway, but routing through
  // the real examId keeps this consistent with SpokenEnglishDashboardPage.
  const examId = profile?.examId ?? 'spoken_english';

  const goNext = () => {
    setDirection(1);
    setCurrent((p) => Math.min(p + 1, slides.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setCurrent((p) => Math.max(p - 1, 0));
  };

  const startDiagnostic = () => navigate(`/${examId}/diagnosis`);

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
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={testcrackLogo} alt="TestCrack" className="h-7 w-7 object-contain shrink-0" />
          <span className="font-manrope text-base font-extrabold text-white tracking-[-0.02em]">TestCrack</span>
        </div>
        <span className="font-jetbrains text-[12px] text-brand-on-ink shrink-0">
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

      {/*
        Full CEFR disclaimer. Required at onboarding by the exam config's
        legal.display_rules.show_full_at_onboarding, so it sits outside the slide
        animation — it must be on screen for every slide, not just one.
      */}
      {display.disclaimerFull && (
        <div className="relative z-10 px-6 sm:px-10 lg:px-16 shrink-0">
          <div className="mx-auto max-w-5xl rounded-xl border border-brand-line-12 bg-white/[0.02] px-4 py-3 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-brand-on-ink shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[11.5px] leading-[1.6] text-brand-on-ink">
              {display.disclaimerFull}
            </p>
          </div>
        </div>
      )}

      {/* Footer — progress dots + buttons */}
      <footer className="relative z-10 px-6 pb-8 pt-4 sm:px-10 lg:px-16 flex items-center justify-between gap-3 shrink-0">
        {current > 0 ? (
          <Button
            variant="ghost"
            onClick={goBack}
            className="flex items-center gap-1.5 text-brand-on-ink hover:text-white hover:bg-white/5 shrink-0"
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
          className="bg-brand-teal-700 hover:bg-brand-teal-600 text-white flex items-center gap-2 px-5 shrink-0"
        >
          <span className="truncate">{slide.cta}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Button>
      </footer>
    </div>
  );
}
