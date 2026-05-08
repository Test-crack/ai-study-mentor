import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { callBackend } from "@/features/auth/services/authClient";
import { cn } from "@/shared/utils";
import {
  TrendingUp, Target, Calendar, CheckCircle2, AlertTriangle,
  Clock, Zap, Trophy, ChevronDown,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Skill = "listening" | "reading" | "writing" | "speaking";

interface BandDataPoint {
  date:   string;
  label:  string;
  type:   "diagnostic" | "ia" | "mock";
  bands:  Partial<Record<Skill, number>>;
}

interface SubScores {
  [key: string]: number;
}

interface CompetencyData {
  skill:     Skill;
  subScores: SubScores;
  target:    number;
}

interface ReadinessState {
  status:        "on_track" | "at_risk" | "behind";
  projectedDate: string | null;
  examDate:      string;
  targetBand:    number;
  currentBand:   number;
  daysLeft:      number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];
const SKILL_LABELS: Record<Skill, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
const SKILL_COLORS: Record<Skill, string> = {
  listening: "#38bdf8",
  reading:   "#a78bfa",
  writing:   "#fbbf24",
  speaking:  "#f87171",
};
const SKILL_FILL: Record<Skill, string> = {
  listening: "rgba(56,189,248,0.15)",
  reading:   "rgba(167,139,250,0.15)",
  writing:   "rgba(251,191,36,0.15)",
  speaking:  "rgba(248,113,113,0.15)",
};

const SUB_SKILL_AXES: Record<Skill, string[]> = {
  speaking:  ["Fluency", "Lexical Resource", "Grammar", "Pronunciation"],
  writing:   ["Task Response", "Coherence", "Lexical Resource", "Grammar"],
  reading:   ["Grammatical Parsing", "Vocabulary & Inference", "Detail Recognition", "Coherence & Context"],
  listening: ["Vocabulary Recognition", "Detail Recognition", "Coherence & Context", "Inference"],
};

// ─────────────────────────────────────────────────────────────────────────────
// SMOOTH BEZIER CURVE HELPER
// Converts an array of {x,y} points into a smooth cubic bezier SVG path string.
// Uses Catmull-Rom → cubic Bezier conversion so curves pass through every point.
// ─────────────────────────────────────────────────────────────────────────────

function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const tension = 0.4; // 0 = straight lines, 1 = max curve
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA READERS
// ─────────────────────────────────────────────────────────────────────────────

const readBandHistory = (): BandDataPoint[] => {
  const points: BandDataPoint[] = [];
  try {
    const stored = localStorage.getItem("diagnostic_band_scores");
    if (stored) {
      const bands = JSON.parse(stored);
      points.push({
        date:  localStorage.getItem("diagnostic_date") || new Date(Date.now() - 30 * 86400000).toISOString(),
        label: "Diagnostic",
        type:  "diagnostic",
        bands,
      });
    }
  } catch { /* ignore */ }
  try {
    const stored = localStorage.getItem("ia_tracker");
    if (stored) {
      const tracker = JSON.parse(stored);
      const w = tracker.currentWindow;
      if (w?.status === "completed" && w.result) {
        const skill = w.targetSkill?.toLowerCase() as Skill;
        if (skill && SKILLS.includes(skill)) {
          points.push({
            date:  w.result.completedAt,
            label: `IA #${w.iaNumber || 1}`,
            type:  "ia",
            bands: { [skill]: w.result.band },
          });
        }
      }
    }
  } catch { /* ignore */ }
  try {
    const stored = localStorage.getItem("mock_usage_history");
    if (stored) {
      const history = JSON.parse(stored);
      history.forEach((record: any, idx: number) => {
        if (record.skillBands) {
          points.push({
            date:  record.date,
            label: `Mock ${idx + 1}`,
            type:  "mock",
            bands: record.skillBands,
          });
        }
      });
    }
  } catch { /* ignore */ }
  return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const readDiagnosticBands = (): Record<Skill, number> => {
  try {
    const stored = localStorage.getItem("diagnostic_band_scores");
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { listening: 5.0, reading: 5.0, writing: 5.0, speaking: 5.0 };
};

const readExamConfig = (): { examDate: string; targetBand: number } => {
  try {
    const stored = localStorage.getItem("exam_config");
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    examDate:   new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    targetBand: 7.0,
  };
};

const linearRegression = (points: { x: number; y: number }[]): { slope: number; intercept: number } => {
  if (points.length < 2) return { slope: 0, intercept: points[0]?.y || 5.0 };
  const n   = points.length;
  const sx  = points.reduce((s, p) => s + p.x, 0);
  const sy  = points.reduce((s, p) => s + p.y, 0);
  const sx2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const denom = n * sx2 - sx * sx;
  if (denom === 0) return { slope: 0, intercept: sy / n };
  return {
    slope:     (n * sxy - sx * sy) / denom,
    intercept: (sy - ((n * sxy - sx * sy) / denom) * sx) / n,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// BAND ARC CHART — upgraded
// Smooth bezier lines, glow filter on hover tooltip, dashed grid, polished dots
// ─────────────────────────────────────────────────────────────────────────────

const BandArcChart = ({ history }: { history: BandDataPoint[] }) => {
  const W = 600, H = 280;
  const PAD = { top: 24, right: 24, bottom: 48, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const yMin = 3.0, yMax = 9.0;
  const yScale = (band: number) => chartH - ((band - yMin) / (yMax - yMin)) * chartH;

  const dates  = history.map(p => new Date(p.date).getTime());
  const xMin   = dates.length > 0 ? Math.min(...dates) : Date.now() - 30 * 86400000;
  const xMax   = dates.length > 0 ? Math.max(...dates) : Date.now();
  const xRange = xMax - xMin || 1;
  const xScale = (dateMs: number) => ((dateMs - xMin) / xRange) * chartW;

  const series: Record<Skill, { x: number; y: number; label: string; type: string; band: number }[]> = {
    listening: [], reading: [], writing: [], speaking: [],
  };
  history.forEach(point => {
    const x = xScale(new Date(point.date).getTime());
    SKILLS.forEach(skill => {
      if (point.bands[skill] !== undefined) {
        series[skill].push({ x, y: yScale(point.bands[skill]!), label: point.label, type: point.type, band: point.bands[skill]! });
      }
    });
  });

  const yGridLines: number[] = [];
  for (let b = yMin; b <= yMax; b += 1) yGridLines.push(b);

  const xLabels = history.map(p => ({
    x:     xScale(new Date(p.date).getTime()),
    label: p.label,
    type:  p.type,
  }));

  const [hovered, setHovered] = useState<{ skill: Skill; idx: number } | null>(null);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
        <defs>
          {/* Glow filter for hovered tooltip */}
          <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Per-skill area gradients */}
          {SKILLS.map(skill => (
            <linearGradient key={skill} id={`arcGrad-${skill}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={SKILL_COLORS[skill]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={SKILL_COLORS[skill]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>

          {/* Dashed grid lines — very low opacity */}
          {yGridLines.map(b => (
            <g key={b}>
              <line
                x1={0} x2={chartW} y1={yScale(b)} y2={yScale(b)}
                stroke="currentColor" strokeOpacity={0.05} strokeWidth={1}
                strokeDasharray="4 4"
                className="text-slate-400"
              />
              <text x={-10} y={yScale(b) + 4} textAnchor="end"
                fill="#94a3b8" fontSize={8} fontWeight={700}
                fontFamily="ui-monospace, 'Cascadia Code', monospace">
                {b.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X axis event markers */}
          {xLabels.map((l, i) => (
            <g key={i}>
              <line x1={l.x} x2={l.x} y1={0} y2={chartH}
                stroke="currentColor" strokeOpacity={0.04} strokeWidth={1}
                strokeDasharray="3 6" className="text-slate-400" />
              <text x={l.x} y={chartH + 16} textAnchor="middle"
                fill="#64748b" fontSize={8} fontWeight={700}
                fontFamily="ui-monospace, 'Cascadia Code', monospace">
                {l.label}
              </text>
              <circle cx={l.x} cy={chartH + 27} r={3.5}
                fill={l.type === "mock" ? "#6366f1" : l.type === "ia" ? "#a78bfa" : "#475569"}
              />
            </g>
          ))}

          {/* Per-skill smooth lines */}
          {SKILLS.map(skill => {
            const pts = series[skill];
            if (pts.length === 0) return null;

            const xyPoints  = pts.map(p => ({ x: p.x, y: p.y }));
            const smoothD   = createSmoothPath(xyPoints);

            // Closed fill path: smooth curve + vertical drop to baseline
            const fillD = pts.length > 1
              ? `${smoothD} L ${pts[pts.length-1].x} ${chartH} L ${pts[0].x} ${chartH} Z`
              : null;

            return (
              <g key={skill}>
                {fillD && (
                  <path d={fillD} fill={`url(#arcGrad-${skill})`} />
                )}
                {/* Smooth main line */}
                <path d={smoothD} fill="none"
                  stroke={SKILL_COLORS[skill]} strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                  opacity={0.9}
                />
                {/* Data point circles */}
                {pts.map((p, i) => {
                  const isHov = hovered?.skill === skill && hovered?.idx === i;
                  return (
                    <g key={i}>
                      {/* Outer glow ring on hover */}
                      {isHov && (
                        <circle cx={p.x} cy={p.y} r={10}
                          fill={SKILL_COLORS[skill]} fillOpacity={0.2}
                          filter="url(#arcGlow)"
                        />
                      )}
                      <circle cx={p.x} cy={p.y} r={isHov ? 6 : 4.5}
                        fill={SKILL_COLORS[skill]}
                        stroke="#0f172a" strokeWidth={2}
                        style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                        onMouseEnter={() => setHovered({ skill, idx: i })}
                        onMouseLeave={() => setHovered(null)}
                      />
                      {/* Tooltip with glow filter */}
                      {isHov && (
                        <g filter="url(#arcGlow)">
                          <rect x={p.x - 30} y={p.y - 34} width={60} height={24} rx={6}
                            fill="#0f172a" stroke={SKILL_COLORS[skill]}
                            strokeWidth={1} strokeOpacity={0.6}
                          />
                          <text x={p.x} y={p.y - 17} textAnchor="middle"
                            fill={SKILL_COLORS[skill]}
                            fontSize={11} fontWeight={800}
                            fontFamily="ui-monospace, 'Cascadia Code', monospace">
                            {p.band.toFixed(1)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Chart border */}
          <rect x={0} y={0} width={chartW} height={chartH}
            fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1}
            className="text-slate-500" />
        </g>
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPETENCY RADAR — upgraded
// Radial gradient fill, dashed target ring, polished sans-serif axis labels
// ─────────────────────────────────────────────────────────────────────────────

const CompetencyRadar = ({
  skill, subScores, targetBand,
}: { skill: Skill; subScores: SubScores; targetBand: number }) => {
  const axes   = SUB_SKILL_AXES[skill];
  const N      = axes.length;
  const cx     = 140, cy = 140, R = 95;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const bandToScale = (b: number) => Math.min(1, Math.max(0, b / 9));
  const targetScale = bandToScale(targetBand);

  const getScore = (axisName: string): number => {
    const key   = axisName.toLowerCase().replace(/[^a-z]/g, '');
    const match = Object.entries(subScores).find(([k]) =>
      k.toLowerCase().replace(/[^a-z]/g, '').includes(key) ||
      key.includes(k.toLowerCase().replace(/[^a-z]/g, ''))
    );
    return match ? bandToScale(Number(match[1]) || 0) : bandToScale(5.0);
  };

  const angleOf    = (i: number) => (i / N) * 2 * Math.PI - Math.PI / 2;
  const polarToXY  = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  // Target ring polygon points
  const targetPts = axes.map((_, i) => {
    const { x, y } = polarToXY(angleOf(i), R * targetScale);
    return `${x},${y}`;
  }).join(' ');

  // Current scores polygon points
  const currentPts = axes.map((axis, i) => {
    const { x, y } = polarToXY(angleOf(i), R * getScore(axis));
    return `${x},${y}`;
  }).join(' ');

  const color       = SKILL_COLORS[skill];
  const gradientId  = `radarGrad-${skill}`;

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[240px] mx-auto">
      <defs>
        {/* Radial gradient fill for current score polygon */}
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity={0.45} />
          <stop offset="70%"  stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0.04} />
        </radialGradient>
      </defs>

      {/* Background level rings */}
      {levels.map(level => (
        <polygon key={level}
          points={axes.map((_, i) => {
            const { x, y } = polarToXY(angleOf(i), R * level);
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="currentColor" strokeOpacity={0.08} strokeWidth={1}
          className="text-slate-400"
        />
      ))}

      {/* Axis spokes */}
      {axes.map((_, i) => {
        const { x, y } = polarToXY(angleOf(i), R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
          stroke="currentColor" strokeOpacity={0.1} strokeWidth={1}
          className="text-slate-400" />;
      })}

      {/* Target band — dashed reference ring */}
      <polygon points={targetPts}
        fill="none"
        stroke={color} strokeOpacity={0.5} strokeWidth={1.5}
        strokeDasharray="4 4"
      />

      {/* Current scores — radial gradient fill */}
      <polygon points={currentPts}
        fill={`url(#${gradientId})`}
        stroke={color} strokeWidth={2} strokeOpacity={0.9}
        strokeLinejoin="round"
      />

      {/* Vertex dots on current scores */}
      {axes.map((axis, i) => {
        const { x, y } = polarToXY(angleOf(i), R * getScore(axis));
        return (
          <circle key={i} cx={x} cy={y} r={4}
            fill={color} stroke="#0f172a" strokeWidth={2}
          />
        );
      })}

      {/* Axis labels — clean, small, sans-serif */}
      {axes.map((axis, i) => {
        const labelR    = R + 22;
        const { x, y } = polarToXY(angleOf(i), labelR);
        const anchor    = x < cx - 8 ? "end" : x > cx + 8 ? "start" : "middle";
        // Shorten long labels
        const short     = axis.length > 11 ? axis.slice(0, 10) + '…' : axis;
        return (
          <text key={i} x={x} y={y + 3} textAnchor={anchor}
            fontSize={7.5} fontWeight={600}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fill="#94a3b8"
            letterSpacing="0.04em">
            {short.toUpperCase()}
          </text>
        );
      })}

      {/* Center skill label */}
      <text x={cx} y={cy + 4} textAnchor="middle"
        fontSize={10} fontWeight={800}
        fontFamily="ui-monospace, 'Cascadia Code', monospace"
        fill={color} letterSpacing="0.12em">
        {skill.toUpperCase()}
      </text>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PREDICTED READINESS CHART — upgraded
// Smooth history line, vertical gradient under projection, glow on stroke,
// clean dashed reference lines for Target / Today / Exam
// ─────────────────────────────────────────────────────────────────────────────

const PredictedReadinessChart = ({
  history, examDate, targetBand,
}: { history: BandDataPoint[]; examDate: string; targetBand: number }) => {
  const W = 560, H = 240;
  const PAD = { top: 20, right: 48, bottom: 44, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const yMin = 3.0, yMax = 9.5;
  const yScale = (band: number) => chartH - ((band - yMin) / (yMax - yMin)) * chartH;

  const today   = Date.now();
  const examMs  = new Date(examDate).getTime();
  const startMs = history.length > 0 ? new Date(history[0].date).getTime() : today - 30 * 86400000;
  const rangeMs = examMs - startMs;
  const xScale  = (ms: number) => ((ms - startMs) / rangeMs) * chartW;

  const overallPoints = history.map(p => {
    const bands = Object.values(p.bands).filter(b => b !== undefined) as number[];
    const avg   = bands.length > 0 ? bands.reduce((a, b) => a + b, 0) / bands.length : 5.0;
    return { x: xScale(new Date(p.date).getTime()), y: yScale(avg), ms: new Date(p.date).getTime(), band: avg };
  });

  const regPoints = overallPoints.map(p => ({
    x: (p.ms - startMs) / 86400000,
    y: p.band,
  }));
  const { slope, intercept } = linearRegression(regPoints);

  const examDays      = (examMs - startMs) / 86400000;
  const projectedBand = slope * examDays + intercept;
  const daysToTarget  = targetBand > intercept && slope > 0
    ? (targetBand - intercept) / slope
    : null;

  const status: ReadinessState["status"] =
    projectedBand >= targetBand       ? "on_track" :
    projectedBand >= targetBand - 0.5 ? "at_risk"  : "behind";

  const statusColor = status === "on_track" ? "#10b981" : status === "at_risk" ? "#f59e0b" : "#ef4444";
  const statusLabel = status === "on_track" ? "On Track" : status === "at_risk" ? "At Risk" : "Behind Pace";

  const lastPt     = overallPoints[overallPoints.length - 1];
  const projEndX   = xScale(examMs);
  const projEndY   = yScale(Math.min(9.0, Math.max(3.0, projectedBand)));
  const targetY    = yScale(targetBand);
  const todayX     = xScale(today);
  const targetHitX = daysToTarget !== null
    ? xScale(startMs + daysToTarget * 86400000)
    : null;

  // Smooth history path
  const historyXY   = overallPoints.map(p => ({ x: p.x, y: p.y }));
  const smoothHistD = createSmoothPath(historyXY);

  return (
    <div className="w-full overflow-x-auto">
      {/* Status header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          style={{ color: statusColor }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
          {statusLabel}
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Projected at exam:{" "}
          <strong style={{ color: statusColor }}>{Math.min(9.0, projectedBand).toFixed(1)}</strong>
          {" / "}
          <strong className="text-slate-400">{targetBand.toFixed(1)} target</strong>
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
        <defs>
          {/* Vertical gradient under projected trajectory — from 20% → 0% */}
          <linearGradient id="projFillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={statusColor} stopOpacity={0.20} />
            <stop offset="100%" stopColor={statusColor} stopOpacity={0.00} />
          </linearGradient>

          {/* Glow filter for history stroke */}
          <filter id="readinessGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>

          {/* Y grid — dashed, very low opacity */}
          {[4,5,6,7,8,9].map(b => (
            <g key={b}>
              <line x1={0} x2={chartW} y1={yScale(b)} y2={yScale(b)}
                stroke="currentColor" strokeOpacity={0.05} strokeWidth={1}
                strokeDasharray="4 4" className="text-slate-400" />
              <text x={-10} y={yScale(b) + 4} textAnchor="end"
                fontSize={8} fontWeight={700}
                fontFamily="ui-monospace, 'Cascadia Code', monospace"
                fill="#64748b">
                {b}
              </text>
            </g>
          ))}

          {/* Target band — clean dashed horizontal */}
          <line x1={0} x2={chartW} y1={targetY} y2={targetY}
            stroke="#6366f1" strokeWidth={1.5} strokeDasharray="6 5" opacity={0.55} />
          <text x={chartW + 4} y={targetY + 4}
            fontSize={7} fontWeight={800} fill="#818cf8"
            fontFamily="ui-monospace, 'Cascadia Code', monospace"
            letterSpacing="0.06em">
            TARGET
          </text>

          {/* Today — clean dashed vertical */}
          {todayX >= 0 && todayX <= chartW && (
            <>
              <line x1={todayX} x2={todayX} y1={0} y2={chartH}
                stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 5" opacity={0.4} />
              <text x={todayX} y={chartH + 14} textAnchor="middle"
                fontSize={7} fontWeight={700} fill="#64748b"
                fontFamily="ui-monospace, 'Cascadia Code', monospace"
                letterSpacing="0.06em">
                TODAY
              </text>
            </>
          )}

          {/* Exam date — clean dashed vertical */}
          <line x1={projEndX} x2={projEndX} y1={0} y2={chartH}
            stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6} />
          <text x={projEndX} y={chartH + 14} textAnchor="middle"
            fontSize={7} fontWeight={700} fill="#f87171"
            fontFamily="ui-monospace, 'Cascadia Code', monospace"
            letterSpacing="0.06em">
            EXAM
          </text>

          {/* Projected trajectory fill — vertical gradient */}
          {lastPt && (
            <path
              d={`M ${lastPt.x} ${lastPt.y} L ${projEndX} ${projEndY} L ${projEndX} ${chartH} L ${lastPt.x} ${chartH} Z`}
              fill="url(#projFillGrad)"
            />
          )}

          {/* Projected dashed trajectory line */}
          {lastPt && (
            <line
              x1={lastPt.x} y1={lastPt.y} x2={projEndX} y2={projEndY}
              stroke={statusColor} strokeWidth={1.5}
              strokeDasharray="5 5" opacity={0.7}
            />
          )}

          {/* Historical line — smooth + glow filter */}
          {overallPoints.length > 1 && (
            <>
              {/* Glow layer (blurred) */}
              <path d={smoothHistD} fill="none"
                stroke={statusColor} strokeWidth={6}
                strokeLinecap="round" strokeLinejoin="round"
                opacity={0.15}
              />
              {/* Main crisp line */}
              <path d={smoothHistD} fill="none"
                stroke={statusColor} strokeWidth={2.5}
                strokeLinecap="round" strokeLinejoin="round"
                filter="url(#readinessGlow)"
              />
            </>
          )}

          {/* History dots */}
          {overallPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={5}
              fill={statusColor} stroke="#0f172a" strokeWidth={2}
            />
          ))}

          {/* Target hit marker */}
          {targetHitX !== null && targetHitX > todayX && targetHitX <= projEndX && (
            <g>
              <circle cx={targetHitX} cy={targetY} r={6}
                fill="#10b981" stroke="#0f172a" strokeWidth={2} />
              <text x={targetHitX} y={targetY - 12} textAnchor="middle"
                fontSize={7} fontWeight={800} fill="#10b981"
                fontFamily="ui-monospace, 'Cascadia Code', monospace"
                letterSpacing="0.08em">
                HIT
              </text>
            </g>
          )}

          {/* Projected band endpoint dot */}
          <circle cx={projEndX} cy={projEndY} r={6}
            fill={statusColor} stroke="#0f172a" strokeWidth={2} />

        </g>
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — unchanged structure, only chart sub-components upgraded
// ─────────────────────────────────────────────────────────────────────────────

export default function Report() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [activeTab,          setActiveTab]           = useState<"arc" | "radar" | "readiness">("arc");
  const [activeSkill,        setActiveSkill]         = useState<Skill>("speaking");
  const [competencyData,     setCompetencyData]      = useState<Record<Skill, SubScores>>({
    listening: {}, reading: {}, writing: {}, speaking: {},
  });
  const [targetBand, setTargetBand] = useState(7.0);

  const history         = useMemo(() => readBandHistory(), []);
  const diagnosticBands = useMemo(() => readDiagnosticBands(), []);
  const examConfig      = useMemo(() => readExamConfig(), []);

  const latestBands = useMemo((): Record<Skill, number> => {
    const result = { ...diagnosticBands };
    history.forEach(point => {
      SKILLS.forEach(skill => {
        if (point.bands[skill] !== undefined) result[skill] = point.bands[skill]!;
      });
    });
    return result;
  }, [history, diagnosticBands]);

  const overallCurrent  = Math.round((Object.values(latestBands).reduce((a, b) => a + b, 0) / 4) * 2) / 2;
  const overallDiag     = Math.round((Object.values(diagnosticBands).reduce((a, b) => a + b, 0) / 4) * 2) / 2;
  const overallImproved = overallCurrent - overallDiag;
  const daysLeft        = Math.max(0, Math.floor((new Date(examConfig.examDate).getTime() - Date.now()) / 86400000));

  useEffect(() => {
    const fetch = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const res        = await callBackend(`${backendUrl}/api/student/competency-scores`);
        if (res.success && res.data) {
          const newData: Record<Skill, SubScores> = { listening: {}, reading: {}, writing: {}, speaking: {} };
          res.data.forEach((record: any) => {
            const skill = record.skill?.toLowerCase() as Skill;
            if (skill && SKILLS.includes(skill)) newData[skill] = record.sub_scores || {};
          });
          setCompetencyData(newData);
          if (res.target_band) setTargetBand(Number(res.target_band));
        }
      } catch {
        const mockData: Record<Skill, SubScores> = { listening: {}, reading: {}, writing: {}, speaking: {} };
        SKILLS.forEach(skill => {
          const base = latestBands[skill];
          SUB_SKILL_AXES[skill].forEach((axis, i) => {
            mockData[skill][axis] = Math.max(1, Math.min(9, base + (i % 2 === 0 ? 0.5 : -0.5)));
          });
        });
        setCompetencyData(mockData);
      }
    };
    fetch();
  }, [latestBands]);

  const iaCount   = history.filter(p => p.type === "ia").length;
  const mockCount = history.filter(p => p.type === "mock").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
      <StudentSidebar
        activeTab="Report"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={cn(
        "min-h-screen flex flex-col transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "md:pl-[116px]" : "md:pl-[288px]"
      )}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Progress Report
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Only Internal Assessment and Mock Test results appear here — not drill practice.
            </p>
          </div>

          {/* Summary stat bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Band</p>
              <p className="text-4xl font-black text-slate-900 dark:text-white leading-none">{overallCurrent.toFixed(1)}</p>
              <p className={cn("text-xs font-bold mt-1.5", overallImproved > 0 ? "text-emerald-500" : overallImproved < 0 ? "text-rose-500" : "text-slate-400")}>
                {overallImproved > 0 ? `+${overallImproved.toFixed(1)} since diagnostic` : overallImproved < 0 ? `${overallImproved.toFixed(1)} vs diagnostic` : "No change yet"}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Band</p>
              <p className="text-4xl font-black text-indigo-500 leading-none">{targetBand.toFixed(1)}</p>
              <p className="text-xs font-bold mt-1.5 text-slate-400">{(targetBand - overallCurrent).toFixed(1)} to go</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exam In</p>
              <p className={cn("text-4xl font-black leading-none", daysLeft <= 21 ? "text-rose-500" : daysLeft <= 45 ? "text-amber-500" : "text-slate-900 dark:text-white")}>
                {daysLeft}d
              </p>
              <p className="text-xs font-bold mt-1.5 text-slate-400">{examConfig.examDate}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assessments</p>
              <p className="text-4xl font-black text-slate-900 dark:text-white leading-none">{iaCount + mockCount}</p>
              <p className="text-xs font-bold mt-1.5 text-slate-400">{iaCount} IA · {mockCount} Mock</p>
            </div>
          </div>

          {/* Per-skill mini cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SKILLS.map(skill => {
              const current = latestBands[skill];
              const diag    = diagnosticBands[skill];
              const delta   = current - diag;
              return (
                <div key={skill} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SKILL_COLORS[skill] }} />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{SKILL_LABELS[skill]}</p>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{current.toFixed(1)}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(current / 9) * 100}%`, backgroundColor: SKILL_COLORS[skill] }} />
                    </div>
                    <span className={cn("text-[10px] font-black", delta > 0 ? "text-emerald-500" : delta < 0 ? "text-rose-500" : "text-slate-400")}>
                      {delta > 0 ? `+${delta.toFixed(1)}` : delta === 0 ? "—" : delta.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tab panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              {([
                { id: "arc",       icon: TrendingUp, label: "Band Arc",            sub: "Am I improving?" },
                { id: "radar",     icon: Target,     label: "Competency Radar",    sub: "Where are my gaps?" },
                { id: "readiness", icon: Calendar,   label: "Predicted Readiness", sub: "Will I be ready?" },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 px-4 py-4 text-left transition-all border-b-2",
                    activeTab === tab.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}>
                  <tab.icon className={cn("w-4 h-4 shrink-0 mt-0.5", activeTab === tab.id ? "text-indigo-500" : "text-slate-400")} />
                  <div>
                    <p className={cn("text-xs font-black uppercase tracking-wider", activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300")}>
                      {tab.label}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium hidden sm:block">{tab.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* BAND ARC TAB */}
            {activeTab === "arc" && (
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Band Arc — Score Over Time</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Only IA and Mock Test scores plot here. Drill practice never appears — this keeps the chart honest.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0 ml-4">
                    {SKILLS.map(s => (
                      <div key={s} className="flex items-center gap-1.5">
                        <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: SKILL_COLORS[s] }} />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{SKILL_LABELS[s]}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-3 h-3 rounded-full bg-violet-500" />
                      <span className="text-[9px] font-bold text-slate-400">IA</span>
                      <div className="w-3 h-3 rounded-full bg-indigo-600 ml-1" />
                      <span className="text-[9px] font-bold text-slate-400">Mock</span>
                    </div>
                  </div>
                </div>
                {history.length < 2 ? (
                  <EmptyState icon={TrendingUp} title="No assessment data yet"
                    message="Complete your first Internal Assessment to start tracking band movement. Only IA and Mock results appear on this chart." />
                ) : (
                  <BandArcChart history={history} />
                )}
              </div>
            )}

            {/* COMPETENCY RADAR TAB */}
            {activeTab === "radar" && (
              <div className="p-6">
                <div className="mb-5">
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Competency Radar — Sub-skill Gaps</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    The filled shape is your current sub-skill profile. The dashed ring is your target band. The sunken points are your gaps.
                  </p>
                </div>
                <div className="flex gap-2 mb-6 flex-wrap">
                  {SKILLS.map(s => (
                    <button key={s} onClick={() => setActiveSkill(s)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                        activeSkill === s
                          ? "text-white border-transparent"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                      )}
                      style={activeSkill === s ? { backgroundColor: SKILL_COLORS[s], borderColor: SKILL_COLORS[s] } : {}}>
                      {SKILL_LABELS[s]}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <CompetencyRadar skill={activeSkill} subScores={competencyData[activeSkill]} targetBand={targetBand} />
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sub-skill Breakdown</p>
                    {SUB_SKILL_AXES[activeSkill].map(axis => {
                      const key   = Object.keys(competencyData[activeSkill]).find(k =>
                        k.toLowerCase().replace(/[^a-z]/g, '').includes(axis.toLowerCase().replace(/[^a-z]/g, '')) ||
                        axis.toLowerCase().replace(/[^a-z]/g, '').includes(k.toLowerCase().replace(/[^a-z]/g, ''))
                      );
                      const score = key ? Number(competencyData[activeSkill][key]) : latestBands[activeSkill];
                      const pct   = (score / 9) * 100;
                      const gap   = targetBand - score;
                      return (
                        <div key={axis}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{axis}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white">{score.toFixed(1)}</span>
                              {gap > 0
                                ? <span className="text-[9px] font-bold text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">−{gap.toFixed(1)}</span>
                                : <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">✓</span>
                              }
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: SKILL_COLORS[activeSkill] }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-1 border border-dashed rounded" style={{ borderColor: SKILL_COLORS[activeSkill] }} />
                        <span className="text-[10px] font-bold text-slate-400">Dashed ring = target band {targetBand.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREDICTED READINESS TAB */}
            {activeTab === "readiness" && (
              <div className="p-6">
                <div className="mb-5">
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Predicted Readiness</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Your current trajectory projected to exam date. If the trend line crosses the target line before the exam line — you're on track.
                  </p>
                </div>
                {history.length < 2 ? (
                  <EmptyState icon={Calendar} title="Not enough data to project"
                    message="Complete at least 2 Internal Assessments so the system can calculate your improvement trajectory." />
                ) : (
                  <>
                    <PredictedReadinessChart history={history} examDate={examConfig.examDate} targetBand={targetBand} />
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <LegendItem color="#6366f1" label="Target band" dashed />
                      <LegendItem color="#f87171" label="Exam date"   dashed />
                      <LegendItem color="#94a3b8" label="Today"       dashed />
                      <LegendItem color="#10b981" label="Projected trend" />
                    </div>
                    <ReadinessInsightCard history={history} examDate={examConfig.examDate} targetBand={targetBand} daysLeft={daysLeft} />
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER SUB-COMPONENTS — unchanged
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState = ({ icon: Icon, title, message }: {
  icon: React.ElementType; title: string; message: string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
    </div>
    <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">{title}</h3>
    <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">{message}</p>
  </div>
);

const LegendItem = ({ color, label, dashed = false }: {
  color: string; label: string; dashed?: boolean;
}) => (
  <div className="flex items-center gap-2">
    {dashed
      ? <div className="w-6 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
      : <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: color }} />
    }
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
  </div>
);

const ReadinessInsightCard = ({
  history, examDate, targetBand, daysLeft,
}: { history: BandDataPoint[]; examDate: string; targetBand: number; daysLeft: number }) => {
  const startMs = new Date(history[0].date).getTime();
  const overallPoints = history.map(p => {
    const bands = Object.values(p.bands).filter(b => b !== undefined) as number[];
    const avg   = bands.reduce((a, b) => a + b, 0) / (bands.length || 1);
    return { x: (new Date(p.date).getTime() - startMs) / 86400000, y: avg };
  });

  const { slope, intercept } = linearRegression(overallPoints);
  const examDays  = (new Date(examDate).getTime() - startMs) / 86400000;
  const projected = slope * examDays + intercept;
  const gap       = targetBand - projected;
  const status    = gap <= 0 ? "on_track" : gap <= 0.5 ? "at_risk" : "behind";

  const configs = {
    on_track: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, title: "You're on track",
      message: `At your current pace you'll reach band ${targetBand.toFixed(1)} before your exam date. Keep the drill rhythm consistent and don't miss IA windows.`,
    },
    at_risk: {
      bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, title: "Slightly behind pace",
      message: `You're projected to reach band ${projected.toFixed(1)} by exam day — ${gap.toFixed(1)} short of target. Completing IAs on time and avoiding missed windows will help close this gap.`,
    },
    behind: {
      bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20",
      icon: <AlertTriangle className="w-5 h-5 text-rose-500" />, title: "Behind pace",
      message: `Projected at band ${projected.toFixed(1)} by exam day — ${gap.toFixed(1)} below target. Consider increasing session frequency and completing the bonus 4th drill daily to accelerate your trajectory.`,
    },
  };

  const cfg = configs[status];
  return (
    <div className={cn("mt-4 rounded-2xl border p-5 flex items-start gap-4", cfg.bg, cfg.border)}>
      <div className="shrink-0 mt-0.5">{cfg.icon}</div>
      <div>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">{cfg.title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{cfg.message}</p>
        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
          {daysLeft} days remaining · Target {targetBand.toFixed(1)} · Projected {Math.min(9, projected).toFixed(1)}
        </p>
      </div>
    </div>
  );
};