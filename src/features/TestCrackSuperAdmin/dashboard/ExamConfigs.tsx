// SuperAdmin — Exam Config explorer (A4, view-only).
// Shows how each exam's config is shaped (naming / legal / scoring / components / variants)
// READ-ONLY, and lets the admin copy/export the JSON to DRAFT a new exam and hand it to a
// developer. Scoring config stays file-sourced + code-reviewed — nothing here can change
// live scoring.
import { useEffect, useMemo, useState } from 'react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import {
  Search, Copy, Download, Loader2, Lock, ChevronDown, ChevronRight,
  Headphones, BookOpen, PenLine, Mic,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/shared/utils';
import { fetchExamsForConfig, fetchExamConfig, type ExamConfigSummary } from '../services/superadminService';
import { useToast } from '@/shared/hooks/use-toast';

const COMPONENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenLine,
  speaking: Mic,
};

function StatusBadge({ status }: { status: string }) {
  const live = status === 'live';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
      live ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'bg-emerald-400' : 'bg-amber-400')} />
      {live ? 'Live' : 'Reserved'}
    </span>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
      <p className="font-jetbrains text-[9px] font-bold uppercase tracking-[0.15em] text-white/40 mb-1">{label}</p>
      <p className="font-jetbrains text-sm font-bold text-white">{value}</p>
    </div>
  );
}

// ─── Minimal collapsible pretty-printer for the raw JSON side panel ───────────

function JsonValue({ value }: { value: any }) {
  if (value === null) return <span className="text-white/40">null</span>;
  if (typeof value === 'string') return <span className="text-amber-300">"{value}"</span>;
  if (typeof value === 'number') return <span className="text-emerald-300">{value}</span>;
  if (typeof value === 'boolean') return <span className={value ? 'text-emerald-300' : 'text-rose-300'}>{String(value)}</span>;
  if (Array.isArray(value)) return <span className="text-white/50">[{value.length} item{value.length === 1 ? '' : 's'}]</span>;
  return <span className="text-white/50">{'{'}{Object.keys(value).length} key{Object.keys(value).length === 1 ? '' : 's'}{'}'}</span>;
}

function JsonRow({ k, v, depth = 0, badge }: { k: string; v: any; depth?: number; badge?: string }) {
  const isExpandable = v !== null && typeof v === 'object';
  const [open, setOpen] = useState(depth < 1);

  if (!isExpandable) {
    return (
      <div style={{ paddingLeft: depth * 14 }} className="py-0.5 text-[11px] font-mono">
        <span className="text-sky-300">"{k}"</span>
        <span className="text-white/30">: </span>
        <JsonValue value={v} />
      </div>
    );
  }

  const entries = Array.isArray(v) ? v.map((item, i) => [String(i), item] as const) : Object.entries(v);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ paddingLeft: depth * 14 }}
        className="w-full flex items-center gap-1 py-0.5 text-[11px] font-mono text-left hover:bg-white/5 rounded"
      >
        {open ? <ChevronDown className="h-3 w-3 text-white/30 shrink-0" /> : <ChevronRight className="h-3 w-3 text-white/30 shrink-0" />}
        <span className="text-sky-300">"{k}"</span>
        <span className="text-white/30">: </span>
        <JsonValue value={v} />
        {badge && (
          <span className="ml-2 text-[8px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/10 rounded px-1.5 py-0.5">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div>
          {entries.map(([ek, ev]) => <JsonRow key={ek} k={ek} v={ev} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

function countKeys(v: any): number {
  if (v === null || typeof v !== 'object') return 0;
  const entries = Array.isArray(v) ? v : Object.values(v);
  return (Array.isArray(v) ? v.length : Object.keys(v).length) + entries.reduce((acc: number, e: any) => acc + countKeys(e), 0);
}

export default function ExamConfigs() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [exams, setExams] = useState<ExamConfigSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

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

  const components: any[] = config?.components ?? [];
  const overall = config?.overall ?? {};
  const naming = config?.naming ?? {};
  const legal = config?.legal ?? {};
  const variants = config?.variants ?? null;
  const totalMinutes = components.reduce((sum, c) => sum + (c.time_limit_minutes ?? 0), 0);
  const maxMinutes = Math.max(...components.map(c => c.time_limit_minutes ?? 0), 1);

  const identity = config ? {
    exam_id: config.exam_id, prisma_enum: config.prisma_enum,
    config_version: config.config_version, status: config.status,
    requires_entitlement: config.requires_entitlement,
  } : null;

  const scoring = overall ? { mode: overall.mode, strategy: overall.strategy, scale: overall.scale } : null;

  const legalCore = legal ? {
    jurisdictions: legal.jurisdictions, rights_holder: legal.rights_holder,
    may_use_mark_in_product_name: legal.may_use_mark_in_product_name,
    required_attribution: legal.required_attribution, permission_status: legal.permission_status,
    review_contact: legal.review_contact, _status: legal._status,
  } : null;

  const displayRules = legal?.display_rules ?? null;
  const variantOptions = variants?.options ?? [];

  const totalKeyCount = config ? countKeys(config) : 0;
  const needsReview = Boolean(naming?._naming_conflict);
  const clearedToRun = legal?.permission_status !== 'denied' && legal?.permission_status !== 'blocked';

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      toast({ title: '✅ Config copied', description: 'Paste it into a draft and hand it to a developer.' });
    } catch { toast({ title: 'Copy failed', variant: 'destructive' }); }
  };
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selected}-config.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased">
      <div className="hidden lg:block">
        <SuperAdminSidebar activeTab="exam-configs" isCollapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} />
      </div>
      <div className={`relative z-10 transition-all duration-300 flex flex-col min-h-screen ${collapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Page-specific header — breadcrumb + config search + read-only badge */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 gap-4 border-b border-brand-line bg-white sticky top-0 z-30 shrink-0">
          <div>
            <p className="font-jetbrains text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text-mute">Platform</p>
            <h1 className="font-manrope text-sm font-black tracking-tight -mt-0.5">Exam Configs</h1>
          </div>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="relative w-full max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-mute" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search configs, keys, values…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-brand-bg-alt border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30"
              />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-ink text-white">
              <Lock className="h-3 w-3" /> Read only
            </span>
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold leading-none">{displayName}</p>
              <p className="font-jetbrains text-[9px] font-semibold tracking-[0.1em] uppercase text-brand-text-mute mt-0.5">Super Admin</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1500px] mx-auto space-y-5">

            {/* Exam picker */}
            <div className="flex flex-wrap gap-2">
              {exams.map((e) => (
                <button
                  key={e.exam_id}
                  onClick={() => setSelected(e.exam_id)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors',
                    selected === e.exam_id
                      ? 'bg-brand-ink border-brand-ink text-white'
                      : 'bg-white border-brand-line text-brand-text hover:border-brand-teal-400'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', e.status === 'live' ? 'bg-emerald-500' : 'bg-amber-500')} />
                  {e.label}
                  <span className={cn(
                    'text-[9px] font-black uppercase tracking-wider opacity-70',
                    selected === e.exam_id ? 'text-white/70' : 'text-brand-text-mute'
                  )}>
                    {e.status}
                  </span>
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-brand-text-mute text-sm py-10 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading config…
              </div>
            )}

            {!loading && config && (
              <div className="space-y-5">
                {/* Hero: identity + scoring + components */}
                <div className="rounded-2xl bg-brand-ink text-white p-5 sm:p-6">
                  <div className="flex flex-col xl:flex-row xl:items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={config.status} />
                        <span className="font-jetbrains text-[10px] text-white/40 uppercase tracking-wider">
                          {config.exam_id} · {config.prisma_enum} · v{config.config_version}
                        </span>
                      </div>
                      <h2 className="font-manrope text-2xl font-black tracking-tight">{naming.public_display_name}</h2>
                      <p className="text-sm text-white/60 mt-1.5 max-w-xl">
                        {config.status === 'live' ? 'Live for all institutes with an entitlement.' : 'Reserved — not yet enabled for institutes.'}{' '}
                        {overall.strategy?.replace(/_/g, ' ')} {overall.mode} across {components.length} equally weighted components.
                      </p>

                      <div className="grid grid-cols-3 gap-2.5 mt-4 max-w-md">
                        <Tile label="Mode" value={overall.mode ?? '—'} />
                        <Tile label="Strategy" value={overall.strategy ?? '—'} />
                        <Tile label="Scale" value={overall.scale ?? '—'} />
                      </div>
                    </div>

                    <div className="xl:w-[380px] shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                          Components · {components.length}
                        </p>
                        <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                          {totalMinutes} min total
                        </p>
                      </div>
                      <div className="space-y-2.5 bg-white/5 rounded-xl p-3 border border-white/10">
                        {components.map((c) => {
                          const Icon = COMPONENT_ICON[c.id] ?? BookOpen;
                          return (
                            <div key={c.id} className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-white/50 shrink-0" />
                              <span className="text-xs font-semibold w-16 shrink-0">{c.label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-400"
                                  style={{ width: `${Math.max(((c.time_limit_minutes ?? 0) / maxMinutes) * 100, 6)}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-white/70 tabular-nums w-8 text-right">{c.time_limit_minutes}m</span>
                              <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 rounded px-1 py-0.5">+{c.weight}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-white/40">
                        <span>Scale <span className="text-white/70 font-bold font-jetbrains">{overall.scale}</span></span>
                        <span>All assessed <span className="text-emerald-400 font-bold">{components.every(c => c.assessed) ? 'yes' : 'no'}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {/* Left: legal posture, disclaimers, variants */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-brand-line p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Legal posture</p>
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full',
                          clearedToRun ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        )}>
                          {clearedToRun ? 'Cleared to run' : 'Needs review'}
                        </span>
                      </div>
                      <dl className="text-sm space-y-2.5">
                        <div className="flex justify-between gap-4">
                          <dt className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute shrink-0">Jurisdictions</dt>
                          <dd className="font-semibold text-right">{(legal.jurisdictions ?? []).join(', ') || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute shrink-0">Rights holder</dt>
                          <dd className="font-semibold text-right">{legal.rights_holder ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute shrink-0">Mark in name</dt>
                          <dd className={cn('font-black', legal.may_use_mark_in_product_name ? 'text-emerald-600' : 'text-rose-600')}>
                            {String(legal.may_use_mark_in_product_name ?? '—')}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute shrink-0">Permission</dt>
                          <dd className="font-black text-amber-600">{legal.permission_status?.replace(/_/g, ' ') ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="font-jetbrains text-[10px] font-bold uppercase tracking-wider text-brand-text-mute shrink-0">Review contact</dt>
                          <dd className="text-brand-text-mute">{legal.review_contact ?? 'null'}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 pt-4 border-t border-brand-line">
                        <p className="font-jetbrains text-[9px] font-bold uppercase tracking-wider text-brand-text-mute mb-1">Required attribution</p>
                        <p className="text-xs text-brand-text-mute leading-relaxed">{legal.required_attribution ?? '—'}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-brand-line p-4">
                      <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-3">Disclaimers</p>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-jetbrains text-[9px] font-bold uppercase tracking-wider text-brand-text-mute">Short</span>
                            <span className="text-[9px] font-bold text-brand-teal-600 bg-brand-teal-50 rounded-full px-2 py-0.5">Onboarding</span>
                          </div>
                          <p className="text-xs text-brand-text leading-relaxed">{legal.disclaimer_short ?? '—'}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-jetbrains text-[9px] font-bold uppercase tracking-wider text-brand-text-mute">Full</span>
                            <span className="text-[9px] font-bold text-brand-teal-600 bg-brand-teal-50 rounded-full px-2 py-0.5">Footer</span>
                          </div>
                          <p className="text-xs text-brand-text leading-relaxed">{legal.disclaimer_full ?? '—'}</p>
                        </div>
                      </div>
                    </div>

                    {variants && (
                      <div className="bg-white rounded-2xl border border-brand-line p-4">
                        <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-3">Variants</p>
                        <p className="text-xs text-brand-text-mute mb-2">
                          <span className="font-black text-brand-text">{variants.dimension}</span> dimension
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {variantOptions.map((o: any) => (
                            <span key={o.id} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-bg-alt border border-brand-line">
                              {o.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: raw config JSON, draft template */}
                  <div className="rounded-2xl bg-brand-ink p-4 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Config JSON · draft template</p>
                      <div className="flex gap-2">
                        <button onClick={copyJson} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-white hover:bg-white/20">
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </button>
                        <button onClick={downloadJson} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    </div>

                    <div className="overflow-auto max-h-[52vh] pr-1 space-y-1">
                      {identity && <JsonRow k="identity" v={identity} />}
                      {naming && <JsonRow k="naming" v={naming} badge={needsReview ? 'Needs review' : undefined} />}
                      {legalCore && <JsonRow k="legal" v={legalCore} />}
                      {scoring && <JsonRow k="scoring" v={scoring} />}
                      <JsonRow k="components" v={components} />
                      {variants && <JsonRow k="variants" v={variantOptions} />}
                      {displayRules && <JsonRow k="display_rules" v={displayRules} />}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <p className="text-[10px] text-white/40 max-w-[70%]">
                        File-sourced and code-reviewed. Edit your draft here, then hand it to a developer.
                      </p>
                      <span className="text-[10px] font-bold text-white/40 tabular-nums">{totalKeyCount} keys</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
