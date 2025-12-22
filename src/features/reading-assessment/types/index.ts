export interface AssessmentHistoryItem {
  id: string;
  passageTitle?: string;
  passageId?: string;
  difficulty: string;
  category: string;
  wordCount?: number;
  weightedWPM: number;
  actualWPM?: number;
  accuracy: number;
  retention: number;
  speedLearningScore: number;
  integrityScore: number;
  focusRatio: number;
  tabSwitches?: number;
  readingTimeSeconds: number;
  completedAt?: string;
  createdAt?: string;
}

export interface UserReadingProfile {
  current: {
    weightedWPM: number;
    retention: number;
    speedLearning: number;
    focusRatio: number;
    integrityScore: number;
  };
  best: {
    weightedWPM: number;
    retention: number;
    speedLearning: number;
  };
  stats: {
    totalAssessments: number;
    lastAssessmentAt: string | null;
  };
}
