// Module-singleton cache of the backend public exam configs (GET /api/exams →
// listPublicConfigs: scale SHAPE, components, overall mode, naming, target). Hydrated once at
// app load by <ExamConfigProvider/> and read SYNCHRONOUSLY by the display primitives, so a new
// exam added to the backend config renders on every dashboard with no frontend change.
//
// Why a singleton (not React context): the dashboards color/format scores inside pure helper
// functions (bandPill(v), formatScore(v)), not just components — those need synchronous access.
// A static fallback covers the pre-hydrate / offline window so nothing renders blank.

export interface PublicScale {
  kind: "numeric" | "ordinal";
  min?: number;
  max?: number;
  step?: number;
  report_floor?: number;
  grade_bands?: { grade: string; min: number; max: number }[];
  levels?: string[];
  labels?: Record<string, string>;
}

export interface PublicComponent {
  id: string;
  label: string;
  modality?: string;
  assessed?: boolean;
  scale?: string;
  subskills?: { id: string; label: string }[];
}

export interface PublicExamConfig {
  exam_id: string;
  status?: string;
  naming?: Record<string, any>;
  legal?: Record<string, any>;
  components?: PublicComponent[];
  overall?: { mode?: "aggregate" | "per_component"; scale?: string | null; components?: string[] };
  scales?: Record<string, PublicScale>;
  target?: Record<string, any>;
}

// Interim fallback for the exams that ship with real student data, so score pills/columns render
// correctly before /api/exams resolves (or if it fails). New exams don't need an entry here — they
// come from the hydrated config. IELTS + Spoken English mirror the backend exam-engine config.
const FALLBACK: Record<string, PublicExamConfig> = {
  ielts: {
    exam_id: "ielts",
    naming: { public_display_name: "IELTS" },
    overall: { mode: "aggregate", scale: "ielts_band" },
    scales: { ielts_band: { kind: "numeric", min: 0, max: 9, step: 0.5, report_floor: 4 } },
    components: [
      { id: "listening", label: "Listening", modality: "listening", assessed: true },
      { id: "reading", label: "Reading", modality: "reading", assessed: true },
      { id: "writing", label: "Writing", modality: "writing", assessed: true },
      { id: "speaking", label: "Speaking", modality: "speaking", assessed: true },
    ],
    target: { enabled: true },
  },
  spoken_english: {
    exam_id: "spoken_english",
    naming: { public_display_name: "Spoken English (CEFR-aligned)" },
    overall: { mode: "aggregate", scale: "cefr_6" },
    scales: {
      cefr_6: {
        kind: "ordinal",
        levels: ["below_a1", "a1", "a2", "b1", "b2", "c1", "c2"],
        labels: { below_a1: "Below A1", a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2" },
      },
    },
    components: [{ id: "speaking", label: "Speaking", modality: "speaking", assessed: true }],
  },
};

const store = new Map<string, PublicExamConfig>();

/** Populate the cache from GET /api/exams (`res.data`). Called once by the provider. */
export function hydrateExamConfigs(list: PublicExamConfig[] | undefined | null): void {
  if (!Array.isArray(list)) return;
  for (const c of list) if (c && c.exam_id) store.set(c.exam_id, c);
}

/** Hydrated config for an exam, or the interim fallback, or undefined for a truly unknown exam. */
export function getPublicExamConfig(examId?: string | null): PublicExamConfig | undefined {
  if (!examId) return undefined;
  return store.get(examId) ?? FALLBACK[examId];
}

export function isExamConfigHydrated(): boolean {
  return store.size > 0;
}
