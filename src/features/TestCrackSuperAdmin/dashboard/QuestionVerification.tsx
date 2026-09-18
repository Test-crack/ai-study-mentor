// SuperAdmin — Question-Bank Verification panel.
// Front end for the CLI verification/import pipeline (see backend CLAUDE.md).
// Wired exam/bank-type combinations are decided server-side (SUPPORTED_FORKS).
import { useEffect, useRef, useState } from 'react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
    fetchVerificationCoverage,
    runLayer1Verification,
    startLayer2Verification,
    getLayer2JobStatus,
    planImportBatch,
    confirmImportBatch,
    tagBatchFiles,
    downloadLayer1Report,
    downloadLayer2Report,
    planDiagnosticImportBatch,
    confirmDiagnosticImportBatch,
    fetchDiagnosticBackups,
    restoreDiagnosticBackup,
    type CoverageEntry,
    type Layer1FileResult,
    type ImportPlanFile,
    type ImportConfirmFile,
    type DiagnosticImportPlanResult,
    type DiagnosticImportConfirmResult,
    type DiagnosticBackup,
} from '../services/superadminService';
import {
    ShieldCheck,
    Upload,
    FileJson,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Download,
    ChevronDown,
    XCircle,
    Lock,
    Unlock,
    X,
    RotateCcw,
} from 'lucide-react';

const EXAM_OPTIONS = [
    { id: 'ielts', label: 'IELTS Preparation' },
    { id: 'spoken_english', label: 'Spoken English' },
];
const BANK_TYPE_OPTIONS = [
    { id: 'drill', label: 'Drill' },
    { id: 'diagnostic', label: 'Diagnostic' },
    { id: 'ia', label: 'Internal Assessment' },
    { id: 'mock', label: 'Mock Test' },
];
// Spoken English only has Drill wired up — Diagnostic/IA would otherwise
// show as pickable and then fail with "no verification pipeline" on submit.
const BANK_TYPES_BY_EXAM: Record<string, typeof BANK_TYPE_OPTIONS> = {
    spoken_english: BANK_TYPE_OPTIONS.filter(b => b.id === 'drill'),
};

type Stage = 'idle' | 'layer1' | 'layer2' | 'plan' | 'confirm';

function outcomeBadge(outcome: 'pass' | 'warn' | 'fail') {
    if (outcome === 'pass') {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-teal-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> pass
            </span>
        );
    }
    if (outcome === 'warn') {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" /> warn
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-warm-danger">
            <XCircle className="w-3.5 h-3.5" /> fail
        </span>
    );
}

/**
 * Layer 2 (`judgeRun`) results are per-row and can run into the hundreds —
 * rendering that raw is what broke the layout. Reduce to one line per file
 * (counts by outcome) for the default view; the full payload is still
 * available behind "Show raw judge output".
 */
function layer2Summary(result: unknown): { fileName: string; summary: string }[] {
    const files = (result as { files?: unknown[] } | null)?.files;
    if (!Array.isArray(files)) return [];
    return files.map((f: any) => {
        if (f.skipReason) return { fileName: f.fileName, summary: `skipped — ${f.skipReason}` };
        const counts = f.counts as Record<string, number> | undefined;
        const parts = Object.entries(counts ?? {})
            .filter(([, n]) => n > 0)
            .map(([outcome, n]) => `${n} ${outcome.toLowerCase()}`);
        return { fileName: f.fileName, summary: parts.join(', ') || 'no rows judged' };
    });
}

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function QuestionVerification() {
    const { toast } = useToast();
    const [collapsed, setCollapsed] = useState(false);

    const [coverage, setCoverage] = useState<CoverageEntry[]>([]);
    const [examId, setExamId] = useState('ielts');
    const [bankType, setBankType] = useState('drill');

    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // String, not number — coercing on every keystroke means the field can
    // never be empty, so backspacing jumps straight to "1".
    const [expectedRowsInput, setExpectedRowsInput] = useState('200');
    const expectedRows = Math.max(1, Number(expectedRowsInput) || 1);

    // Separate from the batch above — Import needs the tagged CSVs, not the raw ones.
    const [importFiles, setImportFiles] = useState<File[]>([]);
    const importFileInputRef = useRef<HTMLInputElement>(null);

    const [stage, setStage] = useState<Stage>('idle');
    const [layer1Results, setLayer1Results] = useState<Layer1FileResult[] | null>(null);

    const [layer2JobId, setLayer2JobId] = useState<string | null>(null);
    const [layer2Status, setLayer2Status] = useState<'pending' | 'done' | 'error' | null>(null);
    const [layer2Result, setLayer2Result] = useState<unknown>(null);
    const [layer2Error, setLayer2Error] = useState<string | null>(null);
    const [layer2Reviewed, setLayer2Reviewed] = useState(false);

    const [importPlan, setImportPlan] = useState<ImportPlanFile[] | null>(null);
    const [importResult, setImportResult] = useState<ImportConfirmFile[] | null>(null);

    // Diagnostic-only: update-in-place, not upsert-by-source_key.
    const [diagnosticSetId, setDiagnosticSetId] = useState('');
    const [diagnosticSourceSetId, setDiagnosticSourceSetId] = useState('');
    const [diagnosticAudioUrlPrefix, setDiagnosticAudioUrlPrefix] = useState('/diagnostics/audio/');
    const [diagnosticPlan, setDiagnosticPlan] = useState<DiagnosticImportPlanResult | null>(null);
    const [diagnosticConfirmResult, setDiagnosticConfirmResult] = useState<DiagnosticImportConfirmResult | null>(null);

    // Diagnostic-only: rollback to a prior import/confirm backup.
    const [restoreSetId, setRestoreSetId] = useState('');
    const [backups, setBackups] = useState<DiagnosticBackup[] | null>(null);
    const [loadingBackups, setLoadingBackups] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
    const [restoring, setRestoring] = useState(false);

    const [showLayer2Raw, setShowLayer2Raw] = useState(false);
    const [taggingFile, setTaggingFile] = useState<string | null>(null);
    const [taggingAll, setTaggingAll] = useState(false);
    const [downloadingLayer1Report, setDownloadingLayer1Report] = useState(false);
    const [downloadingLayer2Report, setDownloadingLayer2Report] = useState(false);

    useEffect(() => {
        fetchVerificationCoverage()
            .then(r => setCoverage(r.data ?? []))
            .catch(() => {});
    }, []);

    // Poll the Layer 2 job while pending.
    useEffect(() => {
        if (!layer2JobId || layer2Status !== 'pending') return;
        const timer = setInterval(async () => {
            try {
                const r = await getLayer2JobStatus(layer2JobId);
                setLayer2Status(r.data.status);
                if (r.data.status === 'done') setLayer2Result(r.data.result);
                if (r.data.status === 'error') setLayer2Error(r.data.error);
            } catch {
                // transient poll failure — try again on the next tick
            }
        }, 3000);
        return () => clearInterval(timer);
    }, [layer2JobId, layer2Status]);

    const resetDownstream = () => {
        setLayer1Results(null);
        setLayer2JobId(null);
        setLayer2Status(null);
        setLayer2Result(null);
        setLayer2Error(null);
        setLayer2Reviewed(false);
        setImportPlan(null);
        setImportResult(null);
        setShowLayer2Raw(false);
        setDiagnosticPlan(null);
        setDiagnosticConfirmResult(null);
    };

    const onFilesChosen = (list: FileList | null) => {
        if (!list || list.length === 0) return;
        setFiles(Array.from(list));
        resetDownstream();
    };

    const removeFile = (name: string) => {
        setFiles(prev => prev.filter(f => f.name !== name));
        resetDownstream(); // old results no longer describe this batch
        // re-choosing the same file later needs the input cleared, or no change event fires
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const runVerification = async () => {
        if (files.length === 0) {
            toast({ title: 'Choose at least one file first', variant: 'destructive' });
            return;
        }
        resetDownstream();
        setStage('layer1');
        try {
            const r = await runLayer1Verification(examId, bankType, files, expectedRows);
            setLayer1Results(r.data);
            const anyFail = r.data.some(f => f.outcome === 'fail');
            if (anyFail) {
                toast({ title: 'Layer 1 failed', description: 'Fix the flagged files before continuing.', variant: 'destructive' });
                setStage('idle');
                return;
            }

            setStage('layer2');
            const started = await startLayer2Verification(examId, bankType, files);
            setLayer2JobId(started.data.jobId);
            setLayer2Status('pending');
        } catch (err: any) {
            toast({ title: 'Verification failed', description: err?.message, variant: 'destructive' });
        } finally {
            setStage('idle');
        }
    };

    const downloadTaggedCsv = async (fileName: string) => {
        const file = files.find(f => f.name === fileName);
        if (!file) return;
        setTaggingFile(fileName);
        try {
            const { blob, filename } = await tagBatchFiles(examId, bankType, [file], expectedRows);
            saveBlob(blob, filename);
        } catch (err: any) {
            toast({ title: 'Tagging failed', description: err?.message, variant: 'destructive' });
        } finally {
            setTaggingFile(null);
        }
    };

    const downloadTaggedCsvAll = async () => {
        setTaggingAll(true);
        try {
            const { blob, filename } = await tagBatchFiles(examId, bankType, files, expectedRows);
            saveBlob(blob, filename);
        } catch (err: any) {
            toast({ title: 'Tagging failed', description: err?.message, variant: 'destructive' });
        } finally {
            setTaggingAll(false);
        }
    };

    const downloadLayer1ReportFile = async () => {
        setDownloadingLayer1Report(true);
        try {
            const { blob, filename } = await downloadLayer1Report(examId, bankType, files, expectedRows);
            saveBlob(blob, filename);
        } catch (err: any) {
            toast({ title: 'Report failed', description: err?.message, variant: 'destructive' });
        } finally {
            setDownloadingLayer1Report(false);
        }
    };

    const downloadLayer2ReportFile = async () => {
        if (!layer2JobId) return;
        setDownloadingLayer2Report(true);
        try {
            const { blob, filename } = await downloadLayer2Report(layer2JobId);
            saveBlob(blob, filename);
        } catch (err: any) {
            toast({ title: 'Report failed', description: err?.message, variant: 'destructive' });
        } finally {
            setDownloadingLayer2Report(false);
        }
    };

    const onImportFilesChosen = (list: FileList | null) => {
        if (!list || list.length === 0) return;
        setImportFiles(Array.from(list));
        setImportPlan(null);
        setImportResult(null);
    };

    const removeImportFile = (name: string) => {
        setImportFiles(prev => prev.filter(f => f.name !== name));
        setImportPlan(null);
        setImportResult(null);
        if (importFileInputRef.current) importFileInputRef.current.value = '';
    };

    const runPlan = async () => {
        setStage('plan');
        try {
            const r = await planImportBatch(examId, bankType, importFiles, expectedRows);
            setImportPlan(r.data);
        } catch (err: any) {
            toast({ title: 'Import plan failed', description: err?.message, variant: 'destructive' });
        } finally {
            setStage('idle');
        }
    };

    const runConfirm = async () => {
        setStage('confirm');
        try {
            const r = await confirmImportBatch(examId, bankType, importFiles, layer2Reviewed, expectedRows);
            setImportResult(r.data);
            const totalWritten = r.data.reduce((n, f) => n + f.inserted + f.updated, 0);
            toast({
                title: totalWritten === 0 ? 'Nothing to write — database already matches' : 'Import complete',
                description: `${r.data.reduce((n, f) => n + f.inserted, 0)} inserted, ${r.data.reduce((n, f) => n + f.updated, 0)} updated.`,
            });
        } catch (err: any) {
            toast({ title: 'Import failed', description: err?.message, variant: 'destructive' });
        } finally {
            setStage('idle');
        }
    };

    const runDiagnosticPlan = async () => {
        if (importFiles.length === 0 || !diagnosticSetId.trim()) return;
        setStage('plan');
        try {
            const r = await planDiagnosticImportBatch(importFiles[0], diagnosticSetId.trim(), diagnosticSourceSetId.trim() || undefined, diagnosticAudioUrlPrefix);
            setDiagnosticPlan(r.data);
        } catch (err: any) {
            toast({ title: 'Import plan failed', description: err?.message, variant: 'destructive' });
        } finally {
            setStage('idle');
        }
    };

    const runDiagnosticConfirm = async () => {
        if (importFiles.length === 0 || !diagnosticSetId.trim()) return;
        setStage('confirm');
        try {
            const r = await confirmDiagnosticImportBatch(
                importFiles[0],
                diagnosticSetId.trim(),
                diagnosticSourceSetId.trim() || undefined,
                diagnosticAudioUrlPrefix,
                layer2Reviewed,
            );
            setDiagnosticConfirmResult(r.data);
            toast({ title: 'Import complete', description: `${r.data.updated} row(s) updated in "${r.data.setId}". Backup: ${r.data.backupFile}` });
        } catch (err: any) {
            toast({ title: 'Import failed', description: err?.message, variant: 'destructive' });
        } finally {
            setStage('idle');
        }
    };

    const loadBackups = async () => {
        if (!restoreSetId.trim()) return;
        setLoadingBackups(true);
        setSelectedBackup(null);
        try {
            const r = await fetchDiagnosticBackups(restoreSetId.trim());
            setBackups(r.data);
        } catch (err: any) {
            toast({ title: 'Failed to list backups', description: err?.message, variant: 'destructive' });
        } finally {
            setLoadingBackups(false);
        }
    };

    const runRestore = async () => {
        if (!selectedBackup) return;
        setRestoring(true);
        try {
            const r = await restoreDiagnosticBackup(selectedBackup, true);
            toast({ title: 'Restore complete', description: `${r.data.rowCount} row(s) restored in "${r.data.setId}".` });
            loadBackups();
        } catch (err: any) {
            toast({ title: 'Restore failed', description: err?.message, variant: 'destructive' });
        } finally {
            setRestoring(false);
        }
    };

    const isDiagnostic = bankType === 'diagnostic';
    const layer1Clean = layer1Results !== null && layer1Results.every(f => f.outcome !== 'fail');
    const planPending = importPlan?.some(f => f.toInsert + f.toUpdate > 0) ?? false;

    return (
        <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
            <div className="hidden lg:block">
                <SuperAdminSidebar activeTab="question-verification" isCollapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
            </div>
            <div className={`relative z-10 transition-all duration-300 flex flex-col min-h-screen ${collapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
                <SuperAdminTopbar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1400px] mx-auto space-y-6">
                        <div>
                            <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Question bank quality gate</p>
                            <h1 className="font-manrope text-2xl font-black tracking-tight">Batch Verification &amp; Quality Inspection</h1>
                            <p className="text-sm text-brand-text-mute mt-1">
                                Catch structural defects first, then independently audit answer keys and difficulty before any database import.
                            </p>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-brand-teal-100 bg-brand-teal-50 p-4">
                            <ShieldCheck className="w-5 h-5 text-brand-teal-600 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-brand-text">
                                Import remains locked until both layers pass cleanly. Only <b>IELTS / Drill</b> and <b>IELTS / Diagnostic</b> are
                                wired up here today — the pipeline is deliberately forked per exam/bank-type, the same way the CLI tooling is.
                                Diagnostic has no tagging step and updates an existing set in place rather than inserting.
                            </p>
                        </div>

                        {/* Coverage cards */}
                        <section className="rounded-xl border border-brand-line bg-brand-bg-alt p-4">
                            <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-3">
                                Exam content coverage
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {coverage.map(c => (
                                    <div key={`${c.examId}-${c.bankType}`} className="rounded-lg border border-brand-line p-3">
                                        <p className="font-semibold text-sm">{c.label}</p>
                                        <p className="text-[11px] text-brand-text-mute uppercase tracking-wide mb-2">
                                            {c.bankType}{c.setCount !== undefined ? ` · ${c.setCount} sets` : ''}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {c.skills.map(s => (
                                                <span key={s.skill} className="px-2 py-0.5 rounded-md bg-brand-bg text-[11px] font-medium border border-brand-line">
                                                    {s.skill.toLowerCase()}: {s.count}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {coverage.length === 0 && <p className="text-sm text-brand-text-mute">No coverage data yet.</p>}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
                            {/* Batch input */}
                            <section className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Batch input</p>
                                    {files.length > 0 && <span className="text-xs text-brand-text-mute">{files.length} file(s) selected</span>}
                                </div>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-line py-8 text-brand-text-mute hover:border-brand-teal-400 hover:text-brand-teal-600 transition-colors"
                                >
                                    <Upload className="w-5 h-5" />
                                    <span className="text-sm font-medium">Choose CSV files</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    multiple
                                    className="hidden"
                                    onChange={e => onFilesChosen(e.target.files)}
                                />

                                {files.length > 0 && (
                                    <ul className="space-y-1">
                                        {files.map(f => (
                                            <li key={f.name} className="flex items-center gap-2 text-xs text-brand-text group">
                                                <FileJson className="w-3.5 h-3.5 text-brand-text-mute shrink-0" />
                                                <span className="truncate flex-1">{f.name}</span>
                                                <button
                                                    onClick={() => removeFile(f.name)}
                                                    title="Remove this file"
                                                    className="shrink-0 text-brand-text-mute hover:text-brand-warm-danger opacity-60 hover:opacity-100"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <button
                                    onClick={runVerification}
                                    disabled={files.length === 0 || stage !== 'idle'}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-teal-600 text-white text-sm font-semibold py-2.5 hover:bg-brand-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {stage === 'layer1' || stage === 'layer2' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Run two-layer verification
                                </button>

                                {/* Layer 1 results */}
                                {layer1Results && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute">Layer 1 — structural</p>
                                            <div className="flex items-center gap-3">
                                                {!isDiagnostic && layer1Clean && files.length > 1 && (
                                                    <button
                                                        onClick={downloadTaggedCsvAll}
                                                        disabled={taggingAll}
                                                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-teal-600 hover:text-brand-teal-700 disabled:opacity-50"
                                                    >
                                                        {taggingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                        Tagged CSV (all {files.length} files)
                                                    </button>
                                                )}
                                                <button
                                                    onClick={downloadLayer1ReportFile}
                                                    disabled={downloadingLayer1Report}
                                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-teal-600 hover:text-brand-teal-700 disabled:opacity-50"
                                                >
                                                    {downloadingLayer1Report ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                    Download report (.xlsx)
                                                </button>
                                            </div>
                                        </div>
                                        {layer1Results.map(f => (
                                            <div key={f.fileName} className="rounded-lg border border-brand-line p-2.5 space-y-1.5 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-medium truncate">{f.fileName}</span>
                                                    {outcomeBadge(f.outcome)}
                                                </div>
                                                {f.findings.slice(0, 5).map((finding, i) => (
                                                    <p key={i} className="text-[11px] text-brand-text-mute break-words">
                                                        [{finding.severity}] {finding.message}
                                                    </p>
                                                ))}
                                                {!isDiagnostic && f.outcome !== 'fail' && (
                                                    <button
                                                        onClick={() => downloadTaggedCsv(f.fileName)}
                                                        disabled={taggingFile === f.fileName}
                                                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-teal-600 hover:text-brand-teal-700 disabled:opacity-50"
                                                    >
                                                        {taggingFile === f.fileName ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Download className="w-3 h-3" />
                                                        )}
                                                        Download tagged CSV
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Layer 2 job status */}
                                {layer2JobId && (
                                    <div className="space-y-2 min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute">Layer 2 — content judge</p>
                                        <div className="rounded-lg border border-brand-line p-2.5 min-w-0">
                                            {layer2Status === 'pending' && (
                                                <span className="inline-flex items-center gap-2 text-xs text-brand-text-mute">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Judging answers — this calls an LLM and can take a while…
                                                </span>
                                            )}
                                            {layer2Status === 'error' && (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-brand-warm-danger font-medium break-words">
                                                    <XCircle className="w-3.5 h-3.5 shrink-0" /> {layer2Error}
                                                </span>
                                            )}
                                            {layer2Status === 'done' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-brand-teal-600 font-medium">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Judge run complete — review before confirming an import.
                                                        </span>
                                                        <button
                                                            onClick={downloadLayer2ReportFile}
                                                            disabled={downloadingLayer2Report}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-teal-600 hover:text-brand-teal-700 disabled:opacity-50 shrink-0"
                                                        >
                                                            {downloadingLayer2Report ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                            Download report (.xlsx)
                                                        </button>
                                                    </div>
                                                    {layer2Summary(layer2Result).map(f => (
                                                        <div key={f.fileName} className="text-[11px] rounded-md bg-brand-bg p-2">
                                                            <p className="font-medium truncate">{f.fileName}</p>
                                                            <p className="text-brand-text-mute">{f.summary}</p>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => setShowLayer2Raw(v => !v)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-text-mute hover:text-brand-text"
                                                    >
                                                        <ChevronDown className={`w-3 h-3 transition-transform ${showLayer2Raw ? 'rotate-180' : ''}`} />
                                                        {showLayer2Raw ? 'Hide' : 'Show'} raw judge output
                                                    </button>
                                                    {showLayer2Raw && (
                                                        <pre className="text-[10px] leading-relaxed text-brand-text-mute overflow-auto max-h-64 max-w-full font-mono whitespace-pre-wrap break-words">
                                                            {JSON.stringify(layer2Result, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Verification target + import gate */}
                            <section className="space-y-4">
                                <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-3">
                                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Verification target</p>
                                    <div>
                                        <label className="text-[11px] text-brand-text-mute">Active exam</label>
                                        <select
                                            value={examId}
                                            onChange={e => {
                                                const next = e.target.value;
                                                setExamId(next);
                                                // avoid landing on Diagnostic/IA, which aren't wired up for it
                                                if (next === 'spoken_english' && bankType !== 'drill') setBankType('drill');
                                                resetDownstream();
                                            }}
                                            className="w-full mt-1 rounded-lg border border-brand-line bg-brand-bg px-3 py-2 text-sm"
                                        >
                                            {EXAM_OPTIONS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-brand-text-mute">Bank type</label>
                                        <select
                                            value={bankType}
                                            onChange={e => {
                                                const next = e.target.value;
                                                setBankType(next);
                                                // nudge the default row count — Drill is 200, IA is ~10-13
                                                if (next === 'ia' && expectedRowsInput === '200') setExpectedRowsInput('10');
                                                if (next === 'drill' && expectedRowsInput === '10') setExpectedRowsInput('200');
                                                resetDownstream();
                                            }}
                                            className="w-full mt-1 rounded-lg border border-brand-line bg-brand-bg px-3 py-2 text-sm"
                                        >
                                            {(BANK_TYPES_BY_EXAM[examId] ?? BANK_TYPE_OPTIONS).map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                                        </select>
                                    </div>
                                    {!isDiagnostic && (
                                        <div>
                                            <label className="text-[11px] text-brand-text-mute">
                                                Expected rows per file (Drills buckets are 200; IA buckets are typically 10-13 — check the batch before running)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={expectedRowsInput}
                                                onChange={e => { setExpectedRowsInput(e.target.value); resetDownstream(); }}
                                                className="w-full mt-1 rounded-lg border border-brand-line bg-brand-bg px-3 py-2 text-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-3">
                                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Import gate</p>
                                    <p className="text-[12px] text-brand-text-mute">
                                        {isDiagnostic
                                            ? 'Upload the verified staging CSV. This UPDATES an existing set_id in place, row by row by sequence — it never creates a new set. A backup is taken automatically before writing.'
                                            : <>Upload the <b>tagged</b> CSV(s) — downloaded above — not the raw batch. Import reruns the Layer 1 gate server-side; a previous result is never trusted as authorization to write.</>}
                                    </p>

                                    {isDiagnostic && (
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-[11px] text-brand-text-mute">Set ID (existing, required)</label>
                                                <input
                                                    value={diagnosticSetId}
                                                    onChange={e => { setDiagnosticSetId(e.target.value); setDiagnosticPlan(null); setDiagnosticConfirmResult(null); }}
                                                    placeholder="e.g. RD_B_01"
                                                    className="w-full mt-1 rounded-lg border border-brand-line bg-brand-bg px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-brand-text-mute">Source set ID (optional — when the file bundles more than one set)</label>
                                                <input
                                                    value={diagnosticSourceSetId}
                                                    onChange={e => { setDiagnosticSourceSetId(e.target.value); setDiagnosticPlan(null); setDiagnosticConfirmResult(null); }}
                                                    placeholder="e.g. RD_BATCH1_01"
                                                    className="w-full mt-1 rounded-lg border border-brand-line bg-brand-bg px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] text-brand-text-mute">Audio URL prefix</label>
                                                <input
                                                    value={diagnosticAudioUrlPrefix}
                                                    onChange={e => setDiagnosticAudioUrlPrefix(e.target.value)}
                                                    className="w-full mt-1 rounded-lg border border-brand-line bg-brand-bg px-3 py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => importFileInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-line py-4 text-brand-text-mute hover:border-brand-teal-400 hover:text-brand-teal-600 transition-colors text-xs font-medium"
                                    >
                                        <Upload className="w-4 h-4" />
                                        {isDiagnostic ? 'Choose staging CSV' : 'Choose tagged CSV file(s)'}
                                    </button>
                                    <input
                                        ref={importFileInputRef}
                                        type="file"
                                        accept=".csv"
                                        multiple={!isDiagnostic}
                                        className="hidden"
                                        onChange={e => onImportFilesChosen(e.target.files)}
                                    />

                                    {importFiles.length > 0 && (
                                        <ul className="space-y-1">
                                            {importFiles.map(f => (
                                                <li key={f.name} className="flex items-center gap-2 text-[11px] text-brand-text">
                                                    <FileJson className="w-3.5 h-3.5 text-brand-text-mute shrink-0" />
                                                    <span className="truncate flex-1">{f.name}</span>
                                                    <button
                                                        onClick={() => removeImportFile(f.name)}
                                                        title="Remove this file"
                                                        className="shrink-0 text-brand-text-mute hover:text-brand-warm-danger opacity-60 hover:opacity-100"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <button
                                        onClick={isDiagnostic ? runDiagnosticPlan : runPlan}
                                        disabled={importFiles.length === 0 || stage !== 'idle' || (isDiagnostic && !diagnosticSetId.trim())}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-brand-line text-sm font-semibold py-2 hover:border-brand-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {stage === 'plan' && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Dry run (plan import)
                                    </button>

                                    {!isDiagnostic && importPlan && (
                                        <div className="space-y-1.5">
                                            {importPlan.map(f => (
                                                <div key={f.fileName} className="text-[11px] rounded-lg border border-brand-line p-2">
                                                    <p className="font-medium truncate">{f.fileName}</p>
                                                    {f.gateBlocked ? (
                                                        <p className="text-brand-warm-danger">{f.gateBlocked}</p>
                                                    ) : (
                                                        <p className="text-brand-text-mute">
                                                            {f.toInsert} to insert · {f.toUpdate} to update · {f.unchanged} unchanged
                                                            {f.errors.length > 0 ? ` · ${f.errors.length} error(s)` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {isDiagnostic && diagnosticPlan && (
                                        <div className="space-y-1.5">
                                            {diagnosticPlan.gateBlocked ? (
                                                <p className="text-[11px] text-brand-warm-danger rounded-lg border border-brand-line p-2">{diagnosticPlan.gateBlocked}</p>
                                            ) : (
                                                <>
                                                    <p className="text-[11px] text-brand-text-mute">{diagnosticPlan.updates.length} row(s) to update in "{diagnosticPlan.setId}":</p>
                                                    {diagnosticPlan.updates.map(u => (
                                                        <div key={u.sequence} className="text-[11px] rounded-lg border border-brand-line p-2 space-y-0.5">
                                                            <p className="font-medium">seq {u.sequence}: {u.before.question_type} → {u.after.question_type}</p>
                                                            <p className="text-brand-text-mute truncate">old: {u.before.prompt_text}</p>
                                                            <p className="text-brand-text-mute truncate">new: {u.after.prompt_text}</p>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <label className="flex items-start gap-2 text-[12px] text-brand-text cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={layer2Reviewed}
                                            onChange={e => setLayer2Reviewed(e.target.checked)}
                                            disabled={layer2Status !== 'done'}
                                            className="mt-0.5"
                                        />
                                        I have reviewed the Layer 2 report for these files. Layer 2 cannot be cheaply re-run.
                                    </label>

                                    <button
                                        onClick={isDiagnostic ? runDiagnosticConfirm : runConfirm}
                                        disabled={
                                            !layer2Reviewed ||
                                            stage !== 'idle' ||
                                            (isDiagnostic ? !diagnosticPlan || diagnosticPlan.updates.length === 0 : !importPlan || !planPending)
                                        }
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-ink text-brand-bg text-sm font-semibold py-2.5 hover:bg-brand-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {stage === 'confirm' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : layer2Reviewed ? (
                                            <Unlock className="w-4 h-4" />
                                        ) : (
                                            <Lock className="w-4 h-4" />
                                        )}
                                        {layer2Reviewed ? 'Confirm import (writes to DB)' : 'Import locked'}
                                    </button>

                                    {!isDiagnostic && importResult && (
                                        <div className="space-y-1.5">
                                            {importResult.map(f => (
                                                <div key={f.fileName} className="text-[11px] rounded-lg border border-brand-line p-2">
                                                    <p className="font-medium truncate">{f.fileName}</p>
                                                    {f.gateBlocked ? (
                                                        <p className="text-brand-warm-danger">{f.gateBlocked}</p>
                                                    ) : (
                                                        <p className="text-brand-text-mute">
                                                            {f.inserted} inserted · {f.updated} updated · {f.unchanged} unchanged
                                                            {f.failed > 0 ? ` · ${f.failed} failed` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {isDiagnostic && diagnosticConfirmResult && (
                                        <div className="text-[11px] rounded-lg border border-brand-line p-2">
                                            <p className="text-brand-text-mute">
                                                {diagnosticConfirmResult.updated} row(s) updated in "{diagnosticConfirmResult.setId}".
                                                Backup: {diagnosticConfirmResult.backupFile}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Restore — diagnostic only, deliberately separate from the flow above */}
                                {isDiagnostic && (
                                    <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-3">
                                        <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute flex items-center gap-1.5">
                                            <RotateCcw className="w-3.5 h-3.5" /> Restore (rollback)
                                        </p>
                                        <p className="text-[12px] text-brand-text-mute">
                                            Undo a previous import/confirm using the automatic backup it left behind.
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                value={restoreSetId}
                                                onChange={e => setRestoreSetId(e.target.value)}
                                                placeholder="Set ID, e.g. RD_B_01"
                                                className="flex-1 rounded-lg border border-brand-line bg-brand-bg px-3 py-2 text-sm"
                                            />
                                            <button
                                                onClick={loadBackups}
                                                disabled={!restoreSetId.trim() || loadingBackups}
                                                className="shrink-0 px-3 rounded-lg border border-brand-line text-xs font-semibold hover:border-brand-teal-400 disabled:opacity-50"
                                            >
                                                {loadingBackups ? <Loader2 className="w-4 h-4 animate-spin" /> : 'List backups'}
                                            </button>
                                        </div>

                                        {backups && (
                                            <div className="space-y-1.5">
                                                {backups.length === 0 && <p className="text-[11px] text-brand-text-mute">No backups found for this set.</p>}
                                                {backups.map(b => (
                                                    <label
                                                        key={b.fileName}
                                                        className={`flex items-center gap-2 text-[11px] rounded-lg border p-2 cursor-pointer ${selectedBackup === b.fileName ? 'border-brand-teal-400 bg-brand-teal-50' : 'border-brand-line'}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="backup"
                                                            checked={selectedBackup === b.fileName}
                                                            onChange={() => setSelectedBackup(b.fileName)}
                                                        />
                                                        <span className="flex-1 truncate">{b.fileName}</span>
                                                        <span className="text-brand-text-mute shrink-0">{b.rowCount} rows · {new Date(b.modifiedAt).toLocaleString()}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={runRestore}
                                            disabled={!selectedBackup || restoring}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-warm-danger text-white text-sm font-semibold py-2.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                            Restore from backup (writes to DB)
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
