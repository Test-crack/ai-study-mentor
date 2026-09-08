// Typed read-point for exams.config.json (the exam directory seed — see the keyword
// directory brief, Part A "route keys" and the JSON's own $comment block).
//
// HARD RULE (TC-02 Q14, TC-03 §5.1): no component may hand-type an exam name. Every
// visible exam string on the marketing site reads from the config, never a literal.
import examsConfig from '@/config/exams.config.json';

export type ExamStatus = 'live' | 'in_build' | 'configured' | 'roadmap';

export interface ExamDirectoryEntry {
  key: string;
  slug: string;
  route: string;
  displayName: string;
  legalDisplayName: string;
  trademarkOwner: string | null;
  legalDisclaimer: string;
  category: string;
  status: ExamStatus;
  scoringStrategy: string;
  skills: string[];
  selfRegistration: boolean;
  mayIncludeMinors: boolean;
  seoPriority: 'critical' | 'high' | 'medium' | 'low';
  seoNote: string | null;
}

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = examsConfig.statusLabels as Record<ExamStatus, string>;

export const EXAM_DIRECTORY: ExamDirectoryEntry[] = examsConfig.exams as ExamDirectoryEntry[];

/**
 * Routes that are actually built and safe to link to today. Every other entry in the
 * directory is display-only on the homepage grid — per TC-03 §5.4 (minor-data gate) and
 * the OET/PSC/banking/UPSC content gates, none of those pages exist yet in this app.
 */
export const EXAM_ROUTE_LIVE: Partial<Record<string, string>> = {
  IELTS: '/exams/ielts-preparation',
};
