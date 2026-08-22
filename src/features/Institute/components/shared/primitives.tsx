// Shared UI primitives for the Institute Admin portal — extracted from the
// owner-portal design language so every admin page composes the same pieces:
// rounded-2xl white cards, brand-teal accent, semantic badges, skeleton-first
// loading. Light-only — matches the student/instructor dashboard design system.
import { ReactNode } from "react";
import { LucideIcon, Inbox } from "lucide-react";

// ─── KPI card (dashboard stat grid) ───────────────────────────────────────────

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "indigo",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon: LucideIcon;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "blue";
}) {
  const accents: Record<string, { bg: string; text: string }> = {
    indigo:  { bg: "bg-brand-teal-50", text: "text-brand-teal-600" },
    emerald: { bg: "bg-emerald-50",    text: "text-emerald-600" },
    amber:   { bg: "bg-amber-50",      text: "text-amber-600" },
    rose:    { bg: "bg-rose-50",       text: "text-rose-600" },
    blue:    { bg: "bg-brand-blue-50", text: "text-brand-blue-600" },
  };
  const a = accents[accent];
  return (
    <div className="rounded-2xl bg-white border border-brand-line p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className={`${a.bg} p-2 sm:p-2.5 rounded-xl shrink-0`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${a.text}`} />
        </div>
        <p className="font-jetbrains text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-brand-text-mute leading-tight">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl sm:text-3xl font-black text-brand-text leading-none">{value}</p>
      {sub && <p className="mt-2 text-[11px] sm:text-xs text-brand-text-mute font-medium leading-snug">{sub}</p>}
    </div>
  );
}

// ─── Status badge (semantic pill) ─────────────────────────────────────────────

export function StatusBadge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "info" | "neutral";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
    danger:  "bg-rose-50 text-rose-700 ring-rose-600/20",
    info:    "bg-sky-50 text-sky-700 ring-sky-600/20",
    neutral: "bg-brand-bg-alt text-brand-text-mute ring-brand-line",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ring-1 ring-inset px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ─── Band pill (color-coded IELTS band) ───────────────────────────────────────

export function BandPill({ band }: { band: number | null | undefined }) {
  if (band == null) {
    return <span className="text-brand-text-mute text-sm font-semibold">—</span>;
  }
  const tone =
    band >= 7 ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : band >= 6 ? "bg-sky-50 text-sky-700 ring-sky-600/20"
    : "bg-amber-50 text-amber-700 ring-amber-600/20";
  return (
    <span className={`inline-flex rounded-full ring-1 ring-inset px-2.5 py-0.5 text-xs font-bold ${tone}`}>
      {band.toFixed(1)}
    </span>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="w-full min-w-0 animate-pulse space-y-2.5 sm:space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 sm:h-14 w-full bg-brand-bg-alt rounded-xl" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
      {[...Array(cards)].map((_, i) => (
        <div key={i} className="h-28 sm:h-32 bg-brand-bg-alt rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-12 flex flex-col items-center gap-2 text-center">
      <div className="bg-brand-bg-alt p-3 rounded-2xl">
        <Icon className="h-6 w-6 text-brand-text-mute" />
      </div>
      <p className="text-sm font-bold text-brand-text">{title}</p>
      {hint && <p className="text-xs text-brand-text-mute max-w-xs px-4">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-rose-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold text-rose-700 underline underline-offset-2 shrink-0 min-h-[40px] px-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Section card (titled content block) ──────────────────────────────────────

export function SectionCard({
  title,
  icon: Icon,
  actions,
  children,
  className = "",
}: {
  title: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white border border-brand-line shadow-sm ${className}`}>
      <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-brand-line flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <h2 className="flex items-center gap-2 font-jetbrains text-[11px] sm:text-xs font-bold text-brand-text uppercase tracking-[0.14em]">
          {Icon && <Icon className="h-4 w-4 text-brand-teal-500 shrink-0" />}
          {title}
        </h2>
        {actions}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
