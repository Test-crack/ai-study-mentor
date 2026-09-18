// SuperAdmin — Question Bank inventory.
// Live, read-only counts of how many questions exist per exam, broken down by
// component (Diagnostics / Daily Drills / Internal Assessment / Mock Test) and
// within each by skill → sub-skill → level. Lets an admin spot which exam,
// skill and level are thin and need more authoring.
import { useEffect, useMemo, useState } from 'react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
    fetchQuestionBankSummary,
    type QuestionBankSummary,
    type QBExam,
    type QBComponentKey,
    type QBComponentMeta,
    type QBSkillNode,
    type QBLevelCount,
} from '../services/superadminService';
import {
    Library,
    RefreshCw,
    Loader2,
    ChevronRight,
    ChevronDown,
    AlertTriangle,
    LayoutGrid,
    Boxes,
} from 'lucide-react';

// ─── Presentation helpers ────────────────────────────────────────────────────

const nf = new Intl.NumberFormat();

/** Prettify enum-ish keys: LISTENING → Listening, TASK_RESPONSE → Task Response. */
function humanize(key: string): string {
    return key
        .toLowerCase()
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/** Colour a count by how much attention it needs (drives the "needs more" signal). */
function toneClasses(n: number): string {
    if (n === 0) return 'bg-brand-warm-danger/10 text-brand-warm-danger';
    if (n < 10) return 'bg-amber-100 text-amber-700';
    return 'bg-brand-teal-50 text-brand-teal-700';
}

function statusDotClass(status: string): string {
    if (status === 'live') return 'bg-brand-teal-500';
    if (status === 'reserved') return 'bg-amber-400';
    if (status === 'disabled') return 'bg-brand-warm-danger';
    return 'bg-brand-line';
}

/** Small count pill used throughout the breakdown. */
function CountPill({ n, title }: { n: number; title?: string }) {
    return (
        <span
            title={title}
            className={`inline-flex min-w-[2.25rem] justify-center items-center px-2 py-0.5 rounded-md font-jetbrains text-[11px] font-bold tabular-nums ${toneClasses(n)}`}
        >
            {nf.format(n)}
        </span>
    );
}

/** Level distribution as labelled chips, e.g. "Beginner 40 · Intermediate 12". */
function LevelChips({ levels }: { levels: QBLevelCount[] }) {
    if (levels.length === 0) return <span className="text-[11px] text-brand-text-mute">—</span>;
    return (
        <div className="flex flex-wrap gap-1.5">
            {levels.map(l => (
                <span
                    key={l.key}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-jetbrains text-[10px] font-semibold ${toneClasses(l.count)}`}
                >
                    <span className="uppercase tracking-wide opacity-70">{humanize(l.key)}</span>
                    <span className="tabular-nums">{nf.format(l.count)}</span>
                </span>
            ))}
        </div>
    );
}

// ─── Skill row (expandable to sub-skills) ────────────────────────────────────

function SkillRow({
    skill,
    meta,
}: {
    skill: QBSkillNode;
    meta: QBComponentMeta;
}) {
    const [open, setOpen] = useState(false);
    const canExpand = meta.hasSubSkill && skill.subSkills.length > 0;

    return (
        <div className="border-b border-brand-line last:border-b-0">
            <button
                type="button"
                disabled={!canExpand}
                onClick={() => canExpand && setOpen(o => !o)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left ${canExpand ? 'hover:bg-brand-bg-alt cursor-pointer' : 'cursor-default'}`}
            >
                <span className="w-4 shrink-0 text-brand-text-mute">
                    {canExpand ? (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : null}
                </span>
                <span className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-brand-text">{humanize(skill.skill)}</span>
                </span>
                {meta.hasLevel && (
                    <span className="hidden md:block flex-1 min-w-0">
                        <LevelChips levels={skill.levels} />
                    </span>
                )}
                <CountPill n={skill.total} title="Questions in this skill" />
            </button>

            {open && canExpand && (
                <div className="bg-brand-bg-alt/60 px-4 pb-3 pt-1">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-brand-text-mute font-jetbrains">
                                <th className="py-1.5 font-semibold">Sub-skill</th>
                                {meta.hasLevel && <th className="py-1.5 font-semibold">{meta.levelLabel} breakdown</th>}
                                <th className="py-1.5 font-semibold text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {skill.subSkills.map(sub => (
                                <tr key={sub.key} className="border-t border-brand-line/60">
                                    <td className="py-2 pr-3 text-[13px] text-brand-text">{humanize(sub.key)}</td>
                                    {meta.hasLevel && (
                                        <td className="py-2 pr-3">
                                            <LevelChips levels={sub.levels} />
                                        </td>
                                    )}
                                    <td className="py-2 text-right">
                                        <CountPill n={sub.total} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Component detail panel ──────────────────────────────────────────────────

function ComponentDetail({
    exam,
    meta,
}: {
    exam: QBExam;
    meta: QBComponentMeta;
}) {
    const breakdown = exam.components[meta.key];

    return (
        <div className="rounded-2xl border border-brand-line bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-brand-line bg-brand-bg-alt/40">
                <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-brand-teal-600" />
                    <h3 className="font-manrope font-bold text-sm text-brand-text">{meta.label}</h3>
                    {meta.key === 'diagnostic' && breakdown.setCount != null && (
                        <span className="font-jetbrains text-[10px] text-brand-text-mute">
                            · {nf.format(breakdown.setCount)} set{breakdown.setCount === 1 ? '' : 's'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-jetbrains text-brand-text-mute">
                    <span>Total</span>
                    <CountPill n={breakdown.total} />
                </div>
            </div>

            {breakdown.skills.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-8 justify-center text-sm text-brand-text-mute">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    No questions yet for this component.
                </div>
            ) : (
                <div>{breakdown.skills.map(s => <SkillRow key={s.skill} skill={s} meta={meta} />)}</div>
            )}
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function QuestionBank() {
    const { toast } = useToast();
    const [collapsed, setCollapsed] = useState(false);

    const [summary, setSummary] = useState<QuestionBankSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchQuestionBankSummary();
            setSummary(data);
            // Keep the current selection if it still exists; otherwise pick the first exam.
            setSelectedExamId(prev =>
                prev && data.exams.some(e => e.examId === prev) ? prev : data.exams[0]?.examId ?? null,
            );
        } catch (err: any) {
            const msg = err?.message ?? 'Failed to load the question bank.';
            setError(msg);
            if (!err?._toasted) toast({ title: 'Could not load question bank', description: msg, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedExam = useMemo(
        () => summary?.exams.find(e => e.examId === selectedExamId) ?? null,
        [summary, selectedExamId],
    );

    return (
        <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
            <div className="hidden lg:block">
                <SuperAdminSidebar activeTab="question-bank" isCollapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
            </div>
            <div className={`relative z-10 transition-all duration-300 flex flex-col min-h-screen ${collapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
                <SuperAdminTopbar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1400px] mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">
                                    Content inventory
                                </p>
                                <h1 className="font-manrope text-2xl font-black tracking-tight flex items-center gap-2">
                                    <Library className="w-6 h-6 text-brand-teal-600" /> Question Bank
                                </h1>
                                <p className="text-sm text-brand-text-mute mt-1">
                                    Live counts of active questions across every exam, broken down by component, skill,
                                    sub-skill and level — so you can see exactly which parts need more authoring.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {summary && (
                                    <span className="hidden sm:block font-jetbrains text-[10px] text-brand-text-mute">
                                        Updated {new Date(summary.generatedAt).toLocaleString()}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={load}
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 rounded-xl border border-brand-line bg-white px-3 py-2 text-sm font-semibold text-brand-text hover:bg-brand-bg-alt disabled:opacity-50 transition-colors"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Loading / error / empty states */}
                        {loading && !summary && (
                            <div className="flex items-center justify-center gap-2 py-24 text-brand-text-mute">
                                <Loader2 className="w-5 h-5 animate-spin" /> Loading question bank…
                            </div>
                        )}

                        {error && !loading && (
                            <div className="flex items-start gap-3 rounded-xl border border-brand-warm-danger/30 bg-brand-warm-danger/5 p-4">
                                <AlertTriangle className="w-5 h-5 text-brand-warm-danger shrink-0 mt-0.5" />
                                <div className="text-sm text-brand-text">
                                    <p className="font-semibold">Couldn’t load the question bank.</p>
                                    <p className="text-brand-text-mute mt-0.5">{error}</p>
                                </div>
                            </div>
                        )}

                        {summary && summary.exams.length === 0 && !loading && (
                            <div className="rounded-xl border border-brand-line bg-white p-8 text-center text-sm text-brand-text-mute">
                                No exams are registered on the platform yet.
                            </div>
                        )}

                        {/* Exam switcher */}
                        {summary && summary.exams.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {summary.exams.map(ex => {
                                    const active = ex.examId === selectedExamId;
                                    return (
                                        <button
                                            key={ex.examId}
                                            type="button"
                                            onClick={() => setSelectedExamId(ex.examId)}
                                            className={`inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-colors ${
                                                active
                                                    ? 'border-brand-teal-300 bg-brand-teal-50'
                                                    : 'border-brand-line bg-white hover:bg-brand-bg-alt'
                                            }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass(ex.status)}`} title={ex.status} />
                                            <span className="flex flex-col items-start leading-tight">
                                                <span className={`text-sm font-semibold ${active ? 'text-brand-teal-800' : 'text-brand-text'}`}>
                                                    {ex.label}
                                                </span>
                                                <span className="font-jetbrains text-[10px] text-brand-text-mute">
                                                    {nf.format(ex.total)} question{ex.total === 1 ? '' : 's'}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Component summary cards */}
                        {summary && selectedExam && (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {summary.components.map(meta => {
                                        const b = selectedExam.components[meta.key];
                                        return (
                                            <div key={meta.key} className="rounded-2xl border border-brand-line bg-white p-4">
                                                <div className="flex items-center gap-2 text-brand-text-mute">
                                                    <LayoutGrid className="w-4 h-4" />
                                                    <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.1em]">
                                                        {meta.label}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-end justify-between">
                                                    <span className="font-manrope text-3xl font-black tabular-nums text-brand-text">
                                                        {nf.format(b.total)}
                                                    </span>
                                                    {meta.key === 'diagnostic' && b.setCount != null && (
                                                        <span className="font-jetbrains text-[10px] text-brand-text-mute mb-1">
                                                            {nf.format(b.setCount)} set{b.setCount === 1 ? '' : 's'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Per-component detailed breakdown */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {summary.components.map(meta => (
                                        <ComponentDetail key={meta.key} exam={selectedExam} meta={meta} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
