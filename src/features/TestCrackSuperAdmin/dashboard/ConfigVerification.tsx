// SuperAdmin — Config Verification (Stage 0).
// Two layers, mirroring the question-verification panel:
//   Layer 1 — structural: will the engine actually run this config? (wraps validateConfig)
//   Layer 2 — interpretation: what the config MEANS, in plain English — the SAME resolution
//             the runtime uses, so a non-technical admin confirms exactly what the app
//             understood. No divergence, no "why isn't it working, ask the dev".
// Verify a LIVE exam by id, or paste a CANDIDATE config before it is ever seeded.
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
    fetchExamsForConfig,
    verifyExamConfig,
    verifyCandidateConfig,
    type ExamConfigSummary,
    type ConfigVerifyResult,
    type ConfigFinding,
    type ConfigOutcome,
} from '../services/superadminService';
import {
    ShieldCheck,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Info,
    FileJson,
    BookOpenCheck,
} from 'lucide-react';

function OutcomeBadge({ outcome, big }: { outcome: ConfigOutcome; big?: boolean }) {
    const size = big ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
    const map = {
        pass: { cls: 'text-brand-teal-600 bg-brand-teal-50 border-brand-teal-100', Icon: CheckCircle2, label: 'pass' },
        warn: { cls: 'text-amber-600 bg-amber-50 border-amber-200', Icon: AlertTriangle, label: 'warn' },
        fail: { cls: 'text-brand-warm-danger bg-red-50 border-red-200', Icon: XCircle, label: 'fail' },
    }[outcome];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border font-semibold ${size} ${map.cls}`}>
            <map.Icon className="w-3.5 h-3.5" /> {map.label}
        </span>
    );
}

function FindingRow({ f }: { f: ConfigFinding }) {
    const Icon = f.severity === 'fail' ? XCircle : f.severity === 'warn' ? AlertTriangle : Info;
    const color = f.severity === 'fail' ? 'text-brand-warm-danger' : f.severity === 'warn' ? 'text-amber-600' : 'text-brand-text-mute';
    return (
        <li className="flex items-start gap-2 text-sm">
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
            <span className="text-brand-text">
                {f.message}
                {f.path ? <span className="text-brand-text-mute"> ({f.path})</span> : null}
            </span>
        </li>
    );
}

export default function ConfigVerification() {
    const { toast } = useToast();
    const [collapsed, setCollapsed] = useState(false);

    const [exams, setExams] = useState<ExamConfigSummary[]>([]);
    // Persisted across refresh so a run isn't lost on F5.
    const [mode, setMode] = usePersistentState<'live' | 'paste'>('cv_mode', 'live');
    const [examId, setExamId] = usePersistentState('cv_examId', 'ielts');
    const [pasteText, setPasteText] = usePersistentState('cv_paste', '');
    const [result, setResult] = usePersistentState<ConfigVerifyResult | null>('cv_result', null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchExamsForConfig()
            .then((r) => setExams(r.data ?? []))
            .catch(() => { /* toasted by callBackend */ });
    }, []);

    async function run() {
        setLoading(true);
        try {
            if (mode === 'live') {
                if (!examId) { toast({ title: 'Pick an exam first', variant: 'destructive' }); return; }
                const r = await verifyExamConfig(examId);
                setResult(r.data);
            } else {
                let parsed: unknown;
                try {
                    parsed = JSON.parse(pasteText);
                } catch (e: any) {
                    toast({ title: 'That isn\'t valid JSON', description: e?.message ?? 'Check the config you pasted.', variant: 'destructive' });
                    return;
                }
                const r = await verifyCandidateConfig(parsed);
                setResult(r.data);
            }
        } catch {
            /* callBackend already toasts network/HTTP errors */
        } finally {
            setLoading(false);
        }
    }

    const interp = result?.layer2.interpretation ?? null;

    return (
        <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
            <div className="hidden lg:block">
                <SuperAdminSidebar activeTab="config-verification" isCollapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
            </div>
            <div className={`relative z-10 transition-all duration-300 flex flex-col min-h-screen ${collapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
                <SuperAdminTopbar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1400px] mx-auto space-y-6">
                        {/* Heading */}
                        <div className="flex items-start gap-3 rounded-xl border border-brand-teal-100 bg-brand-teal-50 p-4">
                            <ShieldCheck className="w-5 h-5 text-brand-teal-600 mt-0.5 shrink-0" />
                            <div>
                                <h1 className="font-semibold text-brand-text">Config Verification</h1>
                                <p className="text-sm text-brand-text-mute">
                                    Check a config <strong>structurally</strong> (will the engine run it?) and read back, in plain
                                    English, exactly what the platform understood from it — the same interpretation the app runs on.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
                            {/* Input */}
                            <section className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-4 h-fit">
                                <div className="inline-flex rounded-lg border border-brand-line p-0.5 bg-brand-bg">
                                    {(['live', 'paste'] as const).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${mode === m ? 'bg-brand-teal-600 text-white' : 'text-brand-text-mute hover:text-brand-text'}`}
                                        >
                                            {m === 'live' ? 'Live exam' : 'Paste candidate'}
                                        </button>
                                    ))}
                                </div>

                                {mode === 'live' ? (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute">Exam</label>
                                        <select
                                            value={examId}
                                            onChange={(e) => setExamId(e.target.value)}
                                            className="w-full rounded-lg border border-brand-line bg-brand-bg px-3 py-2 text-sm"
                                        >
                                            {exams.length === 0 && <option value="">Loading…</option>}
                                            {exams.map((e) => (
                                                <option key={e.exam_id} value={e.exam_id}>
                                                    {e.label} ({e.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute flex items-center gap-1.5">
                                            <FileJson className="w-3.5 h-3.5" /> Candidate config JSON
                                        </label>
                                        <textarea
                                            value={pasteText}
                                            onChange={(e) => setPasteText(e.target.value)}
                                            placeholder='A single exam config object, or { "exam": {…}, "scales": {…} }'
                                            spellCheck={false}
                                            className="w-full h-64 rounded-lg border border-brand-line bg-brand-bg px-3 py-2 font-jetbrains text-xs resize-y"
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={run}
                                    disabled={loading || (mode === 'live' && !examId) || (mode === 'paste' && !pasteText.trim())}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-teal-600 text-white text-sm font-semibold py-2.5 hover:bg-brand-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Verify config
                                </button>
                            </section>

                            {/* Results */}
                            <section className="space-y-5">
                                {!result && (
                                    <div className="rounded-xl border border-dashed border-brand-line p-10 text-center text-sm text-brand-text-mute">
                                        Pick a live exam or paste a candidate config, then <strong>Verify</strong>.
                                    </div>
                                )}

                                {result && (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <span className="font-jetbrains text-sm font-bold">{result.examId}</span>
                                            <OutcomeBadge outcome={result.outcome} big />
                                        </div>

                                        {/* Layer 1 — structural */}
                                        <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute">Layer 1 — structural (will the engine run it?)</p>
                                                <OutcomeBadge outcome={result.layer1.outcome} />
                                            </div>
                                            {result.layer1.findings.length === 0 ? (
                                                <p className="text-sm text-brand-teal-600">No structural issues — the engine can run this config.</p>
                                            ) : (
                                                <ul className="space-y-1.5">
                                                    {result.layer1.findings.map((f, i) => <FindingRow key={i} f={f} />)}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Layer 2 — interpretation */}
                                        <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute flex items-center gap-1.5">
                                                    <BookOpenCheck className="w-3.5 h-3.5" /> Layer 2 — what the platform understood
                                                </p>
                                                <OutcomeBadge outcome={result.layer2.outcome} />
                                            </div>

                                            {interp && (
                                                <div className="flex flex-wrap gap-2 text-[11px]">
                                                    <span className="rounded-md bg-brand-bg border border-brand-line px-2 py-0.5">{interp.status}</span>
                                                    <span className="rounded-md bg-brand-bg border border-brand-line px-2 py-0.5">scoring: {interp.scoring.model}</span>
                                                    <span className="rounded-md bg-brand-bg border border-brand-line px-2 py-0.5">{interp.assessedCount} assessed{interp.practiceCount ? ` · ${interp.practiceCount} practice` : ''}</span>
                                                </div>
                                            )}

                                            <div className="prose prose-sm max-w-none prose-headings:text-brand-text prose-headings:font-semibold prose-p:text-brand-text prose-li:text-brand-text prose-strong:text-brand-text rounded-lg bg-brand-bg border border-brand-line p-4">
                                                <ReactMarkdown>{result.layer2.plainEnglish || '_No interpretation available._'}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
