// Bridges Spoken English's 6 CEFR subskills to the shared drill backend (which keys on the
// SubSkillType enum) and to CEFR display. One place so drill wiring + labels stay consistent.
export interface SeSubskill {
  id: string;            // CEFR subskill id (matches sub_scores.subskillProfile[].id)
  label: string;         // student-facing label
  drillSubskill: string; // SubSkillType enum value used by the drill API
}

// range→VOCABULARY, accuracy→GRAMMAR, fluency→FLUENCY, interaction→TASK_RESPONSE,
// coherence→COHERENCE, phonology→PRONUNCIATION (existing enum values — no migration).
export const SE_SUBSKILLS: SeSubskill[] = [
  { id: "range",       label: "Range",                drillSubskill: "VOCABULARY" },
  { id: "accuracy",    label: "Accuracy",             drillSubskill: "GRAMMAR" },
  { id: "fluency",     label: "Fluency",              drillSubskill: "FLUENCY" },
  { id: "interaction", label: "Responsiveness",       drillSubskill: "TASK_RESPONSE" },
  { id: "coherence",   label: "Coherence",            drillSubskill: "COHERENCE" },
  { id: "phonology",   label: "Phonological Control", drillSubskill: "PRONUNCIATION" },
];

export const seSubskill = (id: string) => SE_SUBSKILLS.find((s) => s.id === id);

// CEFR level (e.g. "b1", "B2") → the drill RecommendationLevel bucket.
export const cefrToDrillLevel = (level?: string): "BEGINNER" | "INTERMEDIATE" | "ADVANCED" => {
  const l = (level || "").toLowerCase();
  if (l.startsWith("c")) return "ADVANCED";
  if (l.startsWith("b")) return "INTERMEDIATE";
  return "BEGINNER";
};

// Main CEFR ladder (half-steps collapse to the base level for display).
const CEFR_LADDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const baseLabel = (label?: string) => (label || "").toUpperCase().replace("+", "");

/** The next CEFR level up (for "the climb"), or null at C2. */
export const nextCefr = (label?: string): string | null => {
  const i = CEFR_LADDER.indexOf(baseLabel(label));
  return i >= 0 && i < CEFR_LADDER.length - 1 ? CEFR_LADDER[i + 1] : null;
};

/** 0–100 progress of the overall mean toward the next level (for the climb bar). */
export const withinLevelProgress = (label?: string, meanScore?: number): number => {
  // meanScore is the 0–100 subskill mean; map its position within the current level band.
  // Coarse but honest without per-level cut-offs on the client.
  const i = CEFR_LADDER.indexOf(baseLabel(label));
  if (i < 0 || meanScore == null) return 0;
  const frac = ((meanScore % 17) / 17) * 100; // ~17pts per CEFR band on the 0–100 scale
  return Math.max(6, Math.min(100, Math.round(frac)));
};
