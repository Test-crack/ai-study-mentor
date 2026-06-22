import { useState } from 'react';
import {
  Gamepad2, Target, Flame, Zap, ClipboardCheck, FileText,
  TrendingUp, ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { cn } from '@/shared/utils';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
}

// ─── SECTIONS CONFIG ──────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: 'lexigrid', icon: Gamepad2,       label: 'Daily Challenge (LexiGrid)', color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-200 dark:border-amber-500/30'  },
  { id: 'drills',   icon: Target,         label: 'Drills',                     color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/30' },
  { id: 'streak',   icon: Flame,          label: 'Daily Streak',               color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/30' },
  { id: 'momentum', icon: Zap,            label: 'Momentum Points',            color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/30' },
  { id: 'ia',       icon: ClipboardCheck, label: 'Internal Assessment',        color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/30' },
  { id: 'mock',     icon: FileText,       label: 'Full Mock Test',             color: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-500/10',     border: 'border-rose-200 dark:border-rose-500/30'    },
  { id: 'band',     icon: TrendingUp,     label: 'How Band Score Updates',     color: 'text-teal-600',   bg: 'bg-teal-50 dark:bg-teal-500/10',     border: 'border-teal-200 dark:border-teal-500/30'    },
];

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────

function SectionCard({ section, children }: { section: Section; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={cn('rounded-2xl border', section.bg, section.border)} id={section.id}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', section.bg)}>
            <section.icon className={cn('w-4 h-4', section.color)} />
          </div>
          <h2 className={cn('text-sm font-bold', section.color)}>{section.label}</h2>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-3">
      <span className="text-sm text-slate-600 dark:text-slate-400 flex-1 leading-snug">{label}</span>
      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
        {note && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{note}</p>}
      </div>
    </div>
  );
}

function InfoBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warn' | 'success' }) {
  const styles = {
    info:    'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
    warn:    'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
    success: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  };
  return (
    <div className={cn('text-sm rounded-xl border px-4 py-3 leading-relaxed', styles[variant])}>
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 pt-1">
      {children}
    </p>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function HowItWorks() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered,   setIsSidebarHovered]   = useState(false);
  const [activeSection,      setActiveSection]       = useState<string | null>(null);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="how-it-works"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(c => !c)}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      />

      <div className={`transition-all duration-300 ease-in-out pl-0 ${
        isSidebarHovered ? 'md:pl-[288px]' : 'md:pl-[116px]'
      } flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-3xl mx-auto">

            {/* ── Header ── */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">How It Works</h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 ml-[52px]">
                Points, streaks, assessments, and how your band score improves — all in one place.
              </p>
            </div>

            {/* ── Quick-jump nav ── */}
            <div className="flex flex-wrap gap-2 mb-6">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                    activeSection === s.id
                      ? cn(s.bg, s.border, s.color)
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* ── Sections ── */}
            <div className="space-y-4">

              {/* LEXIGRID */}
              <SectionCard section={SECTIONS[0]}>
                <InfoBox>
                  LexiGrid is your daily vocabulary warm-up. You get <strong>5 words per day</strong>. Each word is a hidden IELTS-level word — you type letter by letter to reveal it, like Wordle. Complete it before starting your second drill to unlock the full daily session.
                </InfoBox>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Words per day" value="5" />
                  <Row label="Tries per word" value="3 attempts" note="Wrong guess clears your input" />
                  <Row label="Points per word solved" value="+15 pts" />
                  <Row label="All-5 bonus (first/second try only)" value="+5 pts extra" note="75 pts total max per day" />
                  <Row label="Resets" value="Every day at midnight" />
                </div>
                <InfoBox variant="info">
                  <strong>How to play:</strong> The word is hidden as blank tiles. Tap a letter on the keyboard to fill in your guess. If correct, the tile turns green. If wrong, it flashes red and clears. You have 3 attempts per word before it auto-skips to the next one.
                </InfoBox>
              </SectionCard>

              {/* DRILLS */}
              <SectionCard section={SECTIONS[1]}>
                <InfoBox>
                  Drills are 5-question targeted sessions on your weakest sub-skills. The system auto-picks your skill and difficulty based on your current band score. After each drill you get an Apply Drill — a short writing or speaking prompt to reinforce what you practised.
                </InfoBox>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Questions per session" value="5 questions" />
                  <Row label="Base momentum per session" value="+15 pts" />
                  <Row label="Per correct answer" value="+10 pts each" note="Max +65 pts per session (all correct)" />
                  <Row label="Apply Drill bonus" value="+30 pts" />
                  <Row label="Free drills per day" value="2 sessions" />
                  <Row label="Extra drill cost" value="75 momentum pts" note="Only available after 75% Daily Completion Score" />
                </div>
                <InfoBox variant="warn">
                  <strong>Daily Completion Score (DCS):</strong> You must hit ≥ 75% DCS to buy an extra drill. The "Buy Extra Drill" button only appears when both DCS ≥ 75% and you have ≥ 75 momentum pts.
                </InfoBox>
              </SectionCard>

              {/* STREAK */}
              <SectionCard section={SECTIONS[2]}>
                <InfoBox>
                  Your streak counts consecutive days of activity. To earn a streak day you must complete at least <strong>2 drill sessions</strong>. Missing a day resets your streak to zero.
                </InfoBox>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Minimum drills for a streak day" value="2 drill sessions" />
                  <Row label="Streak increments when" value="2nd drill of the day is completed" />
                  <Row label="Streak resets if" value="You miss a full day" note="Checked every time you load the app" />
                  <Row label="Streak displayed" value="Dashboard topbar + drill result screen" />
                </div>
                <InfoBox variant="info">
                  LexiGrid and Apply Drill count toward momentum but <strong>do not</strong> count toward streak. Only drill sessions count.
                </InfoBox>
              </SectionCard>

              {/* MOMENTUM */}
              <SectionCard section={SECTIONS[3]}>
                <InfoBox>
                  Momentum is your in-app currency. Earn it by completing activities, lose it for missed assessments, spend it to unlock extras. It never expires.
                </InfoBox>

                <SubLabel>Earning Points</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="LexiGrid — per word solved" value="+15 pts" />
                  <Row label="LexiGrid — all-5 bonus" value="+5 pts" note="All 5 words, first or second try" />
                  <Row label="Drill session — base" value="+15 pts" />
                  <Row label="Drill session — per correct answer" value="+10 pts" note="Up to +50 pts extra (5 correct)" />
                  <Row label="Apply Drill completion" value="+30 pts" />
                  <Row label="Internal Assessment completion" value="+100 pts" />
                  <Row label="Internal Assessment — band improved" value="+25 pts bonus" note="On top of the 100 pts" />
                  <Row label="Full Mock Test completion" value="+200 pts" />
                </div>

                <SubLabel>Losing Points</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Missed Internal Assessment (1st miss)" value="−20 pts" />
                  <Row label="Missed Internal Assessment (2nd consecutive)" value="−40 pts" />
                </div>

                <SubLabel>Spending Points</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Buy 1 extra drill session" value="75 pts" note="Requires DCS ≥ 75% that day" />
                  <Row label="Buy extra Full Mock Test" value="1,500 pts" note="Requires ≥ 4 IAs + 14 days on platform + band improvement" />
                </div>
              </SectionCard>

              {/* INTERNAL ASSESSMENT */}
              <SectionCard section={SECTIONS[4]}>
                <InfoBox>
                  The Internal Assessment (IA) tests one skill in depth. It unlocks automatically once you meet the criteria. You get a 24-hour window to complete it — miss the window and lose 20 momentum pts.
                </InfoBox>

                <SubLabel>Unlock Criteria</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Total drills completed" value="6 drill sessions" note="Across all skills" />
                  <Row label="Time on platform" value="At least 2 calendar days" note="Since your first drill session" />
                </div>

                <SubLabel>Format</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Questions" value="10 questions" />
                  <Row label="Time limit" value="20 minutes" />
                  <Row label="Window to complete" value="24 hours after unlocking" />
                  <Row label="Resume window (if interrupted)" value="18 minutes" />
                  <Row label="Total IAs available" value="6 (one per skill cycle)" />
                  <Row label="After all 6 IAs" value="Full Mock Test unlocks" />
                </div>

                <SubLabel>Penalties for Missing</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="1st missed IA" value="−20 momentum pts" />
                  <Row label="2nd consecutive missed IA" value="−40 momentum pts" />
                </div>

                <InfoBox variant="warn">
                  <strong>Important:</strong> Each penalty is applied only once per missed cycle — you won't be double-charged for the same miss.
                </InfoBox>
              </SectionCard>

              {/* FULL MOCK TEST */}
              <SectionCard section={SECTIONS[5]}>
                <InfoBox>
                  The Full Mock Test is a complete IELTS simulation covering all four skills with official time limits. Unlocks after all 6 IAs and measurable improvement.
                </InfoBox>

                <SubLabel>Standard Unlock Criteria</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Internal Assessments completed" value="All 6 IAs" />
                  <Row label="Skills covered" value="All 4 skills via IAs" />
                  <Row label="Band improvement required" value="≥ 0.5 band gain in at least 1 skill" note="Compared to your diagnostic baseline" />
                </div>

                <SubLabel>Official Time Limits</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Listening" value="30 minutes" />
                  <Row label="Reading"   value="60 minutes" />
                  <Row label="Writing"   value="60 minutes" />
                  <Row label="Speaking"  value="14 minutes" />
                </div>

                <SubLabel>Extra Mock (Spend Points)</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Cost"                          value="1,500 momentum pts" />
                  <Row label="Minimum IAs required"          value="4 IAs" />
                  <Row label="Minimum days on platform"      value="14 days" />
                  <Row label="Band improvement required"     value="Must show improvement" />
                </div>
              </SectionCard>

              {/* BAND SCORE */}
              <SectionCard section={SECTIONS[6]}>
                <InfoBox>
                  Your band score is a <strong>blended score</strong> — it doesn't jump suddenly. Assessments nudge it gradually using a weighted formula so it reflects sustained performance, not a single lucky session.
                </InfoBox>

                <SubLabel>Internal Assessment → Band Update</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Formula" value="Previous band + (completion × 0.5)" note="Max nudge of +0.5 per IA" />
                  <Row label="Example (answered 10/10)" value="+0.5 band" note="5.0 → 5.5" />
                  <Row label="Example (answered 6/10)"  value="+0.3 band" note="5.0 → 5.3" />
                  <Row label="Band is capped at" value="9.0" />
                </div>

                <SubLabel>Full Mock Test → Band Update</SubLabel>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 px-4">
                  <Row label="Formula"         value="Mock × 60% + Last IA × 40%" note="Blended — your IA history still matters" />
                  <Row label="No IA on record" value="Mock score used directly" />
                  <Row label="Example"         value="Mock 6.5, Last IA 5.5 → 6.1" note="(6.5 × 0.6) + (5.5 × 0.4) = 3.9 + 2.2 = 6.1" />
                </div>

                <InfoBox variant="success">
                  <strong>What this means:</strong> One bad session won't tank your band, and one great session won't inflate it. Consistent improvement across IAs and Mocks is what moves the needle.
                </InfoBox>
              </SectionCard>

            </div>

            {/* Footer padding */}
            <div className="h-12" />
          </div>
        </main>
      </div>
    </div>
  );
}git 