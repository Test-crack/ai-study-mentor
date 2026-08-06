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
} from "lucide-react";
import StudentLayout from "./StudentLayout";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TabId = "bandarc" | "radar" | "readiness";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const BAND_ARC_DATA = [
  { date: "Mar 10", Listening: 6.0, Reading: 5.5, Writing: 5.0, Speaking: 4.0 },
  { date: "Mar 13", Listening: 6.0, Reading: 5.5, Writing: 5.0, Speaking: 4.0 },
  { date: "Mar 15", Listening: 6.5, Reading: 5.5, Writing: 5.0, Speaking: 4.0 },
  { date: "Mar 18", Listening: 6.5, Reading: 5.5, Writing: 5.0, Speaking: 4.0 },
  { date: "Mar 20", Listening: 6.5, Reading: 5.5, Writing: 5.5, Speaking: 4.0 },
  { date: "Mar 22", Listening: 6.5, Reading: 6.0, Writing: 5.5, Speaking: 4.0 },
  { date: "Mar 24", Listening: 6.5, Reading: 6.0, Writing: 5.5, Speaking: 4.5 },
];

const RADAR_DATA = [
  { skill: "Listening", current: 6.5, target: 7.5 },
  { skill: "Reading",   current: 6.0, target: 7.5 },
  { skill: "Writing",   current: 5.5, target: 7.0 },
  { skill: "Speaking",  current: 4.5, target: 7.0 },
];

const READINESS_DATA = [
  { date: "Mar 24", actual: 5.5,  projected: 5.5, target: 7.5 },
  { date: "Apr 07", actual: null, projected: 5.8, target: 7.5 },
  { date: "Apr 21", actual: null, projected: 6.1, target: 7.5 },
  { date: "May 05", actual: null, projected: 6.3, target: 7.5 },
  { date: "May 19", actual: null, projected: 6.5, target: 7.5 },
  { date: "Jun 02", actual: null, projected: 6.6, target: 7.5 },
  { date: "Jun 15", actual: null, projected: 6.8, target: 7.5 },
];

const PERFORMANCE_TABLE = [
  { skill: "Listening", current: 6.5, target: 7.5, delta: +0.5, sessions: 3, gap: 1.0, status: "On Track" },
  { skill: "Reading",   current: 6.0, target: 7.5, delta: +0.5, sessions: 2, gap: 1.5, status: "On Track" },
  { skill: "Writing",   current: 5.5, target: 7.0, delta: +0.5, sessions: 2, gap: 1.5, status: "At Risk"  },
  { skill: "Speaking",  current: 4.5, target: 7.0, delta: +0.5, sessions: 3, gap: 2.5, status: "Critical" },
];

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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const Report = () => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [reportTab, setReportTab] = useState<TabId>("bandarc");

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
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Reports</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Your performance breakdown — all mock data until Wednesday integration
          </p>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm w-fit">
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
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {reportTab === "bandarc"   && <BandArcTab />}
        {reportTab === "radar"     && <RadarTab />}
        {reportTab === "readiness" && <ReadinessTab />}

        {/* ── Performance Table (shown on all tabs) ── */}
        <PerformanceTable />

      </StudentLayout>

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
};

// ─── TAB: BAND ARC ────────────────────────────────────────────────────────────

const BandArcTab = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-brand-teal-500" /> Band Score Arc — All 4 Skills
      </h2>
      <p className="text-xs text-slate-500 mt-1">
        Line chart showing band score progression over time · Mock data Mar 10 – Mar 24
      </p>
    </div>

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
      <LineChart data={BAND_ARC_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis domain={[3, 9]} ticks={[3, 4, 5, 6, 7, 8, 9]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}.0`} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600" }}
          formatter={(value: number, name: string) => [`${value.toFixed(1)}`, name]}
        />
        <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "700", paddingTop: "12px" }} />
        <ReferenceLine y={7.5} stroke="#12897C" strokeDasharray="5 3" strokeWidth={1.5}
          label={{ value: "Target 7.5", position: "right", fontSize: 10, fill: "#12897C" }} />
        {Object.entries(SKILL_COLORS).map(([skill, color]) => (
          <Line key={skill} type="monotone" dataKey={skill} stroke={color} strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: color }} activeDot={{ r: 6 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// ─── TAB: RADAR ───────────────────────────────────────────────────────────────

const RadarTab = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
        <Target className="h-5 w-5 text-brand-teal-500" /> Competency Radar — Current vs Target
      </h2>
      <p className="text-xs text-slate-500 mt-1">
        Spider chart overlaying your current band per skill against your target band
      </p>
    </div>

    <div className="flex gap-4 mb-5">
      <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal-600 dark:text-brand-teal-400">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-teal-500" /> Current Band
      </span>
      <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-400" /> Target Band
      </span>
    </div>

    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fontWeight: "700", fill: "#64748b" }} />
        <PolarRadiusAxis angle={90} domain={[4, 9]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickCount={4} />
        <Radar name="Target Band" dataKey="target" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.15} strokeDasharray="5 3" strokeWidth={2} />
        <Radar name="Current Band" dataKey="current" stroke="#12897C" fill="#12897C" fillOpacity={0.25} strokeWidth={2.5} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600" }}
          formatter={(value: number, name: string) => [`${value.toFixed(1)}`, name]}
        />
        <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "700", paddingTop: "16px" }} />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);

// ─── TAB: READINESS ───────────────────────────────────────────────────────────

const ReadinessTab = () => {
  const lastProjected = READINESS_DATA[READINESS_DATA.length - 1].projected!;
  const target = 7.5;
  const gap = (target - lastProjected).toFixed(1);
  const isOnTrack = lastProjected >= target;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
        isOnTrack
          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25"
          : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25"
      }`}>
        {isOnTrack
          ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          : <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        }
        <div>
          <p className={`text-sm font-bold ${isOnTrack ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
            {isOnTrack
              ? "On track to hit your target band by June 15!"
              : `At current pace: projected band ${lastProjected.toFixed(1)} by June 15 — ${gap} below target 7.5`
            }
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Increase Speaking + Writing practice frequency to close the gap.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-teal-500" /> Predicted Readiness — Overall Band Trajectory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Current trajectory vs target band vs exam date (Jun 15) · Arithmetic projection from mock data
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-5">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal-600">
            <span className="h-2.5 w-8 rounded bg-brand-teal-500 inline-block" /> Projected
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-rose-500">
            <span className="h-2.5 w-8 rounded bg-rose-400 inline-block" /> Target 7.5
          </span>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={READINESS_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis domain={[4, 9]} ticks={[4, 5, 6, 7, 8, 9]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}.0`} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "600" }}
              formatter={(value: number | null, name: string) =>
                value !== null ? [`${value.toFixed(1)}`, name] : ["—", name]
              }
            />
            <ReferenceLine x="Jun 15" stroke="#12897C" strokeDasharray="4 3"
              label={{ value: "Exam Date", position: "top", fontSize: 10, fill: "#12897C" }} />
            <Line type="monotone" dataKey="target" name="Target Band" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            <Line type="monotone" dataKey="projected" name="Projected Band" stroke="#12897C" strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#12897C" }} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── PERFORMANCE TABLE ────────────────────────────────────────────────────────

const statusConfig = {
  "On Track": { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  "At Risk":  { color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-500/10"    },
  "Critical": { color: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-500/10"      },
};

const PerformanceTable = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
      <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Performance Table</h2>
      <p className="text-xs text-slate-400 mt-0.5">Current snapshot across all 4 skills</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            {["Skill", "Current Band", "Target Band", "Gap", "Sessions", "Δ Last", "Status"].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {PERFORMANCE_TABLE.map((row) => {
            const sc = statusConfig[row.status as keyof typeof statusConfig];
            const skillColor = SKILL_COLORS[row.skill];
            return (
              <tr key={row.skill} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span style={{ color: skillColor }}>{SKILL_ICONS[row.skill]}</span>
                    <span className="font-bold text-slate-800 dark:text-white">{row.skill}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-black text-slate-800 dark:text-white">{row.current.toFixed(1)}</td>
                <td className="px-5 py-4 text-slate-500">{row.target.toFixed(1)}</td>
                <td className="px-5 py-4 font-bold text-rose-500">-{row.gap.toFixed(1)}</td>
                <td className="px-5 py-4 text-slate-500">{row.sessions}</td>
                <td className="px-5 py-4">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{row.delta.toFixed(1)}</span>
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