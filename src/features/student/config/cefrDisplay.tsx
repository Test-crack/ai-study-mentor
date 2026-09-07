// CEFR display building blocks shared by every Spoken English results surface
// (AssessmentHistoryPage, Report, and any page added after them). One source
// of truth for level -> color mapping so pages don't drift from each other.

export const CEFR_ORDER = ["Below A1", "A1", "A2", "B1", "B2", "C1", "C2"];

/** sub_scores.cefrLabel -> ordinal 0-6 on the CEFR_ORDER ladder, for charting only. */
export const cefrOrdinal = (label?: string): number => {
  const i = CEFR_ORDER.findIndex((l) => l.toLowerCase() === (label || "").toLowerCase());
  return i >= 0 ? i : 0;
};

export const cefrColor = (label?: string) => {
  const l = (label || "").toLowerCase();
  if (l.startsWith("c")) return "text-emerald-600";
  if (l.startsWith("b2")) return "text-sky-600";
  if (l.startsWith("b")) return "text-brand-teal-600";
  if (l.startsWith("a2")) return "text-amber-600";
  return "text-rose-600";
};

export const cefrBg = (label?: string) => {
  const l = (label || "").toLowerCase();
  if (l.startsWith("c")) return "bg-emerald-50 border-emerald-200";
  if (l.startsWith("b2")) return "bg-sky-50 border-sky-200";
  if (l.startsWith("b")) return "bg-brand-teal-50 border-brand-teal-200";
  if (l.startsWith("a2")) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
};

export const cefrGaugeColor = (label?: string) => {
  const l = (label || "").toLowerCase();
  if (l.startsWith("c")) return "bg-emerald-500";
  if (l.startsWith("b2")) return "bg-sky-500";
  if (l.startsWith("b")) return "bg-brand-teal-500";
  if (l.startsWith("a2")) return "bg-amber-500";
  return "bg-rose-500";
};

// CEFR-shaped counterpart of BandBadge — never shows the raw 0-100 mean score, only the label.
export const CefrBadge = ({ label, size = "md" }: { label?: string; size?: "sm" | "md" }) => {
  const dims = size === "sm" ? "w-11 h-11 text-base" : "w-14 h-14 sm:w-16 sm:h-16 text-xl sm:text-2xl";
  return (
    <div className={`shrink-0 flex items-center justify-center rounded-2xl border-2 ${cefrBg(label)} ${dims}`}>
      <span className={`font-manrope font-black leading-none ${cefrColor(label)}`}>{label ?? "—"}</span>
    </div>
  );
};
