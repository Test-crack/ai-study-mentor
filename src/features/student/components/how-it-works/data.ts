import {
  Gamepad2, Target, Flame, Zap, ClipboardCheck, FileText, TrendingUp,
} from 'lucide-react';
import type { ChapterContent } from './types';

export const CHAPTERS: ChapterContent[] = [
  {
    id: 'lexigrid',
    number: '01',
    icon: Gamepad2,
    label: 'Daily Challenge',
    tag: 'EVERY DAY',
    title: 'LexiGrid — five words before your second drill',
    intro: 'Your daily vocabulary warm-up. Five hidden IELTS-level words, revealed letter by letter. Finish it before your second drill to unlock the full daily session.',
    ruleGroups: [
      {
        rows: [
          { label: 'Words per day', value: '5' },
          { label: 'Attempts per word', value: '3 tries', sub: 'Wrong guess clears your input' },
          { label: 'Points per word solved', value: '+15 pts' },
          { label: 'All-5 bonus (≤ 2 tries each)', value: '+5 pts extra', sub: '75 pts max per day' },
          { label: 'Resets', value: 'Midnight daily' },
        ],
      },
    ],
    trailingNotes: [
      { type: 'plain', text: 'Tap a letter to fill in your guess. Green tile = correct. Red flash = wrong, resets your input. After 3 failed attempts the word auto-skips.' },
    ],
    accent: 'teal',
    orbitNode: 'lexigrid',
    caption: 'Warms up vocabulary',
  },
  {
    id: 'drills',
    number: '02',
    icon: Target,
    label: 'Drills',
    tag: 'TWO FREE DAILY',
    title: 'Drills — five questions at your weakest sub-skill',
    intro: 'The system picks skill and difficulty from your current band score. Each drill is followed by an Apply Drill — a short writing or speaking prompt to lock in what you practised.',
    ruleGroups: [
      {
        rows: [
          { label: 'Questions per session', value: '5 questions' },
          { label: 'Base points per session', value: '+15 pts' },
          { label: 'Per correct answer', value: '+10 pts', sub: 'Max +50 pts extra (all correct)' },
          { label: 'Apply Drill bonus', value: '+30 pts' },
          { label: 'Free drills per day', value: '2 sessions' },
          { label: 'Extra drill cost', value: '75 pts', sub: 'Only after DCS ≥ 75%' },
        ],
      },
    ],
    trailingNotes: [
      { type: 'warn', text: 'Daily Completion Score (DCS) must reach 75% before "Buy Extra Drill" appears — and you need at least 75 pts to spend.' },
    ],
    accent: 'amber',
    orbitNode: 'drills',
    caption: 'Sharpens sub-skills',
  },
  {
    id: 'streak',
    number: '03',
    icon: Flame,
    label: 'Daily Streak',
    tag: 'CONSECUTIVE DAYS',
    title: 'Streak — two drill sessions is the bar',
    intro: 'Your streak counts consecutive days of activity. You need at least 2 drill sessions in a day to earn a streak credit. Miss a full day and it resets to zero.',
    ruleGroups: [
      {
        rows: [
          { label: 'Minimum drills for a streak day', value: '2 sessions' },
          { label: 'Streak increments after', value: '2nd drill completed' },
          { label: 'Streak resets if', value: 'Full day missed', sub: 'Checked each time you open the app' },
          { label: 'Displayed on', value: 'Dashboard + drill result screen' },
        ],
      },
    ],
    trailingNotes: [
      { type: 'plain', text: "LexiGrid and Apply Drill earn momentum points but don't count toward streak. Only drill sessions do." },
    ],
    accent: 'orange',
    caption: 'Keeps the habit alive',
  },
  {
    id: 'momentum',
    number: '04',
    icon: Zap,
    label: 'Momentum Points',
    tag: 'IN-APP CURRENCY',
    title: 'Momentum — earned by showing up, spent on extras',
    intro: 'Earn it by staying active, lose it for missed assessments, spend it to unlock extras. It never expires.',
    ruleGroups: [
      {
        label: 'Earning',
        rows: [
          { label: 'LexiGrid — per word solved', value: '+15 pts' },
          { label: 'LexiGrid — all-5 bonus', value: '+5 pts', sub: 'All 5, first or second try' },
          { label: 'Drill session — base', value: '+15 pts' },
          { label: 'Drill session — per correct answer', value: '+10 pts', sub: 'Up to +50 pts extra' },
          { label: 'Apply Drill completion', value: '+30 pts' },
          { label: 'Internal Assessment completion', value: '+100 pts' },
          { label: 'IA — band improved', value: '+25 pts', sub: 'On top of the 100 pts' },
          { label: 'Full Mock Test completion', value: '+200 pts' },
        ],
      },
      {
        label: 'Losing',
        rows: [
          { label: 'Missed IA — 1st miss', value: '−20 pts' },
          { label: 'Missed IA — 2nd consecutive', value: '−40 pts' },
        ],
      },
      {
        label: 'Spending',
        rows: [
          { label: 'Extra drill session', value: '75 pts', sub: 'Requires DCS ≥ 75% that day' },
          { label: 'Extra Full Mock Test', value: '1,500 pts', sub: '≥ 4 IAs + 14 days + improvement' },
        ],
      },
    ],
    trailingNotes: [],
    accent: 'yellow',
    caption: 'Buys you extra reps',
  },
  {
    id: 'ia',
    number: '05',
    icon: ClipboardCheck,
    label: 'Internal Assessment',
    tag: 'ONE PER SKILL CYCLE',
    title: 'Internal Assessment — one skill, tested in depth',
    intro: 'It unlocks automatically once you hit the criteria below, and you then have a 24-hour window. Miss it and lose 20 momentum points.',
    ruleGroups: [
      {
        label: 'Unlock criteria',
        rows: [
          { label: 'Total drill sessions completed', value: '6 sessions', sub: 'Across all skills' },
          { label: 'Time on platform', value: '≥ 2 calendar days', sub: 'Since your first drill' },
        ],
      },
      {
        label: 'Format',
        rows: [
          { label: 'Questions', value: '10 questions' },
          { label: 'Time limit', value: '20 minutes' },
          { label: 'Completion window', value: '24 hours' },
          { label: 'Resume window (if cut short)', value: '18 minutes' },
          { label: 'Total IAs available', value: '6 (one per skill cycle)' },
          { label: 'After all 6 IAs', value: 'Full Mock Test unlocks' },
        ],
      },
      {
        label: 'Missed IA penalties',
        rows: [
          { label: '1st missed IA', value: '−20 pts' },
          { label: '2nd consecutive miss', value: '−40 pts' },
        ],
      },
    ],
    trailingNotes: [
      { type: 'plain', text: "Each penalty applies once per missed cycle — you won't be charged twice for the same miss." },
    ],
    accent: 'indigo',
    orbitNode: 'ia',
    caption: 'Nudges the band +0.5',
  },
  {
    id: 'mock',
    number: '06',
    icon: FileText,
    label: 'Full Mock Test',
    tag: 'AFTER ALL 6 IAS',
    title: 'Full Mock — the real thing, under official timing',
    intro: 'A complete IELTS simulation across all four skills with official time limits. Unlocks after finishing all 6 IAs and showing measurable improvement.',
    ruleGroups: [
      {
        label: 'Standard unlock criteria',
        rows: [
          { label: 'Internal Assessments', value: 'All 6 completed' },
          { label: 'Skills covered', value: 'All 4 via IAs' },
          { label: 'Band improvement needed', value: '≥ 0.5 gain in 1 skill', sub: 'vs. your diagnostic baseline' },
        ],
      },
      {
        label: 'Official time limits',
        rows: [
          { label: 'Listening', value: '30 min' },
          { label: 'Reading', value: '60 min' },
          { label: 'Writing', value: '60 min' },
          { label: 'Speaking', value: '14 min' },
        ],
      },
      {
        label: 'Extra mock (spend points)',
        rows: [
          { label: 'Cost', value: '1,500 pts' },
          { label: 'Minimum IAs required', value: '4 IAs' },
          { label: 'Minimum days on platform', value: '14 days' },
          { label: 'Band improvement required', value: 'Must show improvement' },
        ],
      },
    ],
    trailingNotes: [],
    accent: 'violet',
    orbitNode: 'mock',
    caption: 'Rewrites it at 60%',
  },
  {
    id: 'band',
    number: '07',
    icon: TrendingUp,
    label: 'Band Score',
    tag: 'BLENDED OVER TIME',
    title: 'Band Score — blended, never spiky',
    intro: "Your band score is blended — it won't spike after one lucky session or crash after one bad one. Assessments nudge it gradually using a weighted formula.",
    ruleGroups: [
      {
        label: 'Internal Assessment → band update',
        rows: [
          { label: 'Formula', value: 'Prev + (completion × 0.5)', sub: 'Max nudge of +0.5 per IA' },
          { label: 'Example — 10 / 10 correct', value: '+0.5', sub: '5.0 → 5.5' },
          { label: 'Example — 6 / 10 correct', value: '+0.3', sub: '5.0 → 5.3' },
          { label: 'Band cap', value: '9.0' },
        ],
      },
      {
        label: 'Full Mock Test → band update',
        rows: [
          { label: 'Formula', value: 'Mock × 60% + Last IA × 40%', sub: 'Your IA history still counts' },
          { label: 'No IA on record', value: 'Mock score used directly' },
          { label: 'Example', value: '6.1', sub: 'Mock 6.5, Last IA 5.5 → (6.5×0.6)+(5.5×0.4)' },
        ],
      },
    ],
    trailingNotes: [
      { type: 'tip', text: "One bad session won't tank your score, and one great session won't inflate it. Consistent improvement across IAs and Mocks is what moves the needle." },
    ],
    accent: 'green',
    caption: 'The number everything feeds',
  },
];

export const HERO_SUMMARY_ROWS = [
  { cadence: 'DAILY', label: 'Challenge + two drills', value: 'up to 185 pts' },
  { cadence: 'DAILY', label: 'Streak credit', value: '2 sessions' },
  { cadence: 'PER CYCLE', label: 'Internal Assessment', value: '+100 pts' },
  { cadence: 'MONTHLY', label: 'Full Mock Test', value: '+200 pts' },
] as const;
