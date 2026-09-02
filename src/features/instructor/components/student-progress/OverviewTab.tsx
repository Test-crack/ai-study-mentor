import { CheckCircle2, AlertCircle, Gamepad2, Zap, Award } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { cn } from '@/shared/utils';
import { bandFillPct } from '@/shared/utils/bandScale';
import { isSpokenEnglish } from '@/features/student/utils/exam';
import { cefrColor, cefrGaugeColor, CEFR_ORDER, cefrOrdinal } from '@/features/student/config/cefrDisplay';
import { SE_SUBSKILLS } from '@/features/student/config/spokenEnglishSubskills';
import type { StudentFullProgress, CompetencyRow } from './types';

interface Props { data: StudentFullProgress; }

function MiniCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-line p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-brand-teal-50 flex items-center justify-center shrink-0 text-brand-teal-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-brand-text-mute font-jetbrains uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg font-black text-brand-text leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-brand-text-mute">{sub}</p>}
      </div>
    </div>
  );
}

const SKILL_ROWS: Array<{ abbr: 'L' | 'R' | 'W' | 'S'; label: string; skill: string }> = [
  { abbr: 'L', label: 'Listening', skill: 'LISTENING' },
  { abbr: 'R', label: 'Reading',   skill: 'READING'   },
  { abbr: 'W', label: 'Writing',   skill: 'WRITING'   },
  { abbr: 'S', label: 'Speaking',  skill: 'SPEAKING'  },
];

function BaselineComparison({ baseline, competency }: {
  baseline: StudentFullProgress['diagnostic_baseline'];
  competency: StudentFullProgress['competency'];
}) {
  const currentBySkill = new Map(competency.map(r => [r.skill.toUpperCase(), r.band_score]));
  const hasBaseline = baseline != null && SKILL_ROWS.some(r => baseline[r.abbr] !== null);
  const hasCurrent  = SKILL_ROWS.some(r => (currentBySkill.get(r.skill) ?? 0) > 0);

  if (!hasBaseline && !hasCurrent) return null;

  return (
    <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-5">
      <h3 className="text-sm font-bold text-brand-text mb-4">
        Diagnostic Baseline vs Current
      </h3>
      <div className="space-y-3">
        {SKILL_ROWS.map(({ abbr, label, skill }) => {
          const base    = baseline[abbr];
          const current = currentBySkill.get(skill) ?? null;
          const delta   = base !== null && current !== null ? Math.round((current - base) * 10) / 10 : null;

          return (
            <div key={abbr} className="grid grid-cols-[80px_1fr_60px_60px_52px] items-center gap-2">
              <span className="text-xs font-semibold text-brand-text-mute shrink-0">{label}</span>
              <div className="relative h-2 bg-brand-bg-alt rounded-full overflow-hidden">
                {/* baseline marker */}
                {base !== null && (
                  <div
                    className="absolute top-0 h-full bg-brand-text-mute/40 rounded-full"
                    style={{ width: `${bandFillPct(base)}%` }}
                  />
                )}
                {/* current fill */}
                {current !== null && current > 0 && (
                  <div
                    className="absolute top-0 h-full bg-brand-teal-500 rounded-full opacity-80"
                    style={{ width: `${bandFillPct(current)}%` }}
                  />
                )}
              </div>
              <span className="text-[10px] text-brand-text-mute text-right">
                {base !== null ? base.toFixed(1) : '—'}
              </span>
              <span className={cn(
                'text-xs font-black text-right',
                (current ?? 0) >= 7.5 ? 'text-emerald-600'
                : (current ?? 0) >= 6.0 ? 'text-amber-600'
                : (current ?? 0) > 0    ? 'text-rose-600'
                : 'text-brand-text-mute'
              )}>
                {current !== null && current > 0 ? current.toFixed(1) : '—'}
              </span>
              <span className={cn(
                'text-[10px] font-bold text-right',
                delta === null ? 'text-brand-text-mute/60'
                : delta > 0   ? 'text-emerald-600'
                : delta < 0   ? 'text-rose-600'
                : 'text-brand-text-mute'
              )}>
                {delta === null ? '—' : delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-brand-text-mute">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded bg-brand-text-mute/40 inline-block" /> Baseline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded bg-brand-teal-500 inline-block opacity-80" /> Current
        </span>
        <span className="ml-auto italic">Δ = current − baseline</span>
      </div>
    </div>
  );
}

export function IeltsOverviewTab({ data }: Props) {
  const competency          = data.competency         ?? [];
  const diagnostic_baseline = data.diagnostic_baseline ?? { L: null, R: null, W: null, S: null };
  const lexigrid_stats      = data.lexigrid_stats      ?? { games_last_14: 0, avg_words_solved: 0, bonus_rate: 0 };
  const ia_eligibility      = data.ia_eligibility      ?? { prerequisites_met: false, avg_dcs: 0, drills_completed: 0, next_ia_date: null };

  const radarData = competency
    .filter(r => r.band_score > 0)
    .map(r => ({ skill: r.skill, band: r.band_score, fullMark: 9 }));

  const eligOk = ia_eligibility.prerequisites_met;

  return (
    <div className="space-y-5">
      {/* IA Eligibility */}
      <div className={cn(
        'rounded-2xl border p-4 flex items-start gap-3',
        eligOk
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      )}>
        {eligOk
          ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          : <AlertCircle  className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold', eligOk ? 'text-emerald-800' : 'text-amber-800')}>
            {eligOk ? 'IA Eligible — Prerequisites met' : 'Not yet IA eligible'}
          </p>
          <p className={cn('text-xs mt-0.5', eligOk ? 'text-emerald-700' : 'text-amber-700')}>
            {ia_eligibility.drills_completed} drills completed · Avg DCS {ia_eligibility.avg_dcs}%
            {ia_eligibility.next_ia_date && ` · Next IA: ${ia_eligibility.next_ia_date}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Competency Radar */}
        <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-5">
          <h3 className="text-sm font-bold text-brand-text mb-4">Competency Radar</h3>
          {radarData.length >= 3 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#e2e8f0" strokeOpacity={0.6} />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[4, 9]}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickCount={4}
                  />
                  <Radar
                    name="Band"
                    dataKey="band"
                    stroke="#12897C"
                    fill="#12897C"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}`, 'Band']}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : radarData.length > 0 ? (
            <div className="space-y-3 py-2">
              {radarData.map(r => (
                <div key={r.skill} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-brand-text-mute w-20 shrink-0">{r.skill}</span>
                  <div className="flex-1 h-2 bg-brand-bg-alt rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-teal-500 rounded-full"
                      style={{ width: `${bandFillPct(r.band)}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-brand-text w-8 text-right">{r.band.toFixed(1)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-brand-text-mute text-sm">
              No competency data yet
            </div>
          )}
        </div>

        {/* LexiGrid Stats */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-brand-text">LexiGrid (last 14 days)</h3>
          <MiniCard
            icon={<Gamepad2 className="h-4 w-4" />}
            label="Games Played"
            value={lexigrid_stats.games_last_14}
            sub="completed sessions"
          />
          <MiniCard
            icon={<Award className="h-4 w-4" />}
            label="Avg Words Solved"
            value={lexigrid_stats.avg_words_solved}
            sub="per game"
          />
          <MiniCard
            icon={<Zap className="h-4 w-4" />}
            label="Bonus Rate"
            value={`${lexigrid_stats.bonus_rate}%`}
            sub="bonus eligible games"
          />
        </div>
      </div>

      {/* Diagnostic baseline vs current bands */}
      <BaselineComparison baseline={diagnostic_baseline} competency={competency} />
    </div>
  );
}

// ── Spoken English (CEFR) ──────────────────────────────────────────────────
// Cohort 1 hides IA/mock/lexigrid/drills for spoken_english (see
// EXAM_DISPLAY.spoken_english.showTiles) — those instructor sections would
// describe features the SE student can't even access yet, so this variant
// shows only the one thing that exists for SE today: the 6-subskill profile.

// SE has one competency row (SPEAKING); the 6 subskills live inside its
// sub_scores.subskillProfile array, not as separate competency rows — same
// shape used by AssessmentHistoryPage/Report/VivaDiagnostic on the student side.
function subskillRows(competency: CompetencyRow[]) {
  const speaking = competency.find(r => r.skill.toUpperCase() === 'SPEAKING');
  const profile: Array<{ id: string; label: string; level: string; score: number }> =
    Array.isArray((speaking?.sub_scores as any)?.subskillProfile)
      ? (speaking!.sub_scores as any).subskillProfile
      : [];
  const byId = new Map(profile.map(p => [p.id, p]));
  return SE_SUBSKILLS.map(s => ({ sub: s, row: byId.get(s.id) }));
}

export function SpokenEnglishOverviewTab({ data }: Props) {
  const rows = subskillRows(data.competency ?? []);
  const scored = rows.filter(r => !!r.row?.level);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-brand-line shadow-sm p-5">
        <h3 className="text-sm font-bold text-brand-text mb-4">Subskill Profile (CEFR)</h3>
        {scored.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-brand-text-mute text-sm">
            No subskill data yet
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {rows.map(({ sub, row }) => {
              const label = row?.level ?? null;
              const pct = label ? (cefrOrdinal(label) / (CEFR_ORDER.length - 1)) * 100 : 0;
              return (
                <div key={sub.id} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-brand-text-mute w-32 shrink-0 truncate" title={sub.label}>
                    {sub.label}
                  </span>
                  <div className="flex-1 h-2 bg-brand-bg-alt rounded-full overflow-hidden">
                    {label && (
                      <div className={cn('h-full rounded-full', cefrGaugeColor(label))} style={{ width: `${pct}%` }} />
                    )}
                  </div>
                  <span className={cn('text-xs font-black w-8 text-right', label ? cefrColor(label) : 'text-brand-text-mute')}>
                    {label?.toUpperCase() ?? '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── dispatcher ────────────────────────────────────────────────────────────────

export function OverviewTab({ data }: Props) {
  return isSpokenEnglish(data.student.exam_id)
    ? <SpokenEnglishOverviewTab data={data} />
    : <IeltsOverviewTab data={data} />;
}
