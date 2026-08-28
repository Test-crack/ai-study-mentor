// Per-exam student-dashboard display config. Pages read flags from here instead of
// branching on examId inline, so onboarding a new exam is a config edit — not a code hunt.
// IELTS is the default and must remain unchanged.
export interface ExamDisplay {
  examId: string;
  scale: "band" | "cefr";
  headlineLabel: string;               // "Overall band" | "CEFR level"
  showSkills: string[];                // which skills to surface
  showTargetAndReadiness: boolean;     // band target + exam-date readiness (IELTS only)
  showTiles: { mock: boolean; ia: boolean; lexigrid: boolean; drills: boolean };
  disclaimer?: string;                 // shown near any score output (CEFR legal requirement)
}

export const EXAM_DISPLAY: Record<string, ExamDisplay> = {
  ielts: {
    examId: "ielts",
    scale: "band",
    headlineLabel: "Overall band",
    showSkills: ["listening", "reading", "writing", "speaking"],
    showTargetAndReadiness: true,
    showTiles: { mock: true, ia: true, lexigrid: true, drills: true },
  },
  spoken_english: {
    examId: "spoken_english",
    scale: "cefr",
    headlineLabel: "CEFR level",
    showSkills: ["speaking"], // one skill, rendered as a 6-subskill profile
    showTargetAndReadiness: false,
    // Cohort 1: hide the IELTS surfaces. MCQ drills come next; flip `drills` on then.
    showTiles: { mock: false, ia: false, lexigrid: false, drills: false },
    disclaimer:
      "CEFR level results are estimates aligned to the Common European Framework of Reference for Languages. They are not official CEFR certifications.",
  },
};

export const examDisplay = (examId?: string | null): ExamDisplay =>
  EXAM_DISPLAY[examId ?? "ielts"] ?? EXAM_DISPLAY.ielts;
