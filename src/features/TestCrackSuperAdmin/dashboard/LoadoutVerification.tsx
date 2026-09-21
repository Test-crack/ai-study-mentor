// Panel for the loadout engine — a Layer 1 an admin can define themselves.
//
// The point of this page: adding a new exam should not require a developer. An
// admin describes the columns their CSV has and what's allowed in each, saves
// it, and Layer 1 runs on those rules immediately.
//
// The four IELTS loadouts are shown but not editable. They reproduce the
// hand-written pipelines exactly and the parity suite depends on them, so
// letting a browser edit them would break the thing that proves the engine
// works. Duplicate one to start from it instead.

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
    fetchLoadouts,
    fetchLoadoutDetail,
    verifyWithLoadout,
    previewLoadoutDraft,
    createLoadout,
    updateLoadout,
    deleteLoadout,
    downloadLoadoutReport,
    type LoadoutSummaryRow,
    type LoadoutDetail,
    type LoadoutVerifyResult,
    type LoadoutFinding,
    type LoadoutDraft,
    type DraftColumn,
    type DraftColumnKind,
} from '../services/superadminService';
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    Download,
    FileUp,
    Loader2,
    Pencil,
    Play,
    Plus,
    Save,
    ShieldCheck,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';

const KIND_LABEL: Record<DraftColumnKind, string> = {
    text: 'Free text',
    choice: 'One of a list',
    number: 'Whole number',
    options: 'Answer options (A/B/C/D)',
    answer: 'Correct answer',
};

const KIND_HELP: Record<DraftColumnKind, string> = {
    text: 'Any text. Tick Required if it must not be blank.',
    choice: 'The cell must be one of the values you list.',
    number: 'A whole number, optionally within a range.',
    options: 'Multiple-choice options as JSON. Checked for all four keys, no blanks, no repeats.',
    answer: 'The correct answer. Must be one of the values you list.',
};

const outcomeStyles: Record<string, string> = {
    pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    fail: 'bg-rose-50 text-rose-700 border-rose-200',
};

function OutcomePill({ outcome }: { outcome: string }) {
    const icon =
        outcome === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5" />
        : outcome === 'warn' ? <AlertTriangle className="w-3.5 h-3.5" />
        : <XCircle className="w-3.5 h-3.5" />;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${outcomeStyles[outcome] ?? outcomeStyles.fail}`}>
            {icon}
            {outcome}
        </span>
    );
}

function FindingRow({ finding }: { finding: LoadoutFinding }) {
    const isWarn = finding.severity === 'warn';
    return (
        <div className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 ${isWarn ? 'bg-amber-50/40' : 'bg-white'}`}>
            <span className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold ${isWarn ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                {isWarn ? '!' : '✕'}
            </span>
            <div className="min-w-0 flex-1">
                <div className="font-mono text-xs font-semibold text-slate-800">{finding.code}</div>
                <div className="text-sm text-slate-600 mt-0.5 break-words">{finding.message}</div>
            </div>
            <div className="shrink-0 font-mono text-[11px] text-slate-400 text-right leading-5">
                {finding.line !== undefined && <div>line {finding.line}</div>}
                {finding.column && <div>{finding.column}</div>}
            </div>
        </div>
    );
}

const emptyDraft = (): LoadoutDraft => ({
    id: '',
    label: '',
    expectedRows: 10,
    columns: [{ name: 'skill', kind: 'choice', required: true, values: ['LISTENING', 'READING'] }],
    bucketColumns: [],
    checkFilename: false,
    keyPrefix: '',
    keyColumns: [],
});

export default function LoadoutVerification() {
    const { toast } = useToast();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [loadouts, setLoadouts] = useState<LoadoutSummaryRow[]>([]); // re-fetched on mount
    // Persisted across refresh (sessionStorage) so an in-progress draft / verify result survives F5.
    const [selectedId, setSelectedId] = usePersistentState<string>('lv_selectedId', '');
    const [detail, setDetail] = usePersistentState<LoadoutDetail | null>('lv_detail', null);
    const [editable, setEditable] = usePersistentState('lv_editable', false);
    const [savedDraft, setSavedDraft] = usePersistentState<LoadoutDraft | null>('lv_savedDraft', null);

    const [draft, setDraft] = usePersistentState<LoadoutDraft | null>('lv_draft', null);
    const [draftIsNew, setDraftIsNew] = usePersistentState('lv_draftIsNew', false);
    // Raw text for the allowed-values inputs. Parsing straight into the draft on
    // every keystroke swallowed the comma the moment it was typed.
    const [valuesText, setValuesText] = usePersistentState<Record<number, string>>('lv_valuesText', {});
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [files, setFiles] = useState<File[]>([]); // File handles can't persist — re-select to re-run
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [expected, setExpected] = usePersistentState<string>('lv_expected', '');
    const [running, setRunning] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [result, setResult] = usePersistentState<LoadoutVerifyResult | null>('lv_result', null);

    const refreshList = useCallback(async (selectAfter?: string) => {
        const r = await fetchLoadouts();
        setLoadouts(r.loadouts);
        if (selectAfter) setSelectedId(selectAfter);
        else if (!selectedId && r.loadouts.length > 0) setSelectedId(r.loadouts[0].id);
    }, [selectedId]);

    useEffect(() => {
        void refreshList().catch((err: any) =>
            toast({ title: 'Could not load loadouts', description: err?.message, variant: 'destructive' }),
        );
        // Only on mount — refreshList is re-created per render by design.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedId || draft) return;
        void (async () => {
            try {
                const r = await fetchLoadoutDetail(selectedId);
                setDetail(r.summary);
                setEditable(Boolean((r as any).editable));
                setSavedDraft(((r as any).draft as LoadoutDraft) ?? null);
            } catch (err: any) {
                toast({ title: 'Could not read loadout', description: err?.message, variant: 'destructive' });
            }
        })();
    }, [selectedId, draft, toast]);

    // Validate as the admin types, so a broken rule is visible immediately
    // rather than at save time.
    useEffect(() => {
        if (!draft) {
            setPreviewError(null);
            return;
        }
        const t = setTimeout(() => {
            void previewLoadoutDraft({ ...draft, id: draft.id || 'preview' })
                .then(r => setPreviewError(r.ok ? null : r.message ?? 'Not valid yet.'))
                .catch(() => setPreviewError(null));
        }, 350);
        return () => clearTimeout(t);
    }, [draft]);

    const patch = (changes: Partial<LoadoutDraft>) => setDraft(d => (d ? { ...d, ...changes } : d));
    const patchColumn = (i: number, changes: Partial<DraftColumn>) =>
        setDraft(d => {
            if (!d) return d;
            const columns = d.columns.map((c, idx) => (idx === i ? { ...c, ...changes } : c));
            return { ...d, columns };
        });

    const moveColumn = (i: number, delta: number) =>
        setDraft(d => {
            if (!d) return d;
            const j = i + delta;
            if (j < 0 || j >= d.columns.length) return d;
            const columns = [...d.columns];
            [columns[i], columns[j]] = [columns[j], columns[i]];
            return { ...d, columns };
        });

    const startNew = () => {
        setDraft(emptyDraft());
        setDraftIsNew(true);
        setValuesText({});
        setResult(null);
    };

    const startEdit = () => {
        if (!savedDraft) return;
        setDraft(savedDraft);
        setDraftIsNew(false);
        setValuesText({});
        setResult(null);
    };

    const cancelEdit = () => {
        setDraft(null);
        setDraftIsNew(false);
        setValuesText({});
        setPreviewError(null);
    };

    const save = async () => {
        if (!draft) return;
        setSaving(true);
        try {
            const r = draftIsNew ? await createLoadout(draft) : await updateLoadout(draft.id, draft);
            toast({ title: draftIsNew ? 'Loadout created' : 'Loadout saved', description: r.id });
            setDraft(null);
            setDraftIsNew(false);
            await refreshList(r.id);
        } catch (err: any) {
            toast({ title: 'Could not save', description: err?.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!selectedId || !editable) return;
        if (!window.confirm(`Delete "${selectedId}"? This cannot be undone.`)) return;
        try {
            await deleteLoadout(selectedId);
            toast({ title: 'Loadout deleted', description: selectedId });
            setSelectedId('');
            setDetail(null);
            await refreshList();
        } catch (err: any) {
            toast({ title: 'Could not delete', description: err?.message, variant: 'destructive' });
        }
    };

    const run = async () => {
        if (files.length === 0 || !selectedId) return;
        setRunning(true);
        setResult(null);
        try {
            const parsed = Number(expected);
            const r = await verifyWithLoadout(selectedId, files, Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
            setResult(r);
        } catch (err: any) {
            toast({ title: 'Verification failed', description: err?.message, variant: 'destructive' });
        } finally {
            setRunning(false);
        }
    };

    const downloadReport = async () => {
        if (files.length === 0 || !selectedId) return;
        setDownloading(true);
        try {
            const parsed = Number(expected);
            const { blob, filename } = await downloadLoadoutReport(
                selectedId,
                files,
                Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            toast({ title: 'Could not build the report', description: err?.message, variant: 'destructive' });
        } finally {
            setDownloading(false);
        }
    };

    const totalFindings =
        (result?.runFindings.length ?? 0) +
        (result?.files.reduce((n, f) => n + f.fileFindings.length + f.rowFindings.length, 0) ?? 0);

    const choiceColumns = (draft?.columns ?? []).filter(c => c.kind === 'choice');

    return (
        <div className="min-h-screen bg-slate-50">
            <SuperAdminSidebar activeTab="loadout-verification" isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(v => !v)} />
            <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
                <SuperAdminTopbar />

                <main className="p-6 lg:p-8 max-w-[1500px] mx-auto">
                    <header className="mb-8">
                        <div className="flex items-center gap-2.5 mb-2">
                            <ShieldCheck className="w-5 h-5 text-teal-600" />
                            <h1 className="text-2xl font-bold text-slate-900">Loadout Engine</h1>
                            <span className="font-mono text-[10px] font-bold tracking-wide px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                LAYER 1
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 max-w-3xl">
                            Define what a new exam's CSV should look like — the columns, what's allowed in each,
                            what's required — then run files against those rules. No backend code needed.
                            Nothing here writes to the question database.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 items-start">
                        {/* Loadout list */}
                        <aside className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-mono text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                                    Loadouts
                                </span>
                                <button
                                    onClick={startNew}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-700"
                                >
                                    <Plus className="w-3 h-3" /> New
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                {loadouts.map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => {
                                            setSelectedId(l.id);
                                            setDraft(null);
                                            setResult(null);
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                                            selectedId === l.id && !draft
                                                ? 'bg-teal-50 border-teal-200'
                                                : 'bg-white border-transparent hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold ${selectedId === l.id && !draft ? 'text-teal-800' : 'text-slate-800'}`}>
                                                {l.label}
                                            </span>
                                            {l.editable && (
                                                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                                    YOURS
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                                            {l.valid ? `${l.columnCount} columns` : 'invalid'}
                                            {l.valid && !l.editable && ' · built-in'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <section className="space-y-5 min-w-0">
                            {/* ---------------- BUILDER ---------------- */}
                            {draft && (
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                                        <Pencil className="w-4 h-4 text-teal-600" />
                                        <span className="font-semibold text-slate-800">
                                            {draftIsNew ? 'New loadout' : `Editing ${draft.label || draft.id}`}
                                        </span>
                                        <div className="ml-auto flex items-center gap-2">
                                            <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100">
                                                Cancel
                                            </button>
                                            <button
                                                onClick={save}
                                                disabled={saving || Boolean(previewError)}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-40"
                                            >
                                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-6">
                                        {previewError && (
                                            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                                {previewError}
                                            </div>
                                        )}

                                        {/* Identity */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Name</label>
                                                <input
                                                    value={draft.label}
                                                    onChange={e => patch({ label: e.target.value })}
                                                    placeholder="OET · Listening"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                                    Id <span className="text-slate-400 font-normal">(lowercase, hyphens)</span>
                                                </label>
                                                <input
                                                    value={draft.id}
                                                    disabled={!draftIsNew}
                                                    onChange={e => patch({ id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                                    placeholder="oet-listening"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Rows per file</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={draft.expectedRows}
                                                    onChange={e => patch({ expectedRows: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                                />
                                            </div>
                                        </div>

                                        {/* Columns */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-mono text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                                                    Columns — in the order they appear in the CSV
                                                </span>
                                                <button
                                                    onClick={() => patch({ columns: [...draft.columns, { name: '', kind: 'text' }] })}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                                                >
                                                    <Plus className="w-3 h-3" /> Add column
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {draft.columns.map((col, i) => (
                                                    <div key={i} className="rounded-lg border border-slate-200 p-3.5 bg-slate-50/50">
                                                        <div className="flex flex-wrap items-end gap-3">
                                                            <div className="flex flex-col gap-1 pt-1">
                                                                <button onClick={() => moveColumn(i, -1)} disabled={i === 0} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30">
                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button onClick={() => moveColumn(i, 1)} disabled={i === draft.columns.length - 1} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30">
                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>

                                                            <div className="w-44">
                                                                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Column name</label>
                                                                <input
                                                                    value={col.name}
                                                                    onChange={e => patchColumn(i, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                                                    placeholder="prompt_text"
                                                                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                                                />
                                                            </div>

                                                            <div className="w-52">
                                                                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Type</label>
                                                                <select
                                                                    value={col.kind}
                                                                    onChange={e => patchColumn(i, { kind: e.target.value as DraftColumnKind })}
                                                                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                                                >
                                                                    {(Object.keys(KIND_LABEL) as DraftColumnKind[]).map(k => (
                                                                        <option key={k} value={k}>{KIND_LABEL[k]}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {(col.kind === 'text' || col.kind === 'choice' || col.kind === 'number') && (
                                                                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 pb-2 select-none cursor-pointer">
                                                                    <input type="checkbox" checked={col.required ?? false} onChange={e => patchColumn(i, { required: e.target.checked })} className="rounded border-slate-300" />
                                                                    Required
                                                                </label>
                                                            )}

                                                            <button onClick={() => patch({ columns: draft.columns.filter((_, idx) => idx !== i) })} className="ml-auto p-1.5 text-slate-300 hover:text-rose-600">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-3 pl-8">
                                                            {(col.kind === 'choice' || col.kind === 'answer') && (
                                                                <div className="flex-1 min-w-[260px]">
                                                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                                                                        Allowed values <span className="font-normal">(comma separated)</span>
                                                                    </label>
                                                                    <input
                                                                        value={valuesText[i] ?? (col.values ?? []).join(', ')}
                                                                        onChange={e => {
                                                                            const raw = e.target.value;
                                                                            setValuesText(v => ({ ...v, [i]: raw }));
                                                                            patchColumn(i, {
                                                                                values: raw.split(',').map(s => s.trim()).filter(Boolean),
                                                                            });
                                                                        }}
                                                                        onBlur={() => setValuesText(v => {
                                                                            const next = { ...v };
                                                                            delete next[i];
                                                                            return next;
                                                                        })}
                                                                        placeholder="LISTENING, READING, WRITING, SPEAKING"
                                                                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                                                    />
                                                                </div>
                                                            )}

                                                            {col.kind === 'number' && (
                                                                <div className="flex gap-2">
                                                                    <div className="w-24">
                                                                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Min</label>
                                                                        <input type="number" value={col.min ?? ''} onChange={e => patchColumn(i, { min: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono" />
                                                                    </div>
                                                                    <div className="w-24">
                                                                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Max</label>
                                                                        <input type="number" value={col.max ?? ''} onChange={e => patchColumn(i, { max: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono" />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Conditional applicability */}
                                                            {choiceColumns.length > 0 && (
                                                                <div className="flex-1 min-w-[300px]">
                                                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                                                                        Only applies when…
                                                                    </label>
                                                                    <div className="flex gap-2">
                                                                        <select
                                                                            value={col.onlyWhen?.column ?? ''}
                                                                            onChange={e =>
                                                                                patchColumn(i, {
                                                                                    onlyWhen: e.target.value
                                                                                        ? { column: e.target.value, values: col.onlyWhen?.values ?? [] }
                                                                                        : undefined,
                                                                                })
                                                                            }
                                                                            className="w-36 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white"
                                                                        >
                                                                            <option value="">always</option>
                                                                            {choiceColumns.filter(c => c.name && c.name !== col.name).map(c => (
                                                                                <option key={c.name} value={c.name}>{c.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        {col.onlyWhen && (
                                                                            <div className="flex flex-wrap gap-1 items-center">
                                                                                {(draft.columns.find(c => c.name === col.onlyWhen!.column)?.values ?? []).map(v => {
                                                                                    const on = col.onlyWhen!.values.includes(v);
                                                                                    return (
                                                                                        <button
                                                                                            key={v}
                                                                                            onClick={() =>
                                                                                                patchColumn(i, {
                                                                                                    onlyWhen: {
                                                                                                        column: col.onlyWhen!.column,
                                                                                                        values: on
                                                                                                            ? col.onlyWhen!.values.filter(x => x !== v)
                                                                                                            : [...col.onlyWhen!.values, v],
                                                                                                    },
                                                                                                })
                                                                                            }
                                                                                            className={`px-2 py-1 rounded-md font-mono text-[10px] border ${on ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                                                                        >
                                                                                            {v}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mt-2 pl-8 text-[11px] text-slate-400">{KIND_HELP[col.kind]}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Optional extras */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                                            <div>
                                                <div className="font-mono text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
                                                    One file = one group (optional)
                                                </div>
                                                <p className="text-[11px] text-slate-500 mb-2">
                                                    Pick columns every row in a file must agree on. Leave empty if a file is just a batch.
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {choiceColumns.filter(c => c.name).map(c => {
                                                        const on = (draft.bucketColumns ?? []).includes(c.name);
                                                        return (
                                                            <button
                                                                key={c.name}
                                                                onClick={() =>
                                                                    patch({
                                                                        bucketColumns: on
                                                                            ? (draft.bucketColumns ?? []).filter(x => x !== c.name)
                                                                            : [...(draft.bucketColumns ?? []), c.name],
                                                                    })
                                                                }
                                                                className={`px-2.5 py-1 rounded-md font-mono text-[11px] border ${on ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                                            >
                                                                {c.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {(draft.bucketColumns ?? []).length > 0 && (
                                                    <label className="flex items-center gap-2 mt-3 text-[11px] text-slate-600 select-none cursor-pointer">
                                                        <input type="checkbox" checked={draft.checkFilename ?? false} onChange={e => patch({ checkFilename: e.target.checked })} className="rounded border-slate-300" />
                                                        Also check the filename mentions them
                                                    </label>
                                                )}
                                            </div>

                                            <div>
                                                <div className="font-mono text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
                                                    Permanent row ids (optional)
                                                </div>
                                                <p className="text-[11px] text-slate-500 mb-2">
                                                    Gives every question a stable id so re-importing updates it instead of duplicating it.
                                                </p>
                                                <input
                                                    value={draft.keyPrefix ?? ''}
                                                    onChange={e => patch({ keyPrefix: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                                                    placeholder="prefix, e.g. oet"
                                                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono mb-2"
                                                />
                                                {draft.keyPrefix && (
                                                    <>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {choiceColumns.filter(c => c.name).map(c => {
                                                                const on = (draft.keyColumns ?? []).includes(c.name);
                                                                return (
                                                                    <button
                                                                        key={c.name}
                                                                        onClick={() =>
                                                                            patch({
                                                                                keyColumns: on
                                                                                    ? (draft.keyColumns ?? []).filter(x => x !== c.name)
                                                                                    : [...(draft.keyColumns ?? []), c.name],
                                                                            })
                                                                        }
                                                                        className={`px-2.5 py-1 rounded-md font-mono text-[11px] border ${on ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                                                    >
                                                                        {c.name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="mt-2 font-mono text-[11px] text-slate-500">
                                                            {draft.keyPrefix}_{(draft.keyColumns ?? []).map(k => `{${k}}`).join('_')}_001
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ---------------- VIEW + RUN ---------------- */}
                            {!draft && detail && (
                                <>
                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <span className="font-semibold text-slate-800">{detail.label}</span>
                                            {editable ? (
                                                <>
                                                    <button onClick={startEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                                                        <Pencil className="w-3.5 h-3.5" /> Edit rules
                                                    </button>
                                                    <button onClick={remove} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">
                                                    Built-in — mirrors the existing pipeline, so it can't be edited here.
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5">
                                            {detail.columns.map(c => (
                                                <div key={c.name} className="text-xs py-1 border-b border-slate-50">
                                                    <span className="font-mono font-semibold text-slate-800">{c.name}</span>
                                                    <span className="text-slate-400 ml-2">{c.kind}</span>
                                                    {c.required && <span className="text-rose-500 ml-2 font-semibold">required</span>}
                                                    {c.appliesWhen && (
                                                        <span className="text-slate-500 ml-2">
                                                            only when {c.appliesWhen.column} is {c.appliesWhen.in.join('/')}
                                                        </span>
                                                    )}
                                                    {c.members && c.members.length > 0 && (
                                                        <div className="font-mono text-[10px] text-slate-400 mt-0.5 break-words">{c.members.join(' · ')}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
                                            <span><span className="text-slate-400">group by: </span><span className="font-mono text-slate-700">{detail.bucket?.join(' / ') ?? 'nothing'}</span></span>
                                            <span><span className="text-slate-400">row ids: </span><span className="font-mono text-slate-700">{detail.sourceKey ?? 'none'}</span></span>
                                            {detail.hooks.length > 0 && (
                                                <span><span className="text-slate-400">code hooks: </span><span className="font-mono text-slate-700">{detail.hooks.join(', ')}</span></span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                                        <div className="flex flex-wrap items-end gap-4">
                                            <div className="flex-1 min-w-[240px]">
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">CSV files</label>
                                                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:border-teal-400 hover:text-teal-700">
                                                    <FileUp className="w-4 h-4" />
                                                    {files.length === 0 ? 'Choose one or more CSVs' : `${files.length} file${files.length > 1 ? 's' : ''} selected`}
                                                </button>
                                                <input ref={fileInputRef} type="file" accept=".csv" multiple onChange={e => { setFiles(Array.from(e.target.files ?? [])); setResult(null); }} className="hidden" />
                                            </div>

                                            <div className="w-32">
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Expected rows</label>
                                                <input type="number" min={1} value={expected} onChange={e => setExpected(e.target.value)} placeholder={String(detail.expectedRows.fallback)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-mono" />
                                            </div>

                                            <button onClick={run} disabled={running || files.length === 0} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40">
                                                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                                Run Layer 1
                                            </button>
                                        </div>

                                        {files.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {files.map(f => (
                                                    <span key={f.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 font-mono text-[11px] text-slate-600">{f.name}</span>
                                                ))}
                                                <button onClick={() => { setFiles([]); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-rose-600">
                                                    <X className="w-3 h-3" /> clear
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ---------------- RESULTS ---------------- */}
                            {!draft && result && (
                                <>
                                    <div
                                        className={`rounded-xl border-2 p-5 flex flex-wrap items-center gap-4 ${
                                            result.outcome === 'pass'
                                                ? 'bg-emerald-50 border-emerald-300'
                                                : result.outcome === 'warn'
                                                  ? 'bg-amber-50 border-amber-300'
                                                  : 'bg-rose-50 border-rose-300'
                                        }`}
                                    >
                                        {result.outcome === 'pass' ? (
                                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                        ) : result.outcome === 'warn' ? (
                                            <AlertTriangle className="w-7 h-7 text-amber-600" />
                                        ) : (
                                            <XCircle className="w-7 h-7 text-rose-600" />
                                        )}
                                        <div>
                                            <div
                                                className={`text-lg font-bold ${
                                                    result.outcome === 'pass'
                                                        ? 'text-emerald-800'
                                                        : result.outcome === 'warn'
                                                          ? 'text-amber-800'
                                                          : 'text-rose-800'
                                                }`}
                                            >
                                                {result.outcome === 'pass'
                                                    ? 'PASSED — safe to hand on'
                                                    : result.outcome === 'warn'
                                                      ? 'PASSED WITH WARNINGS — needs a human look'
                                                      : 'FAILED — fix these before importing'}
                                            </div>
                                            <div className="text-sm text-slate-600 mt-0.5">
                                                {result.files.length} file{result.files.length > 1 ? 's' : ''} ·{' '}
                                                {totalFindings} problem{totalFindings === 1 ? '' : 's'} · expected{' '}
                                                <span className="font-mono">{result.expected}</span> rows
                                            </div>
                                        </div>
                                        <button
                                            onClick={downloadReport}
                                            disabled={downloading}
                                            className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            Excel report
                                        </button>
                                    </div>

                                    {result.runFindings.length > 0 && (
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-mono text-[10px] font-semibold tracking-widest uppercase text-slate-500">Across files</div>
                                            {result.runFindings.map((f, i) => <FindingRow key={i} finding={f} />)}
                                        </div>
                                    )}

                                    {result.files.map(file => {
                                        const findings = [...file.fileFindings, ...file.rowFindings];
                                        return (
                                            <div key={file.fileName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3">
                                                    <span className="font-mono text-xs font-semibold text-slate-800 break-all">{file.fileName}</span>
                                                    <OutcomePill outcome={file.outcome} />
                                                    <span className="font-mono text-[11px] text-slate-400">{file.rowCount} rows</span>
                                                    <span className="ml-auto font-mono text-[11px] text-slate-400">{findings.length} problem{findings.length === 1 ? '' : 's'}</span>
                                                </div>
                                                {findings.length === 0 ? (
                                                    <div className="px-4 py-6 text-sm text-emerald-700 flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" /> Clean — nothing to fix.
                                                    </div>
                                                ) : (
                                                    findings.map((f, i) => <FindingRow key={i} finding={f} />)
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
