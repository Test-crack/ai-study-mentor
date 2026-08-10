import { useState, useEffect, useRef } from 'react';
import {
  Gamepad2, Target, Flame, Zap, ClipboardCheck, FileText,
  TrendingUp, BookOpen,
} from 'lucide-react';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
import { cn } from '@/shared/utils';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  icon: React.ElementType;
  label: string;
  eyebrow: string;
}

// ─── SECTIONS CONFIG ──────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: 'lexigrid', icon: Gamepad2,       label: 'Daily Challenge',     eyebrow: '01' },
  { id: 'drills',   icon: Target,         label: 'Drills',              eyebrow: '02' },
  { id: 'streak',   icon: Flame,          label: 'Daily Streak',        eyebrow: '03' },
  { id: 'momentum', icon: Zap,            label: 'Momentum Points',     eyebrow: '04' },
  { id: 'ia',       icon: ClipboardCheck, label: 'Internal Assessment', eyebrow: '05' },
  { id: 'mock',     icon: FileText,       label: 'Full Mock Test',      eyebrow: '06' },
  { id: 'band',     icon: TrendingUp,     label: 'Band Score',          eyebrow: '07' },
];

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────

function SectionBlock({
  section,
  children,
  isActive,
}: {
  section: Section;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <div
      id={section.id}
      className={cn(
        'scroll-mt-6 border-l-2 pl-5 sm:pl-7 transition-colors duration-300',
        isActive
          ? 'border-brand-teal-500 dark:border-brand-teal-400'
          : 'border-slate-200 dark:border-slate-700'
      )}
    >
      <div className="mb-4 sm:mb-5">
        <span className="font-mono text-[11px] tracking-widest text-slate-400 dark:text-slate-500 select-none">
          {section.eyebrow}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <section.icon
            className={cn(
              'w-[17px] h-[17px] shrink-0 transition-colors duration-300',
              isActive
                ? 'text-brand-teal-500 dark:text-brand-teal-400'
                : 'text-slate-400 dark:text-slate-500'
            )}
          />
          <h2 className="text-[15px] font-semibold text-slate-800 dark:text-white tracking-tight">
            {section.label}
          </h2>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">{children}</div>
    </div>
  );
}

function Note({
  children,
  type = 'plain',
}: {
  children: React.ReactNode;
  type?: 'plain' | 'warn' | 'tip';
}) {
  const styles = {
    plain: 'text-slate-500 dark:text-slate-400',
    warn:  'text-amber-700 dark:text-amber-400',
    tip:   'text-emerald-700 dark:text-emerald-400',
  };
  const prefixes = { plain: '', warn: 'Note — ', tip: 'Tip — ' };
  return (
    <p className={cn('text-[13px] leading-relaxed', styles[type])}>
      {prefixes[type] && (
        <span className="font-semibold">{prefixes[type]}</span>
      )}
      {children}
    </p>
  );
}

function DataTable({
  rows,
}: {
  rows: { label: string; value: string; sub?: string }[];
}) {
  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
      {rows.map((row, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start justify-between gap-3 px-3 sm:px-4 py-3 text-[13px]',
            i < rows.length - 1 && 'border-b border-slate-100 dark:border-slate-800',
            i % 2 === 0
              ? 'bg-white dark:bg-slate-900'
              : 'bg-slate-50/60 dark:bg-slate-800/40'
          )}
        >
          <span className="text-slate-500 dark:text-slate-400 leading-snug flex-1 min-w-0 pr-2">
            {row.label}
          </span>
          <div className="text-right shrink-0">
            <span className="font-semibold text-slate-800 dark:text-white">{row.value}</span>
            {row.sub && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                {row.sub}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 pt-1">
      {children}
    </p>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function HowItWorks() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered,   setIsSidebarHovered]   = useState(false);
  const [activeSection,      setActiveSection]       = useState<string>('lexigrid');
  const observerRef  = useRef<IntersectionObserver | null>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Intersection observer — highlight the nav item for the visible section
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            // Auto-scroll the mobile nav chip into view
            const chip = document.getElementById(`nav-chip-${entry.target.id}`);
            chip?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current!.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

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

      <div
        className={`transition-all duration-300 ease-in-out pl-0 ${
          isSidebarHovered ? 'md:pl-[288px]' : 'md:pl-[116px]'
        } flex flex-col min-h-screen`}
      >
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* ── Mobile sticky section strip ── */}
          <div
            ref={mobileNavRef}
            className="lg:hidden sticky top-0 z-20 bg-[#F8FAFC]/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {SECTIONS.map(s => (
              <button
                id={`nav-chip-${s.id}`}
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  'shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full border transition-all duration-200 whitespace-nowrap',
                  activeSection === s.id
                    ? 'bg-brand-teal-50 dark:bg-brand-teal-500/10 border-brand-teal-300 dark:border-brand-teal-500/40 text-brand-teal-600 dark:text-brand-teal-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                )}
              >
                {s.eyebrow} {s.label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">

              {/* ── Page header ── */}
              <div className="mb-8 sm:mb-10 pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Platform guide
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5 sm:mb-2">
                  How TestCrack works
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg">
                  Points, streaks, assessments, and how your band score moves — all explained in one place.
                </p>
              </div>

              {/* ── Layout: sticky desktop nav + content ── */}
              <div className="flex gap-10 lg:gap-16 relative">

                {/* Desktop sticky side nav — hidden on mobile */}
                <aside className="hidden lg:block shrink-0 w-44">
                  <div className="sticky top-24">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-4">
                      Sections
                    </p>
                    <nav className="space-y-0.5">
                      {SECTIONS.map(s => {
                        const isActive = activeSection === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => scrollTo(s.id)}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-all duration-200 group',
                              isActive
                                ? 'text-brand-teal-600 dark:text-brand-teal-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                          >
                            <span
                              className={cn(
                                'shrink-0 w-1.5 h-1.5 rounded-full transition-all duration-200',
                                isActive
                                  ? 'bg-brand-teal-500 dark:bg-brand-teal-400 scale-125'
                                  : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500'
                              )}
                            />
                            <span className="text-[13px] font-medium leading-tight">{s.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </aside>

                {/* ── Content column — full width on mobile ── */}
                <div className="flex-1 min-w-0 space-y-10 sm:space-y-14">

                  {/* LEXIGRID */}
                  <SectionBlock section={SECTIONS[0]} isActive={activeSection === 'lexigrid'}>
                    <Note>
                      LexiGrid is your daily vocabulary warm-up — 5 hidden IELTS-level words, revealed letter by letter. Finish it before your second drill to unlock the full daily session.
                    </Note>
                    <DataTable rows={[
                      { label: 'Words per day',                value: '5' },
                      { label: 'Attempts per word',            value: '3 tries',        sub: 'Wrong guess clears your input' },
                      { label: 'Points per word solved',       value: '+15 pts' },
                      { label: 'All-5 bonus (≤ 2 tries each)', value: '+5 pts extra',   sub: '75 pts max per day' },
                      { label: 'Resets',                       value: 'Midnight daily' },
                    ]} />
                    <Note>
                      Tap a letter to fill in your guess. Green tile = correct. Red flash = wrong, resets your input. After 3 failed attempts the word auto-skips.
                    </Note>
                  </SectionBlock>

                  {/* DRILLS */}
                  <SectionBlock section={SECTIONS[1]} isActive={activeSection === 'drills'}>
                    <Note>
                      5-question sessions targeting your weakest sub-skills. The system picks skill and difficulty from your current band score. Each drill is followed by an Apply Drill — a short writing or speaking prompt to lock in what you practised.
                    </Note>
                    <DataTable rows={[
                      { label: 'Questions per session',   value: '5 questions' },
                      { label: 'Base points per session', value: '+15 pts' },
                      { label: 'Per correct answer',      value: '+10 pts',  sub: 'Max +50 pts extra (all correct)' },
                      { label: 'Apply Drill bonus',       value: '+30 pts' },
                      { label: 'Free drills per day',    value: '2 sessions' },
                      { label: 'Extra drill cost',       value: '75 pts',   sub: 'Only after DCS ≥ 75%' },
                    ]} />
                    <Note type="warn">
                      Daily Completion Score (DCS) must reach 75% before "Buy Extra Drill" appears — and you need at least 75 pts to spend.
                    </Note>
                  </SectionBlock>

                  {/* STREAK */}
                  <SectionBlock section={SECTIONS[2]} isActive={activeSection === 'streak'}>
                    <Note>
                      Your streak counts consecutive days of activity. You need at least 2 drill sessions in a day to earn a streak credit. Miss a full day and it resets to zero.
                    </Note>
                    <DataTable rows={[
                      { label: 'Minimum drills for a streak day', value: '2 sessions' },
                      { label: 'Streak increments after',         value: '2nd drill completed' },
                      { label: 'Streak resets if',                value: 'Full day missed',  sub: 'Checked each time you open the app' },
                      { label: 'Displayed on',                    value: 'Dashboard + drill result screen' },
                    ]} />
                    <Note>
                      LexiGrid and Apply Drill earn momentum points but don't count toward streak. Only drill sessions do.
                    </Note>
                  </SectionBlock>

                  {/* MOMENTUM */}
                  <SectionBlock section={SECTIONS[3]} isActive={activeSection === 'momentum'}>
                    <Note>
                      Momentum is your in-app currency — earn it by staying active, lose it for missed assessments, spend it to unlock extras. It never expires.
                    </Note>

                    <GroupLabel>Earning</GroupLabel>
                    <DataTable rows={[
                      { label: 'LexiGrid — per word solved',         value: '+15 pts' },
                      { label: 'LexiGrid — all-5 bonus',             value: '+5 pts',   sub: 'All 5, first or second try' },
                      { label: 'Drill session — base',               value: '+15 pts' },
                      { label: 'Drill session — per correct answer', value: '+10 pts',  sub: 'Up to +50 pts extra' },
                      { label: 'Apply Drill completion',             value: '+30 pts' },
                      { label: 'Internal Assessment completion',     value: '+100 pts' },
                      { label: 'IA — band improved',                 value: '+25 pts',  sub: 'On top of the 100 pts' },
                      { label: 'Full Mock Test completion',          value: '+200 pts' },
                    ]} />

                    <GroupLabel>Losing</GroupLabel>
                    <DataTable rows={[
                      { label: 'Missed IA — 1st miss',        value: '−20 pts' },
                      { label: 'Missed IA — 2nd consecutive', value: '−40 pts' },
                    ]} />

                    <GroupLabel>Spending</GroupLabel>
                    <DataTable rows={[
                      { label: 'Extra drill session',  value: '75 pts',    sub: 'Requires DCS ≥ 75% that day' },
                      { label: 'Extra Full Mock Test', value: '1,500 pts', sub: '≥ 4 IAs + 14 days + improvement' },
                    ]} />
                  </SectionBlock>

                  {/* INTERNAL ASSESSMENT */}
                  <SectionBlock section={SECTIONS[4]} isActive={activeSection === 'ia'}>
                    <Note>
                      The Internal Assessment tests one skill in depth. It unlocks automatically once you hit the criteria below — you then have a 24-hour window. Miss it and lose 20 momentum pts.
                    </Note>

                    <GroupLabel>Unlock criteria</GroupLabel>
                    <DataTable rows={[
                      { label: 'Total drill sessions completed', value: '6 sessions',       sub: 'Across all skills' },
                      { label: 'Time on platform',              value: '≥ 2 calendar days', sub: 'Since your first drill' },
                    ]} />

                    <GroupLabel>Format</GroupLabel>
                    <DataTable rows={[
                      { label: 'Questions',                    value: '10 questions' },
                      { label: 'Time limit',                   value: '20 minutes' },
                      { label: 'Completion window',            value: '24 hours' },
                      { label: 'Resume window (if cut short)', value: '18 minutes' },
                      { label: 'Total IAs available',          value: '6 (one per skill cycle)' },
                      { label: 'After all 6 IAs',              value: 'Full Mock Test unlocks' },
                    ]} />

                    <GroupLabel>Missed IA penalties</GroupLabel>
                    <DataTable rows={[
                      { label: '1st missed IA',        value: '−20 pts' },
                      { label: '2nd consecutive miss', value: '−40 pts' },
                    ]} />

                    <Note>
                      Each penalty applies once per missed cycle — you won't be charged twice for the same miss.
                    </Note>
                  </SectionBlock>

                  {/* FULL MOCK TEST */}
                  <SectionBlock section={SECTIONS[5]} isActive={activeSection === 'mock'}>
                    <Note>
                      A complete IELTS simulation across all four skills with official time limits. Unlocks after finishing all 6 IAs and showing measurable improvement.
                    </Note>

                    <GroupLabel>Standard unlock criteria</GroupLabel>
                    <DataTable rows={[
                      { label: 'Internal Assessments',    value: 'All 6 completed' },
                      { label: 'Skills covered',          value: 'All 4 via IAs' },
                      { label: 'Band improvement needed', value: '≥ 0.5 gain in 1 skill', sub: 'vs. your diagnostic baseline' },
                    ]} />

                    <GroupLabel>Official time limits</GroupLabel>
                    <DataTable rows={[
                      { label: 'Listening', value: '30 min' },
                      { label: 'Reading',   value: '60 min' },
                      { label: 'Writing',   value: '60 min' },
                      { label: 'Speaking',  value: '14 min' },
                    ]} />

                    <GroupLabel>Extra mock (spend points)</GroupLabel>
                    <DataTable rows={[
                      { label: 'Cost',                      value: '1,500 pts' },
                      { label: 'Minimum IAs required',      value: '4 IAs' },
                      { label: 'Minimum days on platform',  value: '14 days' },
                      { label: 'Band improvement required', value: 'Must show improvement' },
                    ]} />
                  </SectionBlock>

                  {/* BAND SCORE */}
                  <SectionBlock section={SECTIONS[6]} isActive={activeSection === 'band'}>
                    <Note>
                      Your band score is blended — it won't spike after one lucky session or crash after one bad one. Assessments nudge it gradually using a weighted formula.
                    </Note>

                    <GroupLabel>Internal Assessment → band update</GroupLabel>
                    <DataTable rows={[
                      { label: 'Formula',                   value: 'Prev + (completion × 0.5)', sub: 'Max nudge of +0.5 per IA' },
                      { label: 'Example — 10 / 10 correct', value: '+0.5', sub: '5.0 → 5.5' },
                      { label: 'Example — 6 / 10 correct',  value: '+0.3', sub: '5.0 → 5.3' },
                      { label: 'Band cap',                  value: '9.0' },
                    ]} />

                    <GroupLabel>Full Mock Test → band update</GroupLabel>
                    <DataTable rows={[
                      { label: 'Formula',         value: 'Mock × 60% + Last IA × 40%', sub: 'Your IA history still counts' },
                      { label: 'No IA on record', value: 'Mock score used directly' },
                      { label: 'Example',         value: '6.1', sub: 'Mock 6.5, Last IA 5.5 → (6.5×0.6)+(5.5×0.4)' },
                    ]} />

                    <Note type="tip">
                      One bad session won't tank your score, and one great session won't inflate it. Consistent improvement across IAs and Mocks is what moves the needle.
                    </Note>
                  </SectionBlock>

                </div>{/* end content column */}
              </div>{/* end two-column wrapper */}

              <div className="h-12 sm:h-16" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}