// HomeInstitute — the institute-buyer marketing home page (route.home, "/").
//
// Every visible exam name reads from the exam directory config, never a hand-typed
// literal (TC-02 Q14, TC-03 §5.1). Every headline here is a mechanism claim, not an
// outcome claim — no band/score/rank/success-percentage language anywhere on this
// page (CCPA Coaching Guidelines 2024, §C1). See the revamp keyword-directory brief.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils';

import testcrackLogo from '@/assets/testcrack-logo.svg';
import {
  FileText,
  MessagesSquare,
  Radar,
  LayoutGrid,
  Users2,
  ClipboardList,
  Sparkles,
  BookOpenCheck,
  BarChart3,
  Blocks,
  Mic,
  ArrowRight,
  MessageSquareText,
  ShieldCheck,
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  Linkedin,
  Instagram,
  Youtube,
  ImageOff,
} from 'lucide-react';

import { EXAM_DIRECTORY, EXAM_STATUS_LABELS, EXAM_ROUTE_LIVE } from '../config/examDirectory';

const DEMO_WHATSAPP_NUMBER = '919995684689';

// ─── A4 · Problems we solve ─────────────────────────────────────────────────────
// Each one names a mechanism, never a result — see the brief, Part A4.
const PROBLEMS = [
  { key: 'copy.problem.papers', icon: FileText, title: 'Question papers are built by hand, one exam at a time', body: 'A question bank with difficulty tagging, shared across batches and exams.' },
  { key: 'copy.problem.evaluation', icon: MessagesSquare, title: 'Speaking and writing take longer to evaluate than to teach', body: 'A speaking AI scorer and a writing scorer take the marking load off your tutors.' },
  { key: 'copy.problem.analytics', icon: Radar, title: 'No view of who is falling behind until it is too late', body: 'An at-risk classifier and drop-off alerts surface disengagement while there is still time to act.' },
  { key: 'copy.problem.subskill', icon: LayoutGrid, title: 'A single score says a student is weak, not which sub-skill is', body: 'A competency matrix breaks every score down to the sub-skill level.' },
  { key: 'copy.problem.tutorload', icon: Users2, title: 'Tutor attention is spread evenly instead of where it is needed', body: 'Batch insights and tutor-effectiveness views point attention at the students who need it most.' },
  { key: 'copy.problem.offline', icon: ClipboardList, title: 'Offline test marks live in a register and never reach the data', body: 'Add offline marks directly, so paper-based tests feed the same analytics as everything else.' },
  { key: 'copy.problem.newexam', icon: Blocks, title: 'Adding an exam means starting the whole setup again', body: 'An exam-agnostic engine and config layer — a new exam is a configuration, not a development project.', highlight: true },
] as const;

// ─── A5 · Feature keys ──────────────────────────────────────────────────────────
// copy.feature.generator ships as the SAFE label — the verification engine that
// backs the unqualified "AI question generator" claim has not shipped (TC-03 §8.2).
const FEATURES = [
  { key: 'copy.feature.generator.safe', icon: BookOpenCheck, title: 'Question bank with difficulty tagging', body: 'Questions drafted, reviewed and difficulty-tagged before they ever reach a student.' },
  { key: 'copy.feature.mocks', icon: Sparkles, title: 'Mock tests', body: 'Full-length mock tests with per-section timers, run on the same engine as the real assessment.' },
  { key: 'copy.feature.evaluation', icon: MessagesSquare, title: 'Automatic evaluation', body: 'Speaking and writing responses scored automatically, with a rationale attached to every mark.' },
  { key: 'copy.feature.speaking', icon: Mic, title: 'Speaking & writing assessment', body: 'Structured speaking and writing assessment, built for every skill an exam actually tests.' },
  { key: 'copy.feature.analytics', icon: BarChart3, title: 'Batch & sub-skill analytics', body: 'Competency matrices and at-risk detection at both the student and the batch level.' },
  { key: 'copy.feature.multiexam', icon: Blocks, title: 'One platform, every exam', body: 'One exam-config registry behind every exam you teach — configure a new one without a rebuild.' },
] as const;

// ─── A6 · How it works ──────────────────────────────────────────────────────────
const HOW_STEPS = [
  { step: '01', title: 'Tell us your exam', body: 'Any exam you already teach. If it is not on the platform, it is a configuration, not a development project.' },
  { step: '02', title: 'We configure it', body: 'Skills, scoring, question bank and difficulty levels set up for your exam and your batches.' },
  { step: '03', title: 'Import your students', body: 'Bulk import into batches. Tutors are assigned to batches, not to exams.' },
  { step: '04', title: 'Start assessing', body: 'Students take diagnostics and drills. Evaluation is automatic. Tutors see sub-skill gaps and at-risk alerts from day one.' },
] as const;

// ─── A7 · Proof slot ─────────────────────────────────────────────────────────────
// Every screenshot on this section must come from a seeded demo_institute fixture —
// never a real institute or student (DPDP disclosure risk). None exists yet, so this
// renders an honest placeholder rather than fabricated data.
const PROOF_SLOTS = [
  { key: 'media.proof.dashboard', label: 'Institute dashboard' },
  { key: 'media.proof.diagnosis', label: 'Sample sub-skill diagnosis' },
  { key: 'media.proof.speaking', label: 'Speaking evaluation' },
  { key: 'media.proof.batch', label: 'Batch insights' },
] as const;

type CtaIntent = 'demo' | 'consultation';

const HomeInstitute = () => {
  const navigate = useNavigate();
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaIntent>('demo');
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

  const openModal = (intent: CtaIntent) => {
    setCtaIntent(intent);
    setDemoModalOpen(true);
  };

  const handleDemoSubmit = () => {
    if (!demoForm.name.trim() || !demoForm.institute.trim() || !demoForm.whatsapp.trim()) return;
    const intro = ctaIntent === 'consultation'
      ? "Hi TestCrack team! I'd like to schedule a free consultation."
      : "Hi TestCrack team! I'd like to request a demo.";
    const message = encodeURIComponent(
      `${intro}\n\nName: ${demoForm.name}\nInstitute: ${demoForm.institute}\nCity: ${demoForm.city || '-'}\nWhatsApp: ${demoForm.whatsapp}\nEmail: ${demoForm.email || '-'}`
    );
    window.open(`https://wa.me/${DEMO_WHATSAPP_NUMBER}?text=${message}`, '_blank');
    setDemoSubmitted(true);
  };

  const closeDemoModal = () => {
    setDemoModalOpen(false);
    setDemoSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-white font-plex text-brand-text antialiased">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-ink-nav border-b border-brand-line-12 transform-gpu">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
              <span className="font-manrope text-xl font-extrabold tracking-[-0.03em] text-brand-bg">TestCrack</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/exams/ielts-preparation')}
                className="h-auto rounded-md border border-brand-line-25 bg-transparent px-4 py-2 text-[13.5px] font-semibold text-brand-bg shadow-none transition-colors duration-150 hover:border-brand-line-60 hover:bg-brand-wash-06"
              >
                IELTS Prep
              </Button>
              <Button
                onClick={() => openModal('demo')}
                className="h-auto rounded-md border-none bg-brand-teal px-4 py-2 text-[13.5px] font-semibold text-white shadow-none transition-colors duration-150 hover:bg-brand-teal-dark active:scale-95"
              >
                Book a demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════ home.hero ══════════════════════════════ */}
      <section className="relative overflow-hidden bg-brand-ink-deep pt-28 pb-24 px-4 sm:px-6 lg:px-8">
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

        <div className="relative max-w-5xl mx-auto w-full text-center">
          <div className="flex items-center justify-center gap-3 mb-7">
            <span className="h-px w-7 shrink-0 bg-brand-mint" aria-hidden="true" />
            <span className="font-jetbrains text-[11px] uppercase tracking-[0.2em] text-brand-mint">
              Assessment Infrastructure for Training Institutes
            </span>
            <span className="h-px w-7 shrink-0 bg-brand-mint" aria-hidden="true" />
          </div>

          <h1 className="font-manrope text-[40px] sm:text-[56px] xl:text-[68px] font-extrabold leading-[1.04] tracking-[-0.03em] text-white mb-6">
            One AI platform. <span className="text-brand-mint">Any exam.</span>
          </h1>

          <p className="max-w-[640px] mx-auto text-[16.5px] leading-[1.75] text-brand-on-ink mb-10">
            Assessment infrastructure for training institutes — question papers, mock tests, evaluation and analytics for every exam you teach, on one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button
              onClick={() => openModal('demo')}
              className="group h-auto rounded-md border-none bg-brand-teal px-6 py-3 text-[14.5px] font-semibold text-white shadow-none transition-colors duration-150 hover:bg-brand-teal-dark active:scale-95"
            >
              Book a demo
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              onClick={() => openModal('consultation')}
              className="h-auto rounded-md border border-brand-line-25 bg-transparent px-6 py-3 text-[14.5px] font-semibold text-brand-bg shadow-none transition-colors duration-150 hover:border-brand-line-60 hover:bg-brand-wash-06 active:scale-95"
            >
              Schedule a free consultation
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ home.problems ══════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">The Industry Challenge</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-6 leading-[1.1] tracking-[-0.04em]">
              Problems we <span className="text-brand-teal">solve.</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-3xl mx-auto leading-[1.7]">
              Every row here is a mechanism we ship, not a promised result.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-brand-line border border-brand-line">
            {PROBLEMS.map((problem) => (
              <Card
                key={problem.key}
                className={cn(
                  'border-0 rounded-none shadow-none transform-gpu',
                  problem.highlight ? 'bg-brand-ink-deep' : 'bg-white'
                )}
              >
                <CardContent className="p-6 h-full flex flex-col">
                  <div
                    className={cn(
                      'p-2.5 rounded-[4px] w-fit mb-5',
                      problem.highlight ? 'bg-brand-teal/20' : 'bg-brand-teal-wash'
                    )}
                    aria-hidden="true"
                  >
                    <problem.icon className={cn('h-5 w-5', problem.highlight ? 'text-brand-mint' : 'text-brand-teal')} />
                  </div>
                  <h3
                    className={cn(
                      'font-manrope text-[16px] font-bold mb-2.5 leading-tight tracking-[-0.02em]',
                      problem.highlight ? 'text-white' : 'text-brand-ink'
                    )}
                  >
                    {problem.title}
                  </h3>
                  <p className={cn('text-[13.5px] leading-[1.7]', problem.highlight ? 'text-brand-on-ink' : 'text-brand-text-mute')}>
                    {problem.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ home.exams ══════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mb-4 leading-[1.1] tracking-[-0.04em]">
              One platform. <span className="text-brand-teal">Unlimited exams.</span>
            </h2>
            <p className="text-[16.5px] text-brand-text-mute max-w-2xl mx-auto leading-[1.7]">
              Every exam is a row in configuration, not a separate build. Here is what that looks like today.
            </p>
          </div>

          {/* Typographic tiles only — no examination-body logos, colours or lockups
              anywhere on this grid (trademark rule C2 §3). */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-brand-line border border-brand-line">
            {EXAM_DIRECTORY.map((exam) => {
              const liveRoute = EXAM_ROUTE_LIVE[exam.key];
              const isLive = exam.status === 'live' && !!liveRoute;
              const Tile = (
                <CardContent className="p-5 h-full flex flex-col items-center justify-center text-center gap-3">
                  <p className="font-manrope text-[15px] font-bold text-brand-ink tracking-[-0.01em]">
                    {exam.displayName}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'px-2.5 py-0.5 font-jetbrains text-[9.5px] font-normal tracking-[0.1em] uppercase rounded-[4px] border',
                      exam.status === 'live'
                        ? 'bg-brand-teal-wash text-brand-teal border-brand-teal-tint hover:bg-brand-teal-wash'
                        : exam.status === 'in_build'
                          ? 'bg-brand-warm-tint text-brand-warm border-[#F7D9C7] hover:bg-brand-warm-tint'
                          : 'bg-brand-bg text-brand-text-mute border-brand-line hover:bg-brand-bg'
                    )}
                  >
                    {EXAM_STATUS_LABELS[exam.status]}
                  </Badge>
                </CardContent>
              );
              return isLive ? (
                <Card
                  key={exam.key}
                  onClick={() => navigate(liveRoute!)}
                  className="border-0 bg-white rounded-none shadow-none transform-gpu cursor-pointer hover:bg-brand-teal-wash/40 transition-colors duration-150"
                >
                  {Tile}
                </Card>
              ) : (
                <Card key={exam.key} className="border-0 bg-white rounded-none shadow-none transform-gpu">
                  {Tile}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ home.features ══════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-brand-bg-alt">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">What TestCrack Delivers</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-6 leading-[1.1] tracking-[-0.04em]">
              Built for every exam you <span className="text-brand-teal">teach.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-line border border-brand-line">
            {FEATURES.map((feature) => (
              <Card key={feature.key} className="border-0 bg-white rounded-none shadow-none transform-gpu flex flex-col h-full">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="p-3 bg-brand-teal-wash rounded-[4px] w-fit mb-6" aria-hidden="true">
                    <feature.icon className="h-6 w-6 text-brand-teal" />
                  </div>
                  <h3 className="font-manrope text-[19px] font-bold text-brand-ink mb-3 tracking-[-0.02em]">{feature.title}</h3>
                  <p className="text-brand-text-mute text-[14.5px] leading-[1.7]">{feature.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ home.how ══════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-transparent text-brand-teal hover:bg-transparent border-none px-0 py-1 rounded-none font-jetbrains text-[11px] font-normal uppercase tracking-[0.18em]">
              How It Works
            </Badge>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mb-6 leading-[1.1] tracking-[-0.04em]">
              From your exam to your <span className="text-brand-teal">first batch.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {HOW_STEPS.map((item, index) => (
              <div key={item.step} className="relative">
                <Card
                  className={cn(
                    'h-full rounded-none shadow-none transform-gpu border',
                    index === 0 ? 'bg-brand-ink-deep border-brand-ink-deep' : 'bg-white border-brand-line'
                  )}
                >
                  <CardContent className="p-8 pt-12 flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-md flex items-center justify-center font-jetbrains text-xl font-bold z-20',
                        index === 0 ? 'bg-brand-mint text-brand-ink-deep' : 'bg-brand-teal text-white'
                      )}
                      aria-hidden="true"
                    >
                      {item.step}
                    </div>
                    <h3 className={cn('font-manrope text-[18px] font-bold mb-4 tracking-[-0.02em]', index === 0 ? 'text-white' : 'text-brand-ink')}>
                      {item.title}
                    </h3>
                    <p className={cn('text-[14px] leading-[1.7]', index === 0 ? 'text-brand-on-ink' : 'text-brand-text-mute')}>
                      {item.body}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ home.proof ══════════════════════════════
          No screenshot exists yet from a seeded demo_institute fixture. Rendering a
          real screenshot here without one would be either fabricated data or a DPDP
          disclosure risk (a real institute/student) — so this is an honest
          placeholder, not a stand-in image. */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-brand-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-jetbrains text-[11px] text-brand-teal uppercase tracking-[0.18em]">See It In Action</span>
            <h2 className="font-manrope text-4xl sm:text-5xl font-extrabold text-brand-ink mt-4 mb-4 leading-[1.1] tracking-[-0.04em]">
              What your tutors will <span className="text-brand-teal">see.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PROOF_SLOTS.map((slot) => (
              <div
                key={slot.key}
                className="flex flex-col items-center justify-center gap-3 aspect-video border-2 border-dashed border-brand-line rounded-lg bg-white text-brand-text-mute"
              >
                <ImageOff className="h-6 w-6" aria-hidden="true" />
                <p className="font-jetbrains text-[11px] uppercase tracking-[0.14em]">{slot.label}</p>
                <p className="text-[12px] text-brand-text-mute">Demo capture pending — seeded institute only</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ home.cta ══════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-brand-ink relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <Card className="border border-brand-line-16 bg-transparent rounded-none shadow-none overflow-hidden py-12 transform-gpu">
            <CardContent className="text-center space-y-8">
              <div className="space-y-4">
                <Badge className="bg-transparent text-brand-teal-soft hover:bg-transparent border-none px-0 py-1 rounded-none font-jetbrains text-[11px] font-normal uppercase tracking-[0.18em]">
                  Start a 30-day pilot
                </Badge>
                <h2 className="font-manrope text-4xl sm:text-6xl font-extrabold text-brand-bg leading-[1.05] tracking-[-0.04em]">
                  See it on your <br />
                  <span className="text-brand-teal-soft">own batch.</span>
                </h2>
                <p className="text-[18px] text-brand-on-ink max-w-2xl mx-auto leading-[1.7]">
                  Bring one batch, one exam, onto TestCrack and see the platform run against your own students.
                </p>
              </div>
              <div className="flex flex-col items-center gap-6">
                <Button size="lg" onClick={() => openModal('demo')} className="px-7 py-[15px] h-auto rounded-md bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-[15.5px] transition-colors duration-150 active:scale-95 border-none">
                  <MessageSquareText className="mr-2 h-5 w-5" aria-hidden="true" />
                  Book a demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-brand-ink-deep text-brand-on-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-center space-x-3">
                <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain" />
                <div>
                  <span className="font-manrope text-[18px] font-extrabold tracking-[-0.03em] text-brand-bg">TestCrack</span>
                  <span className="block font-jetbrains text-[10.5px] text-brand-teal-soft tracking-[0.16em] uppercase">for Institutes</span>
                </div>
              </div>

              <p className="text-[14px] text-brand-on-ink leading-[1.65] max-w-sm">
                Assessment infrastructure for training institutes — question papers, mock tests, evaluation and analytics for every exam you teach, on one platform.
              </p>

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

            <div className="flex flex-col gap-5">
              <h4 className="font-jetbrains text-[10.5px] text-brand-teal-soft uppercase tracking-[0.16em]">Exams</h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <a href="/exams/ielts-preparation" className="text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    IELTS Preparation
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => openModal('demo')}
                    className="text-[14px] text-brand-on-ink hover:text-brand-bg transition-colors duration-150 text-left flex items-center gap-1.5 group"
                  >
                    <MessageSquareText className="h-3.5 w-3.5 text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    Request a demo
                  </button>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Compliance disclaimer — C1, uniform font, sits alongside every claim on this page */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-[12.5px] text-brand-on-ink-mute leading-[1.6] text-center">
              TestCrack is an independent preparation and assessment platform. It is not affiliated with, endorsed by, or a testing provider for any examination body.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-brand-on-ink-mute text-center sm:text-left">
              © 2026 TestCrack. Assessment infrastructure for training institutes. All rights reserved.
            </p>
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

      {/* Demo / Consultation Request Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-brand-ink/70" onClick={closeDemoModal}>
          <div className="w-full max-w-md bg-white border border-brand-line overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="demo-modal-title">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-line bg-brand-bg">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-teal rounded-[4px]" aria-hidden="true">
                  <MessageSquareText className="h-4 w-4 text-white" />
                </div>
                <h3 id="demo-modal-title" className="font-manrope text-[18px] font-extrabold text-brand-ink tracking-[-0.02em]">
                  {ctaIntent === 'consultation' ? 'Schedule a Free Consultation' : 'Book a Demo'}
                </h3>
              </div>
              <button onClick={closeDemoModal} className="p-1.5 rounded-[4px] text-brand-text-mute hover:text-brand-ink hover:bg-brand-bg-alt transition-colors duration-150" aria-label="Close">
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
                  { field: 'institute' as const, label: 'Institute Name *', placeholder: 'e.g. Crest Academy, Kochi', type: 'text' },
                  { field: 'city' as const, label: 'City', placeholder: 'e.g. Kochi', type: 'text' },
                  { field: 'whatsapp' as const, label: 'WhatsApp Number *', placeholder: 'e.g. 9876543210', type: 'tel' },
                  { field: 'email' as const, label: 'Email', placeholder: 'e.g. priya@crestacademy.in', type: 'email' },
                ].map((input) => (
                  <div key={input.field} className="space-y-1.5">
                    <label htmlFor={`home-demo-${input.field}`} className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.14em]">{input.label}</label>
                    <input
                      id={`home-demo-${input.field}`}
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

export default HomeInstitute;
