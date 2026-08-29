import { useState } from "react";
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import {
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Target,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  BarChart2,
  Loader2,
  Inbox,
} from "lucide-react";
import StudentLayout from "./StudentLayout";

import { useCompetencyScores } from "@/features/student/hooks/useCompetencyScores";
import { useIAHistory } from "@/features/student/hooks/useIAHistory";
import { useMockHistory, bandPointsFromMocks } from "@/features/student/hooks/useMockHistory";
import { observedPacePerWeek } from "@/features/student/utils/iaAttendance";
import { resolvePace } from "@/features/student/utils/readinessProjection";
import {
  buildBandArc,
  buildRadar,
  buildPerformanceTable,
  buildTrajectory,
  type BandArcPoint,
  type RadarRow,
  type PerfRow,
  type TrajectoryPoint,
  type DatedSitting,
} from "@/features/student/utils/reportData";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = "bandarc" | "radar" | "readiness";

// ─── SKILL COLORS ─────────────────────────────────────────────────────────────

const SKILL_COLORS: Record<string, string> = {
  Listening: "#0ea5e9",
  Reading:   "#185A78",
  Writing:   "#f59e0b",
  Speaking:  "#f43f5e",
};

const SKILL_ICONS: Record<string, React.ReactNode> = {
  Listening: <Headphones className="h-4 w-4" />,
  Reading:   <BookOpen   className="h-4 w-4" />,
  Writing:   <PenLine    className="h-4 w-4" />,
  Speaking:  <Mic        className="h-4 w-4" />,
};

// ─── SHARED STATES ────────────────────────────────────────────────────────────

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-brand-line p-6 shadow-sm">{children}</div>
);

/** Empty state. Never a zeroed chart — a flat line at 0 reads as a real score. */
const NoData = ({ title, hint }: { title: string; hint: string }) => (
  <div className="py-14 flex flex-col items-center gap-2 text-center">
    <Inbox className="h-7 w-7 text-brand-text-mute" />
    <p className="font-semibold text-brand-text">{title}</p>
    <p className="text-sm text-brand-text-mute max-w-sm">{hint}</p>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const Report = () => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [reportTab, setReportTab] = useState<TabId>("bandarc");

  // Three real feeds, all student-authorised and already used elsewhere. This
  // page previously ran entirely on four hardcoded arrays.
  const { scores: competency, targetBand, examDate, loading: loadingComp } = useCompetencyScores();
  const { history: iaHistory } = useIAHistory();
  const { entries: mockEntries } = useMockHistory();

  // Every scored sitting, IA and mock alike, as dated per-skill bands.
  const sittings: DatedSitting[] = [
    ...iaHistory
      .filter((e) => e.status === "COMPLETED" && Array.isArray(e.scores))
      .map((e) => ({ date: e.ia_date, scores: e.scores ?? [] })),
    ...mockEntries
      .filter((m) => Array.isArray(m.scores))
      .map((m) => ({
        date: m.time_submitted_at ?? `${m.month_year}-01`,
        scores: m.scores ?? [],
      })),
  ];

  const bandArc = buildBandArc(sittings);
  const radar = buildRadar(competency, targetBand);
  const perfRows = buildPerformanceTable(competency, targetBand, sittings);

  // Overall current band = mean of scored skills. Same basis as the radar, so
  // the trajectory cannot start from a number no other panel shows.
  const scored = radar.map((r) => r.current);
  const overall = scored.length
    ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10
    : null;

  // One projection model shared with the dashboard: same observed pace, same
  // floors. Two surfaces disagreeing about the same student is the failure the
  // data audit recorded for current band (§11).
  const observed = observedPacePerWeek(bandPointsFromMocks(mockEntries));
  const { pace, source } = resolvePace(observed, 1.0);
  const trajectory =
    overall === null
      ? []
      : buildTrajectory(overall, targetBand, examDate, pace, new Date().toISOString());

  return (
    <>
      <StudentLayout
        activeTab="Report"
        mainClassName="flex-1 p-4 sm:p-6 lg:p-8 space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-brand-teal-500" />
            <h1 className="font-manrope text-2xl font-black text-brand-text">Reports</h1>
          </div>
          <p className="text-sm text-brand-text-mute mt-0.5">
            Your performance breakdown, from your assessments and mock tests.
          </p>
        </div>

        {/* ── Tab Bar ──
            Scrolls horizontally below the break: "Competency Radar" and
            "Predicted Readiness" overflow a phone viewport, and w-fit alone gave
            no scroll affordance, so the last tab was unreachable. */}
        <div className="max-w-full overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-1 bg-white border border-brand-line rounded-2xl p-1.5 shadow-sm w-fit min-w-max">
          {([
            { id: "bandarc",   label: "Band Arc",            icon: <TrendingUp    className="h-4 w-4" /> },
            { id: "radar",     label: "Competency Radar",    icon: <Target        className="h-4 w-4" /> },
            { id: "readiness", label: "Predicted Readiness", icon: <CalendarClock className="h-4 w-4" /> },
          ] as { id: TabId; label: string; icon: React.ReactNode }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                reportTab === tab.id
                  ? "bg-brand-teal-600 text-white shadow-sm"
                  : "text-brand-text-mute hover:text-brand-text"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        </div>

        {loadingComp ? (
          <Panel>
            <div className="py-14 flex items-center justify-center gap-3 text-brand-text-mute">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Loading your report…</span>
            </div>
          </Panel>
        ) : (
          <>
            {/* ── Tab Content ── */}
            {reportTab === "bandarc"   && <BandArcTab data={bandArc} targetBand={targetBand} />}
            {reportTab === "radar"     && <RadarTab rows={radar} />}
            {reportTab === "readiness" && (
              <ReadinessTab
                trajectory={trajectory}
                targetBand={targetBand}
                examDate={examDate}
                overall={overall}
                paceSource={source}
              />
            )}

            {/* ── Performance Table (shown on all tabs) ── */}
            <PerformanceTable rows={perfRows} />
          </>
        )}

      </StudentLayout>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
};

// ─── TAB: BAND ARC ────────────────────────────────────────────────────────────

const BandArcTab = ({ data, targetBand }: { data: BandArcPoint[]; targetBand: number }) => (
  <Panel>
    <div className="mb-5">
      <h2 className="font-manrope text-base font-black text-brand-text flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-brand-teal-500" /> Band Score Arc — All 4 Skills
      </h2>
      <p className="text-xs text-brand-text-mute mt-1">
        {data.length > 0
          ? `Band progression across ${data.length} scored session${data.length !== 1 ? "s" : ""} · ${data[0].date} – ${data[data.length - 1].date}`
          : "Band progression across your scored sessions"}
      </p>
    </div>

    {data.length === 0 ? (
      <NoData
        title="No scored sessions yet"
        hint="Your band progression appears here once you have completed an internal assessment or a mock test."
      />
    ) : (
      <>
        <div className="flex flex-wrap gap-2 mb-5">
          {Object.entries(SKILL_COLORS).map(([skill, color]) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
              style={{ borderColor: color + "40", backgroundColor: color + "15", color }}
            >
              {SKILL_ICONS[skill]} {skill}
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis domain={[3, 9]} ticks={[3, 4, 5, 6, 7, 8, 9]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}.0`} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600" }}
              formatter={(value: number | null, name: string) =>
                value !== null ? [`${value.toFixed(1)}`, name] : ["not assessed", name]
              }
            />
            <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "700", paddingTop: "12px" }} />
            {/* Target comes from the student's own profile, not a fixed 7.5. */}
            <ReferenceLine y={targetBand} stroke="#12897C" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: `Target ${targetBand.toFixed(1)}`, position: "right", fontSize: 10, fill: "#12897C" }} />
            {Object.entries(SKILL_COLORS).map(([skill, color]) => (
              // connectNulls bridges sessions that did not assess a skill without
              // inventing a data point for them.
              <Line key={skill} type="monotone" dataKey={skill} stroke={color} strokeWidth={2.5}
                connectNulls
                dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: color }} activeDot={{ r: 6 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </>
    )}
  </Panel>
);

// ─── TAB: RADAR ───────────────────────────────────────────────────────────────

const RadarTab = ({ rows }: { rows: RadarRow[] }) => (
  <Panel>
    <div className="mb-5">
      <h2 className="font-manrope text-base font-black text-brand-text flex items-center gap-2">
        <Target className="h-5 w-5 text-brand-teal-500" /> Competency Radar — Current vs Target
      </h2>
      <p className="text-xs text-brand-text-mute mt-1">
        Your current band per skill against your target band
      </p>
    </div>

    {rows.length === 0 ? (
      <NoData
        title="No skill bands yet"
        hint="The radar fills in as each skill gets its first score."
      />
    ) : (
      <>
        <div className="flex gap-4 mb-5">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal-600">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-teal-500" /> Current Band
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-text-mute">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-line" /> Target Band
          </span>
        </div>

        {rows.length < 3 && (
          // A radar needs three axes to read as a shape; below that it is a line.
          <p className="text-[11px] text-brand-text-mute mb-3">
            Showing {rows.length} scored skill{rows.length !== 1 ? "s" : ""} — the shape fills out as the rest are assessed.
          </p>
        )}

        <ResponsiveContainer width="100%" height={360}>
          <RadarChart data={rows} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fontWeight: "700", fill: "#64748b" }} />
            <PolarRadiusAxis angle={90} domain={[0, 9]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickCount={4} />
            <Radar name="Target Band" dataKey="target" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.15} strokeDasharray="5 3" strokeWidth={2} />
            <Radar name="Current Band" dataKey="current" stroke="#12897C" fill="#12897C" fillOpacity={0.25} strokeWidth={2.5} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600" }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "700", paddingTop: "16px" }} />
          </RadarChart>
        </ResponsiveContainer>
      </>
    )}
  </Panel>
);

// ─── TAB: READINESS ───────────────────────────────────────────────────────────

const ReadinessTab = ({
  trajectory, targetBand, examDate, overall, paceSource,
}: {
  trajectory: TrajectoryPoint[];
  targetBand: number;
  examDate: string | null;
  overall: number | null;
  paceSource: "observed" | "assumed";
}) => {
  const fmtExam = examDate
    ? new Date(examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  if (overall === null) {
    return (
      <Panel>
        <NoData
          title="Not enough data to project yet"
          hint="A projection needs at least one scored assessment. Complete an internal assessment to unlock it."
        />
      </Panel>
    );
  }

  if (!examDate || trajectory.length === 0) {
    return (
      <Panel>
        <NoData
          title="Set your exam date to unlock this"
          hint="Add your exam date in your profile and the projection to that date appears here."
        />
      </Panel>
    );
  }

  const lastProjected = trajectory[trajectory.length - 1].projected;
  const gap = Math.round((targetBand - lastProjected) * 10) / 10;
  const isOnTrack = lastProjected >= targetBand;
  // Pace floored at zero, so a stalled student projects flat rather than down.
  const stalled = paceSource === "observed" && lastProjected === overall;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
        isOnTrack ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
      }`}>
        {isOnTrack
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          : <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        }
        <div>
          <p className={`text-sm font-bold ${isOnTrack ? "text-emerald-700" : "text-amber-700"}`}>
            {isOnTrack
              ? `On track to hit Band ${targetBand.toFixed(1)} by ${fmtExam}.`
              : stalled
              ? `Your band hasn't moved across your recent mocks, so at this pace you stay near ${lastProjected.toFixed(1)} — ${gap.toFixed(1)} below target ${targetBand.toFixed(1)}.`
              : `At current pace: projected Band ${lastProjected.toFixed(1)} by ${fmtExam} — ${gap.toFixed(1)} below target ${targetBand.toFixed(1)}.`
            }
          </p>
          <p className="text-xs text-brand-text-mute mt-0.5">
            {paceSource === "observed"
              ? "Based on your own band movement across scored mocks."
              : "Based on an average pace — it becomes personal to you after two scored mocks."}
          </p>
        </div>
      </div>

      <Panel>
        <div className="mb-5">
          <h2 className="font-manrope text-base font-black text-brand-text flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-teal-500" /> Predicted Readiness — Overall Band Trajectory
          </h2>
          <p className="text-xs text-brand-text-mute mt-1">
            Projection from Band {overall.toFixed(1)} to your exam date ({fmtExam})
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-5">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal-600">
            <span className="h-2.5 w-8 rounded bg-brand-teal-500 inline-block" /> Projected
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-rose-500">
            <span className="h-2.5 w-8 rounded bg-rose-400 inline-block" /> Target {targetBand.toFixed(1)}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trajectory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis domain={[4, 9]} ticks={[4, 5, 6, 7, 8, 9]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}.0`} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600" }}
              formatter={(value: number | null, name: string) =>
                value !== null ? [`${value.toFixed(1)}`, name] : ["—", name]
              }
            />
            <ReferenceLine x={trajectory[trajectory.length - 1].date} stroke="#12897C" strokeDasharray="4 3"
              label={{ value: "Exam Date", position: "top", fontSize: 10, fill: "#12897C" }} />
            <Line type="monotone" dataKey="target" name="Target Band" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            <Line type="monotone" dataKey="projected" name="Projected Band" stroke="#12897C" strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#12897C" }} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
};

// ─── PERFORMANCE TABLE ────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; bg: string }> = {
  "On Track":   { color: "text-emerald-600",   bg: "bg-emerald-50"   },
  "At Risk":    { color: "text-amber-600",     bg: "bg-amber-50"     },
  "Critical":   { color: "text-rose-600",      bg: "bg-rose-50"      },
  "Not scored": { color: "text-brand-text-mute", bg: "bg-brand-bg-alt" },
};

const PerformanceTable = ({ rows }: { rows: PerfRow[] }) => (
  <div className="bg-white rounded-2xl border border-brand-line shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-brand-line">
      <h2 className="font-manrope text-sm font-black text-brand-text uppercase tracking-wider">Performance Table</h2>
      <p className="text-xs text-brand-text-mute mt-0.5">Current snapshot across all 4 skills</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-brand-bg-alt">
            {["Skill", "Current Band", "Target Band", "Gap", "Sessions", "Δ Last", "Status"].map((h) => (
              <th key={h} className="px-5 py-3 text-left font-jetbrains text-[10.5px] font-black text-brand-text-mute uppercase tracking-[0.14em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-line">
          {rows.map((row) => {
            const sc = statusConfig[row.status] ?? statusConfig["Not scored"];
            const skillColor = SKILL_COLORS[row.skill];
            return (
              <tr key={row.skill} className="hover:bg-brand-bg-alt transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span style={{ color: skillColor }}>{SKILL_ICONS[row.skill]}</span>
                    <span className="font-bold text-brand-text">{row.skill}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-black text-brand-text">
                  {row.current === null ? <span className="text-brand-text-mute font-normal">—</span> : row.current.toFixed(1)}
                </td>
                <td className="px-5 py-4 text-brand-text-mute">{row.target.toFixed(1)}</td>
                <td className="px-5 py-4 font-bold">
                  {/* The sign is derived, not hardcoded: the old markup printed a
                      literal "-" so a met-or-exceeded target could never show. */}
                  {row.gap === null ? (
                    <span className="text-brand-text-mute font-normal">—</span>
                  ) : row.gap <= 0 ? (
                    <span className="text-emerald-600">+{Math.abs(row.gap).toFixed(1)}</span>
                  ) : (
                    <span className="text-rose-500">-{row.gap.toFixed(1)}</span>
                  )}
                </td>
                <td className="px-5 py-4 text-brand-text-mute">{row.sessions}</td>
                <td className="px-5 py-4">
                  {/* Null with fewer than two sittings — the old table showed a
                      uniform "+0.5" for every skill regardless of history. */}
                  {row.delta === null ? (
                    <span className="text-brand-text-mute">—</span>
                  ) : row.delta === 0 ? (
                    <span className="text-brand-text-mute font-bold">0.0</span>
                  ) : (
                    <span className={`font-bold ${row.delta > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {row.delta > 0 ? "+" : ""}{row.delta.toFixed(1)}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default Report;
