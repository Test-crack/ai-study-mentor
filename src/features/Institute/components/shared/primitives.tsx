// Shared UI primitives for the Institute Admin portal — extracted from the
// owner-portal design language so every admin page composes the same pieces:
// rounded-2xl cards, indigo accent, semantic badges, skeleton-first loading.
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
    indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   text: "text-indigo-600 dark:text-indigo-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
    amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     text: "text-amber-600 dark:text-amber-400" },
    rose:    { bg: "bg-rose-50 dark:bg-rose-500/10",       text: "text-rose-600 dark:text-rose-400" },
    blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       text: "text-blue-600 dark:text-blue-400" },
  };
  const a = accents[accent];
  return (
    <div className="rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-center gap-3">
        <div className={`${a.bg} p-2.5 rounded-xl`}>
          <Icon className={`h-5 w-5 ${a.text}`} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
      {sub && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">{sub}</p>}
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
    success: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20",
    warning: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20",
    danger:  "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-600/20",
    info:    "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20",
    neutral: "bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 ring-slate-500/10",
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
    return <span className="text-slate-400 dark:text-slate-500 text-sm font-semibold">—</span>;
  }
  const tone =
    band >= 7 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20"
    : band >= 6 ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20"
    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20";
  return (
    <span className={`inline-flex rounded-full ring-1 ring-inset px-2.5 py-0.5 text-xs font-bold ${tone}`}>
      {band.toFixed(1)}
    </span>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 bg-slate-100 dark:bg-white/[0.04] rounded-xl" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[...Array(cards)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
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
      <div className="bg-slate-50 dark:bg-white/[0.04] p-3 rounded-2xl">
        <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</p>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold text-rose-700 dark:text-rose-300 underline underline-offset-2 shrink-0"
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
    <div className={`rounded-2xl bg-white dark:bg-[#131318] border border-slate-200/70 dark:border-white/[0.08] shadow-sm ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
          {Icon && <Icon className="h-4 w-4 text-indigo-500" />}
          {title}
        </h2>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
