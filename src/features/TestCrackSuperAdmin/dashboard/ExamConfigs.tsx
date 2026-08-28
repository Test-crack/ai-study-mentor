// SuperAdmin — Exam Config explorer (A4, view-only).
// Shows how each exam's config is shaped (components / scale / strategy) READ-ONLY, and
// lets the admin copy/export the JSON to DRAFT a new exam and hand it to a developer.
// Scoring config stays file-sourced + code-reviewed — nothing here can change live scoring.
import { useEffect, useState } from 'react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { fetchExamsForConfig, fetchExamConfig, type ExamConfigSummary } from '../services/superadminService';
import { ShieldCheck, Copy, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

export default function ExamConfigs() {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [exams, setExams] = useState<ExamConfigSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExamsForConfig()
      .then((r) => { setExams(r.data ?? []); if (r.data?.length) setSelected(r.data[0].exam_id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetchExamConfig(selected)
      .then((r) => setConfig(r.data))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, [selected]);

  const json = config ? JSON.stringify(config, null, 2) : '';

  const copyJson = async () => {
    try { await navigator.clipboard.writeText(json); toast({ title: '✅ Config copied', description: 'Paste it into a draft and hand it to a developer.' }); }
    catch { toast({ title: 'Copy failed', variant: 'destructive' }); }
  };
  const downloadJson = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selected}-config.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const components: any[] = config?.components ?? [];
  const overall = config?.overall ?? {};

  return (
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
      <div className="hidden lg:block">
        <SuperAdminSidebar activeTab="exam-configs" isCollapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
      </div>
      <div className={`relative z-10 transition-all duration-300 flex flex-col min-h-screen ${collapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <SuperAdminTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <div>
              <h1 className="font-manrope text-2xl font-black tracking-tight">Exam Configs</h1>
              <p className="text-sm text-brand-text-mute mt-1">How each exam is configured. Read-only — draft changes here and hand them to a developer.</p>
            </div>

            {/* Safety banner */}
            <div className="flex items-start gap-3 rounded-xl border border-brand-teal-100 bg-brand-teal-50 p-4">
              <ShieldCheck className="w-5 h-5 text-brand-teal-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-brand-text">
                Scoring config is <b>file-sourced and code-reviewed</b>. This screen is view-only so a mistaken edit can never change how real
                students are scored. To add or change an exam, <b>copy/export the config below, edit your draft, and pass it to a developer</b> for review.
              </p>
            </div>

            {/* Exam picker */}
            <div className="flex flex-wrap gap-2">
              {exams.map((e) => (
                <button
                  key={e.exam_id}
                  onClick={() => setSelected(e.exam_id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    selected === e.exam_id ? 'bg-brand-teal-600 border-brand-teal-600 text-white' : 'bg-brand-bg-alt border-brand-line text-brand-text hover:border-brand-teal-400'
                  }`}
                >
                  {e.label}
                  <span className="text-[9px] font-medium opacity-70 uppercase">{e.status}</span>
                </button>
              ))}
            </div>

            {loading && <div className="flex items-center gap-2 text-brand-text-mute text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading config…</div>}

            {!loading && config && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Human-readable summary */}
                <div className="space-y-4">
                  <section className="rounded-xl border border-brand-line bg-brand-bg-alt p-4">
                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-3">Overall scoring</p>
                    <dl className="text-sm space-y-1">
                      <div className="flex justify-between"><dt className="text-brand-text-mute">Mode</dt><dd className="font-semibold">{overall.mode ?? '—'}</dd></div>
                      <div className="flex justify-between"><dt className="text-brand-text-mute">Strategy</dt><dd className="font-semibold">{overall.strategy ?? '(per-component)'}</dd></div>
                      <div className="flex justify-between"><dt className="text-brand-text-mute">Scale</dt><dd className="font-semibold">{overall.scale ?? '—'}</dd></div>
                    </dl>
                  </section>

                  <section className="rounded-xl border border-brand-line bg-brand-bg-alt p-4">
                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-3">Components ({components.length})</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-brand-text-mute text-[11px] uppercase tracking-wide">
                            <th className="py-1 pr-3">ID</th><th className="py-1 pr-3">Assessed</th><th className="py-1 pr-3">Scale</th><th className="py-1 pr-3">Weight</th><th className="py-1">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {components.map((c) => (
                            <tr key={c.id} className="border-t border-brand-line">
                              <td className="py-1.5 pr-3 font-semibold">{c.label ?? c.id}</td>
                              <td className="py-1.5 pr-3">{c.assessed ? 'yes' : 'no'}</td>
                              <td className="py-1.5 pr-3">{c.scale ?? '—'}</td>
                              <td className="py-1.5 pr-3 tabular-nums">{c.weight ?? '—'}</td>
                              <td className="py-1.5 tabular-nums">{c.time_limit_minutes ? `${c.time_limit_minutes}m` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                {/* Raw JSON — the draft/export surface */}
                <section className="rounded-xl border border-brand-line bg-brand-ink p-4 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-on-ink-mute">Config JSON (draft template)</p>
                    <div className="flex gap-2">
                      <button onClick={copyJson} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-brand-bg hover:bg-white/20"><Copy className="w-3.5 h-3.5" /> Copy</button>
                      <button onClick={downloadJson} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-mint/20 text-brand-mint hover:bg-brand-mint/30"><Download className="w-3.5 h-3.5" /> Download</button>
                    </div>
                  </div>
                  <pre className="text-[11px] leading-relaxed text-brand-bg/90 overflow-auto max-h-[60vh] font-mono">{json}</pre>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
