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
  disclaimerFull?: string;             // shown in full at onboarding (legal.display_rules.show_full_at_onboarding)
  /**
   * Never render these near a score for this exam. Mirrors
   * `legal.banned_terms_near_output` in the backend exam config.
   */
  bannedTermsNearOutput?: string[];
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
    // Verbatim from the backend exam config (exams.spoken_english.legal.disclaimer_full),
    // which sets display_rules.show_full_at_onboarding = true. Duplicated here only
    // because no route serves the public exam config to the student app yet — when one
    // lands, read both disclaimers from it so the legal text has a single source.
    disclaimerFull:
      "This Spoken English assessment is aligned to the Common European Framework of Reference for Languages (CEFR). It is not affiliated with, endorsed by, or connected to the Council of Europe. CEFR level results shown are estimates aligned to the framework and are not official CEFR certifications. The Council of Europe does not verify or validate alignment claims made by any provider.",
    bannedTermsNearOutput: [
      "certified", "certificate", "certification",
      "official CEFR level", "CEFR accredited", "recognised by the Council of Europe",
    ],
  },
};

export const examDisplay = (examId?: string | null): ExamDisplay =>
  EXAM_DISPLAY[examId ?? "ielts"] ?? EXAM_DISPLAY.ielts;
