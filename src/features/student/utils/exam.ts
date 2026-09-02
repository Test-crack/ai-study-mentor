// Exam detection helpers for the student experience. Keep exam checks centralised here
// (and in examDisplay) rather than scattering `examId === "…"` through components.
export const isSpokenEnglish = (examId?: string | null) => examId === "spoken_english";

/** True when the exam's diagnostic is a viva (record-and-submit speaking). */
export const isVivaExam = (p?: { vivaDiagnostic?: boolean } | null) => !!p?.vivaDiagnostic;
