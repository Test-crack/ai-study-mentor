import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

// ─── GAUGE BAR ────────────────────────────────────────────────────────────────
// Reused wherever a band score needs a horizontal fill instead of a bare number.

export function GaugeBar({ value, max = 9, colorClass }: { value: number; max?: number; colorClass: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── BAND OVER TIME CHART (hero) ──────────────────────────────────────────────

export interface BandPoint {
  label: string;
  band: number;
  type: "assessment" | "mock";
}

export function BandOverTimeChart({ points }: { points: BandPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[11px] text-white/30 text-center px-4">
        Not enough scored assessments yet to chart a trend.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={points} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 9]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.06)" }}
          contentStyle={{ background: "#0B1F26", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          itemStyle={{ color: "#fff" }}
          formatter={(value: number) => [value.toFixed(1), "Band"]}
        />
        <Bar dataKey="band" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {points.map((p, i) => (
            <Cell key={i} fill={p.type === "mock" ? "#256B8B" : "#3EE0A0"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-3 text-[10px] text-white/50">
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-mint" /> Assessment</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-blue-400" /> Mock</span>
    </div>
  );
}

// ─── SHARED SIDEBAR SHELL ─────────────────────────────────────────────────────

function SidebarCard({ eyebrow, subtitle, children }: { eyebrow: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-line p-4 sm:p-5">
      <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-1">{eyebrow}</p>
      {subtitle && <p className="text-[11px] text-brand-text-mute mb-3">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

export interface SkillGaugeRow {
  key: string;
  label: string;
  icon: ReactNode;
  band: number | null;
  sourceLabel?: string;
  colorClass: string;
}

// ─── IA TAB SIDEBAR ───────────────────────────────────────────────────────────

export function AttendanceCard({
  pct, taken, total, ticks, insight,
}: { pct: number; taken: number; total: number; ticks: boolean[]; insight: string }) {
  return (
    <SidebarCard eyebrow="Attendance">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-manrope text-2xl sm:text-3xl font-black text-brand-text">{pct}%</span>
      </div>
      <p className="text-xs text-brand-text-mute mb-3">{taken} of {total} taken</p>
      {ticks.length > 0 && (
        <div className="flex gap-0.5 mb-3">
          {ticks.map((ok, i) => (
            <span key={i} className={`flex-1 h-6 rounded-sm ${ok ? "bg-brand-teal-400" : "bg-rose-300"}`} />
          ))}
        </div>
      )}
      {insight && <p className="text-[11px] text-brand-text-mute leading-relaxed">{insight}</p>}
    </SidebarCard>
  );
}

export function SubSkillCoverageCard({ rows }: { rows: SkillGaugeRow[] }) {
  return (
    <SidebarCard eyebrow="Sub-skill Coverage" subtitle="Latest band recorded per skill across all assessments.">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-text">{r.icon}{r.label}</span>
              <span className="text-sm font-black text-brand-text">{r.band != null ? r.band.toFixed(1) : "—"}</span>
            </div>
            {r.band != null && <GaugeBar value={r.band} colorClass={r.colorClass} />}
            {r.sourceLabel && <p className="text-[10px] text-brand-text-mute mt-1">{r.sourceLabel}</p>}
          </div>
        ))}
      </div>
    </SidebarCard>
  );
}

export function RecordInsightCard({
  title, message, ctaLabel, onCta, tone = "amber",
}: { title: string; message: string; ctaLabel?: string; onCta?: () => void; tone?: "amber" | "teal" }) {
  const toneClasses = tone === "amber" ? "border-l-amber-400 bg-amber-50/60" : "border-l-brand-teal-500 bg-brand-teal-50/60";
  return (
    <div className={`rounded-2xl border border-l-4 ${toneClasses} p-4 sm:p-5`}>
      <p className="text-[10px] font-black text-brand-text-mute font-jetbrains uppercase tracking-[0.16em] mb-2">{title}</p>
      <p className="text-[13px] text-brand-text leading-relaxed mb-3">{message}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-brand-ink text-white text-xs font-bold py-2 hover:bg-brand-ink/90 transition-colors"
        >
          {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── MOCK TAB SIDEBAR ─────────────────────────────────────────────────────────

export function MockProgressionCard({
  delta, bands, narrative,
}: { delta: number; bands: number[]; narrative: string }) {
  const positive = delta >= 0;
  return (
    <SidebarCard eyebrow="Mock Progression">
      <p className={`font-manrope text-2xl font-black ${positive ? "text-emerald-600" : "text-rose-600"}`}>
        {positive ? "+" : ""}{delta.toFixed(1)}
      </p>
      <p className="text-[11px] text-brand-text-mute mb-3">since your first mock</p>
      {bands.length > 1 && (
        <div className="flex items-end gap-1 h-10 mb-3">
          {bands.map((b, i) => (
            <div key={i} className="flex-1 rounded-sm bg-brand-blue-400" style={{ height: `${Math.max(8, (b / 9) * 100)}%` }} />
          ))}
        </div>
      )}
      <p className="text-[11px] text-brand-text-mute leading-relaxed">{narrative}</p>
    </SidebarCard>
  );
}

export function BestBandPerSkillCard({ rows }: { rows: SkillGaugeRow[] }) {
  return (
    <SidebarCard eyebrow="Best Band per Skill">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-text">{r.icon}{r.label}</span>
              <span className="text-sm font-black text-brand-text">{r.band != null ? r.band.toFixed(1) : "—"}</span>
            </div>
            {r.band != null && <GaugeBar value={r.band} colorClass={r.colorClass} />}
          </div>
        ))}
      </div>
    </SidebarCard>
  );
}

export function ThisMonthMockCard({
  used, monthLabel, onStart,
}: { used: boolean; monthLabel: string; onStart: () => void }) {
  return (
    <div className="rounded-2xl border border-l-4 border-l-brand-blue-500 bg-brand-blue-50/60 p-4 sm:p-5">
      <p className="text-[10px] font-black text-brand-blue-700 font-jetbrains uppercase tracking-[0.16em] mb-2">This Month's Mock</p>
      <p className="text-[13px] text-brand-text leading-relaxed mb-3">
        {used
          ? `You've already used your free ${monthLabel} sitting. An extra one costs 1,500 momentum.`
          : `Your free ${monthLabel} sitting is still unused. An extra one costs 1,500 momentum.`}
      </p>
      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-brand-blue-600 text-white text-xs font-bold py-2 hover:bg-brand-blue-700 transition-colors"
      >
        {used ? "Start extra mock" : `Start ${monthLabel} mock`} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── DIAGNOSTIC TAB SIDEBAR ───────────────────────────────────────────────────

export interface DeltaRow {
  key: string;
  label: string;
  icon: ReactNode;
  baseline: number;
  current: number;
  delta: number;
}

export function HowFarCard({ rows }: { rows: DeltaRow[] }) {
  return (
    <SidebarCard eyebrow="How Far You've Come" subtitle="Baseline against your latest recorded band, per skill.">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-text">{r.icon}{r.label}</span>
              <span className="text-xs font-black text-brand-text">
                {r.baseline.toFixed(1)} → {r.current.toFixed(1)}
                <span className={r.delta >= 0 ? "text-emerald-600 ml-1" : "text-rose-600 ml-1"}>
                  {r.delta >= 0 ? "+" : ""}{r.delta.toFixed(1)}
                </span>
              </span>
            </div>
            <GaugeBar value={r.current} colorClass={r.delta >= 0 ? "bg-emerald-500" : "bg-rose-500"} />
          </div>
        ))}
      </div>
    </SidebarCard>
  );
}

export function AboutReportCard() {
  return (
    <SidebarCard eyebrow="About This Report">
      <p className="text-[12px] text-brand-text-mute leading-relaxed">
        The diagnostic is taken once, before any practice. It is never re-scored, so it stays an honest starting line no matter how far your band moves.
      </p>
    </SidebarCard>
  );
}
