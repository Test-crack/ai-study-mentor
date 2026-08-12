import { LexiGridDemo } from './LexiGridDemo';
import { DrillsDemo } from './DrillsDemo';
import { StreakDemo } from './StreakDemo';
import { MomentumDemo } from './MomentumDemo';
import { UnlockCriteriaDemo } from './UnlockCriteriaDemo';
import { BandScoreDemo } from './BandScoreDemo';

const IA_CRITERIA = [
  { label: 'Total drill sessions', value: '6 sessions' },
  { label: 'Time on platform', value: '≥ 2 days' },
];

const MOCK_CRITERIA = [
  { label: 'Internal Assessments', value: 'All 6 done' },
  { label: 'Skills covered', value: 'All 4 via IAs' },
  { label: 'Band improvement', value: '≥ 0.5 in 1 skill' },
];

export function ChapterDemo({ chapterId }: { chapterId: string }) {
  switch (chapterId) {
    case 'lexigrid':
      return <LexiGridDemo />;
    case 'drills':
      return <DrillsDemo />;
    case 'streak':
      return <StreakDemo />;
    case 'momentum':
      return <MomentumDemo />;
    case 'ia':
      return <UnlockCriteriaDemo criteria={IA_CRITERIA} accentClass="bg-indigo-500" />;
    case 'mock':
      return <UnlockCriteriaDemo criteria={MOCK_CRITERIA} accentClass="bg-violet-500" />;
    case 'band':
      return <BandScoreDemo />;
    default:
      return null;
  }
}
