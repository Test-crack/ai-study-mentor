// SuperAdmin — Add / author an exam (Stage 0/1).
// Lifecycle: zero → DRAFT (editable) → verify-gated PUBLISH → LIVE (immutable to the admin).
// Built-ins are file-locked (the backend rejects any write to them). The plain-English
// read-back is the SAME interpretation the runtime uses, so what you confirm is what ships.
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePersistentState } from '@/shared/hooks/usePersistentState';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { useToast } from '@/shared/hooks/use-toast';
import {
    listAuthoredExams,
    createExamDraft,
    getExamDraft,
    updateExamDraft,
    publishExam,
    disableExam,
    deleteExamDraft,
    type AuthoredExamRow,
    type ConfigVerifyResult,
    type ConfigFinding,
    type ConfigOutcome,
} from '../services/superadminService';
import {
    PlusCircle, Loader2, CheckCircle2, AlertTriangle, XCircle, Info,
    Rocket, Trash2, Save, FilePlus2, PowerOff, BookOpenCheck,
} from 'lucide-react';

const STARTER = JSON.stringify({
    exam_id: 'my_exam',
    status: 'reserved',
    naming: { public_display_name: 'My Exam', short_code: 'MX' },
    legal: { disclaimer_short: 'Independent practice tool. Not affiliated with any exam body.', disclaimer_full: 'This is an independent preparation tool and is not affiliated with, endorsed by, or connected to any official examination body.' },
    components: [
        { id: 'listening', label: 'Listening', modality: 'listening', assessed: true, scale: 'ielts_band', delivery: 'audio_item_set', weight: 1.0, time_limit_minutes: 30 },
        { id: 'reading', label: 'Reading', modality: 'reading', assessed: true, scale: 'ielts_band', delivery: 'passage_item_set', weight: 1.0, time_limit_minutes: 60 },
    ],
    overall: { mode: 'per_component', strategy: null, components: [], scale: null },
}, null, 2);

function OutcomeBadge({ outcome, big }: { outcome: ConfigOutcome; big?: boolean }) {
    const size = big ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
    const map = {
        pass: { cls: 'text-brand-teal-600 bg-brand-teal-50 border-brand-teal-100', Icon: CheckCircle2, label: 'pass' },
        warn: { cls: 'text-amber-600 bg-amber-50 border-amber-200', Icon: AlertTriangle, label: 'warn' },
        fail: { cls: 'text-brand-warm-danger bg-red-50 border-red-200', Icon: XCircle, label: 'fail' },
    }[outcome];
    return <span className={`inline-flex items-center gap-1.5 rounded-md border font-semibold ${size} ${map.cls}`}><map.Icon className="w-3.5 h-3.5" /> {map.label}</span>;
}

function StatusPill({ status }: { status: string }) {
    const cls = status === 'live' ? 'text-emerald-500 bg-emerald-500/10'
        : status === 'draft' ? 'text-amber-500 bg-amber-500/10'
        : status === 'disabled' ? 'text-brand-text-mute bg-brand-line/40'
        : 'text-sky-500 bg-sky-500/10';
    return <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${cls}`}>{status}</span>;
}

function FindingRow({ f }: { f: ConfigFinding }) {
    const Icon = f.severity === 'fail' ? XCircle : f.severity === 'warn' ? AlertTriangle : Info;
    const color = f.severity === 'fail' ? 'text-brand-warm-danger' : f.severity === 'warn' ? 'text-amber-600' : 'text-brand-text-mute';
    return <li className="flex items-start gap-2 text-sm"><Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} /><span>{f.message}</span></li>;
}

export default function ConfigAuthoring() {
    const { toast } = useToast();
    const [collapsed, setCollapsed] = useState(false);

    const [authored, setAuthored] = useState<AuthoredExamRow[]>([]);
    const [editor, setEditor] = usePersistentState('ae_editor', '');
    const [currentId, setCurrentId] = usePersistentState<string | null>('ae_currentId', null);
    const [verify, setVerify] = useState<ConfigVerifyResult | null>(null);
    const [busy, setBusy] = useState(false);

    const current = authored.find((a) => a.exam_id === currentId) ?? null;
    const isDraft = !currentId || current?.status === 'draft';
    const canPublish = !!currentId && current?.status === 'draft' && !!verify && verify.layer1.outcome !== 'fail';

    async function refresh() {
        try { const r = await listAuthoredExams(); setAuthored(r.data ?? []); } catch { /* toasted */ }
    }
    useEffect(() => { refresh(); }, []);

    function parseEditor(): any | null {
        try { return JSON.parse(editor); }
        catch (e: any) { toast({ title: "That isn't valid JSON", description: e?.message, variant: 'destructive' }); return null; }
    }

    async function save() {
        const cfg = parseEditor();
        if (!cfg) return;
        setBusy(true);
        try {
            const res = currentId ? await updateExamDraft(currentId, cfg) : await createExamDraft(cfg);
            setCurrentId(res.data.exam_id);
            setVerify(res.data.verify);
            toast({ title: `Draft saved: ${res.data.exam_id}` });
            await refresh();
        } catch { /* toasted */ } finally { setBusy(false); }
    }

    async function doPublish() {
        if (!currentId) return;
        setBusy(true);
        try {
            const res = await publishExam(currentId, 'live');
            setVerify(res.data.verify);
            toast({ title: `Published: ${currentId} is now ${res.data.status}` });
            await refresh();
        } catch { /* toasted (incl. 422 verify-gate) */ } finally { setBusy(false); }
    }

    async function loadDraft(id: string) {
        setBusy(true);
        try {
            const r = await getExamDraft(id);
            setEditor(JSON.stringify(r.data.config, null, 2));
            setCurrentId(id);
            setVerify(null);
        } catch { /* toasted */ } finally { setBusy(false); }
    }

    async function remove(id: string) {
        if (!confirm(`Delete draft "${id}"? This can't be undone.`)) return;
        try { await deleteExamDraft(id); if (currentId === id) { setCurrentId(null); setEditor(''); setVerify(null); } await refresh(); toast({ title: `Deleted ${id}` }); }
        catch { /* toasted */ }
    }
    async function turnOff(id: string) {
        if (!confirm(`Disable "${id}"? Students will no longer see it (records are kept).`)) return;
        try { await disableExam(id); await refresh(); toast({ title: `Disabled ${id}` }); } catch { /* toasted */ }
    }

    function newDraft() { setCurrentId(null); setEditor(''); setVerify(null); }

    return (
        <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
            <div className="hidden lg:block">
                <SuperAdminSidebar activeTab="add-exam" isCollapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
            </div>
            <div className={`relative z-10 transition-all duration-300 flex flex-col min-h-screen ${collapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
                <SuperAdminTopbar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1400px] mx-auto space-y-6">
                        <div className="flex items-start gap-3 rounded-xl border border-brand-teal-100 bg-brand-teal-50 p-4">
                            <PlusCircle className="w-5 h-5 text-brand-teal-600 mt-0.5 shrink-0" />
                            <div>
                                <h1 className="font-semibold">Add an Exam</h1>
                                <p className="text-sm text-brand-text-mute">
                                    Author a config as a <strong>draft</strong>, read back exactly what the platform understood,
                                    then <strong>publish</strong>. Once live it's immutable here — changes go through the dev team.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
                            {/* Authored exams list */}
                            <section className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-3 h-fit">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute">Authored exams</p>
                                    <button onClick={newDraft} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-teal-600 hover:text-brand-teal-700">
                                        <FilePlus2 className="w-3.5 h-3.5" /> New
                                    </button>
                                </div>
                                {authored.length === 0 && <p className="text-sm text-brand-text-mute">None yet. Author one on the right.</p>}
                                <ul className="space-y-1.5">
                                    {authored.map((a) => (
                                        <li key={a.exam_id} className={`rounded-lg border p-2 ${currentId === a.exam_id ? 'border-brand-teal-400 bg-brand-teal-50/40' : 'border-brand-line'}`}>
                                            <div className="flex items-center justify-between gap-2">
                                                <button onClick={() => loadDraft(a.exam_id)} className="text-left min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{a.label}</p>
                                                    <p className="font-jetbrains text-[10px] text-brand-text-mute truncate">{a.exam_id}</p>
                                                </button>
                                                <StatusPill status={a.status} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                {a.status === 'draft' && (
                                                    <button onClick={() => remove(a.exam_id)} className="inline-flex items-center gap-1 text-[10px] text-brand-text-mute hover:text-brand-warm-danger"><Trash2 className="w-3 h-3" /> delete</button>
                                                )}
                                                {(a.status === 'live' || a.status === 'reserved') && (
                                                    <button onClick={() => turnOff(a.exam_id)} className="inline-flex items-center gap-1 text-[10px] text-brand-text-mute hover:text-amber-600"><PowerOff className="w-3 h-3" /> disable</button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Editor + verify + publish */}
                            <section className="space-y-4">
                                <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute">
                                            {currentId ? `Editing: ${currentId}` : 'New exam config (JSON)'}
                                        </p>
                                        {!editor && <button onClick={() => setEditor(STARTER)} className="text-[11px] font-semibold text-brand-teal-600 hover:text-brand-teal-700">Insert starter</button>}
                                    </div>
                                    <textarea
                                        value={editor}
                                        onChange={(e) => setEditor(e.target.value)}
                                        placeholder="Paste or write an exam config…"
                                        spellCheck={false}
                                        className="w-full h-[420px] rounded-lg border border-brand-line bg-brand-bg px-3 py-2 font-jetbrains text-xs resize-y"
                                    />
                                    <div className="flex items-center gap-3">
                                        <button onClick={save} disabled={busy || !editor.trim()} className="inline-flex items-center gap-2 rounded-lg bg-brand-teal-600 text-white text-sm font-semibold px-4 py-2 hover:bg-brand-teal-700 disabled:opacity-50">
                                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save draft &amp; verify
                                        </button>
                                        <button onClick={doPublish} disabled={busy || !canPublish} title={!canPublish ? 'Save a draft that passes structural verification first' : 'Publish this exam'} className="inline-flex items-center gap-2 rounded-lg border border-brand-teal-600 text-brand-teal-600 text-sm font-semibold px-4 py-2 hover:bg-brand-teal-50 disabled:opacity-40">
                                            <Rocket className="w-4 h-4" /> Publish
                                        </button>
                                        {!isDraft && currentId && <span className="text-[11px] text-brand-text-mute">This exam is published — immutable here.</span>}
                                    </div>
                                </div>

                                {verify && (
                                    <>
                                        <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute">Layer 1 — structural</p>
                                                <OutcomeBadge outcome={verify.layer1.outcome} />
                                            </div>
                                            {verify.layer1.findings.length === 0
                                                ? <p className="text-sm text-brand-teal-600">No structural issues — the engine can run this.</p>
                                                : <ul className="space-y-1.5">{verify.layer1.findings.map((f, i) => <FindingRow key={i} f={f} />)}</ul>}
                                        </div>
                                        <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-mute flex items-center gap-1.5"><BookOpenCheck className="w-3.5 h-3.5" /> Layer 2 — what the platform understood</p>
                                                <OutcomeBadge outcome={verify.layer2.outcome} />
                                            </div>
                                            <div className="prose prose-sm max-w-none prose-headings:text-brand-text prose-headings:font-semibold prose-p:text-brand-text prose-li:text-brand-text prose-strong:text-brand-text rounded-lg bg-brand-bg border border-brand-line p-4">
                                                <ReactMarkdown>{verify.layer2.plainEnglish || '_No interpretation available._'}</ReactMarkdown>
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
