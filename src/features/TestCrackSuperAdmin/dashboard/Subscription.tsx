import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader2, RefreshCw, ChevronDown, Download } from 'lucide-react';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/shared/utils';
import {
  fetchSubscriptions, setExamStatus,
  SubscriptionRecord, SubscriptionSummary,
} from '../services/superadminService';
import {
  EXAM_LABELS, BILLING_STATUSES, type BillingStatus,
} from '@/shared/constants/examTypes';
import { useToast } from '@/shared/hooks/use-toast';

const STATUS_PILL: Record<BillingStatus, string> = {
  ACTIVE:    'text-emerald-700 bg-emerald-100',
  TRIAL:     'text-amber-700 bg-amber-100',
  CANCELLED: 'text-brand-text-mute bg-brand-bg-alt',
};

const SELECT_PILL: Record<BillingStatus, string> = {
  ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  TRIAL:     'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-brand-bg-alt text-brand-text-mute border-brand-line',
};

type StatusFilter = 'ALL' | BillingStatus;

const DAY_MS = 86400000;

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / DAY_MS);
}

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const formatSince = (iso: string) => {
  try { return `Since ${new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`; }
  catch { return ''; }
};

function urgencyColor(d: number | null): string {
  if (d === null) return 'bg-brand-line';
  if (d <= 5) return 'bg-rose-500';
  if (d <= 20) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function Subscription() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [rows, setRows] = useState<SubscriptionRecord[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary>({ total: 0, active: 0, trial: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSubscriptions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
      });
      setRows(res.data);
      setSummary(res.summary);
    } catch (err: any) {
      toast({ title: 'Failed to load subscriptions', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, toast]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (row: SubscriptionRecord, next: BillingStatus) => {
    if (next === row.billingStatus) return;
    setSavingId(row.id);
    const prev = row.billingStatus;
    setRows(rs => rs.map(r => r.id === row.id ? { ...r, billingStatus: next } : r));
    try {
      await setExamStatus(row.instituteId, row.examType, next);
      toast({ title: '✅ Subscription updated', description: `${row.instituteName} · ${EXAM_LABELS[row.examType]} → ${next}` });
      load(); // refresh summary counts
    } catch (err: any) {
      setRows(rs => rs.map(r => r.id === row.id ? { ...r, billingStatus: prev } : r));
      toast({ title: 'Failed to update subscription', description: err.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  // ─── Derived insights (computed client-side from the already-fetched rows —
  // no extra endpoints needed) ─────────────────────────────────────────────

  const trialRows = useMemo(
    () => rows
      .filter(r => r.billingStatus === 'TRIAL' && r.trialEndsAt)
      .sort((a, b) => new Date(a.trialEndsAt!).getTime() - new Date(b.trialEndsAt!).getTime()),
    [rows]
  );
  const soonestTrialDays = trialRows.length ? daysLeft(trialRows[0].trialEndsAt) : null;
  const seatsAtRisk = trialRows.reduce((sum, r) => sum + r.studentCount, 0);

  const nonCancelledRows = useMemo(() => rows.filter(r => r.billingStatus !== 'CANCELLED'), [rows]);
  const seatsTotal = nonCancelledRows.reduce((sum, r) => sum + r.studentCount, 0);
  const seatsActive = rows.filter(r => r.billingStatus === 'ACTIVE').reduce((sum, r) => sum + r.studentCount, 0);
  const seatsTrial = rows.filter(r => r.billingStatus === 'TRIAL').reduce((sum, r) => sum + r.studentCount, 0);
  const instituteCount = new Set(nonCancelledRows.map(r => r.instituteId)).size;

  const institutesWithNoPaidPlan = useMemo(() => {
    const byInstitute = new Map<string, SubscriptionRecord[]>();
    rows.forEach(r => byInstitute.set(r.instituteId, [...(byInstitute.get(r.instituteId) ?? []), r]));
    let count = 0;
    byInstitute.forEach(list => { if (!list.some(r => r.billingStatus === 'ACTIVE')) count++; });
    return count;
  }, [rows]);

  const byExam = useMemo(() => {
    const map = new Map<string, { total: number; active: number; trial: number }>();
    rows.forEach(r => {
      const cur = map.get(r.examType) ?? { total: 0, active: 0, trial: 0 };
      cur.total += 1;
      if (r.billingStatus === 'ACTIVE') cur.active += 1;
      if (r.billingStatus === 'TRIAL') cur.trial += 1;
      map.set(r.examType, cur);
    });
    return Array.from(map.entries()).map(([examType, v]) => ({ examType, ...v }));
  }, [rows]);
  const maxByExam = Math.max(...byExam.map(e => e.total), 1);

  const metrics = [
    { label: 'Total', value: summary.total },
    { label: 'Active', value: summary.active },
    { label: 'On trial', value: summary.trial },
    { label: 'Cancelled', value: summary.cancelled },
  ];

  const filterTabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: summary.total },
    { id: 'TRIAL', label: 'Trial', count: summary.trial },
    { id: 'ACTIVE', label: 'Active', count: summary.active },
    { id: 'CANCELLED', label: 'Cancelled', count: summary.cancelled },
  ];

  const exportCsv = () => {
    const csv = ['institute,exam,status,students,trial_ends'].concat(
      rows.map(r => `"${r.instituteName.replace(/"/g, '""')}",${EXAM_LABELS[r.examType]},${r.billingStatus},${r.studentCount},${r.trialEndsAt ?? ''}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'subscriptions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">
      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="superadmin-subscription"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>

        {/* Page-specific header — breadcrumb + institute search */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 gap-4 border-b border-brand-line bg-white sticky top-0 z-30 shrink-0">
          <div>
            <p className="font-jetbrains text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text-mute">Platform</p>
            <h1 className="font-manrope text-sm font-black tracking-tight -mt-0.5">Subscriptions</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="p-2 rounded-xl text-brand-text-mute hover:text-brand-teal-600 hover:bg-brand-bg-alt transition-colors" title="Refresh">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold leading-none">{displayName}</p>
              <p className="font-jetbrains text-[9px] font-semibold tracking-[0.1em] uppercase text-brand-text-mute mt-0.5">Super Admin</p>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 max-w-[1500px] mx-auto pb-16">

          {/* Dark insights hero */}
          <div className="rounded-2xl bg-brand-ink text-white p-5 sm:p-6">
            <div className="flex flex-col xl:flex-row xl:items-start gap-6">
              <div className="flex-1 min-w-0">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">
                  — Across all institutes
                </p>
                <h2 className="font-manrope text-xl sm:text-2xl font-black tracking-tight">
                  {summary.trial} of {summary.total} subscriptions are still on trial
                </h2>
                <p className="text-sm text-white/60 mt-1.5 max-w-xl">
                  {soonestTrialDays !== null
                    ? `The first trial expires in ${soonestTrialDays} days. Nothing converts on its own — an expired trial silently locks the institute out.`
                    : 'No trials are currently running.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 max-w-lg">
                  {metrics.map(m => (
                    <div key={m.label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                      <p className="font-jetbrains text-[9px] font-bold uppercase tracking-wider text-white/40">{m.label}</p>
                      <p className="text-2xl font-black tabular-nums mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="xl:w-[380px] shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Trials ending</p>
                  {seatsAtRisk > 0 && (
                    <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
                      {seatsAtRisk} seats at risk
                    </p>
                  )}
                </div>
                <div className="space-y-2.5 bg-white/5 rounded-xl p-3 border border-white/10">
                  {trialRows.length === 0 && (
                    <p className="text-xs text-white/40 py-2 text-center">No trials ending.</p>
                  )}
                  {trialRows.slice(0, 3).map(r => {
                    const d = daysLeft(r.trialEndsAt);
                    return (
                      <div key={r.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="min-w-0">
                            <p className="font-bold truncate">{r.instituteName}</p>
                            <p className="text-white/40 text-[11px]">{EXAM_LABELS[r.examType]} · {r.studentCount} seats</p>
                          </div>
                          <span className={cn(
                            'text-[10px] font-black shrink-0 ml-2',
                            d !== null && d <= 5 ? 'text-rose-400' : d !== null && d <= 20 ? 'text-amber-400' : 'text-emerald-400'
                          )}>
                            {d !== null ? `${d}d left` : '—'}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', urgencyColor(d))}
                            style={{ width: `${d !== null ? Math.min(Math.max((d / 30) * 100, 6), 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {seatsAtRisk > 0 && (
                  <p className="text-[11px] text-white/40 mt-2">
                    {seatsAtRisk} student seats sit behind trials that expire within a month. Convert or extend before the dates above.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Filter tabs + search + export */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="bg-white rounded-xl border border-brand-line shadow-sm p-1 flex gap-1 w-fit">
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    'flex items-center gap-2 min-h-[38px] px-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap',
                    statusFilter === tab.id ? 'bg-brand-teal-600 text-white' : 'text-brand-text-mute hover:text-brand-text hover:bg-brand-bg-alt'
                  )}
                >
                  {tab.label}
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', statusFilter === tab.id ? 'bg-white/20' : 'bg-brand-bg-alt')}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-mute" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search institutes…"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/30 text-brand-text placeholder:text-brand-text-mute"
                />
              </div>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-2 min-h-[38px] px-3 rounded-xl border border-brand-line bg-white text-sm font-semibold hover:bg-brand-bg-alt"
              >
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>

          {/* Main grid: table + right rail */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden min-w-0">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-brand-text-mute text-sm">
                  {debouncedSearch ? `No subscriptions matching "${debouncedSearch}"` : 'No subscriptions yet. Create an institute with exams to get started.'}
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[720px]">
                    <thead>
                      <tr className="border-b border-brand-line">
                        <th className="font-jetbrains px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap">Institute</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap">Exam</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap">Status</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap hidden md:table-cell">Students</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap hidden lg:table-cell">Trial ends</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute text-right pr-5 whitespace-nowrap">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {rows.map((row) => {
                        const d = daysLeft(row.trialEndsAt);
                        return (
                          <tr key={row.id} className="hover:bg-brand-bg-alt transition-colors group">
                            <td className="px-5 py-4">
                              <span className="font-semibold text-[13.5px] text-brand-text block">{row.instituteName}</span>
                              <span className="text-[11px] text-brand-text-mute">{formatSince(row.createdAt)}</span>
                              {!row.instituteActive && (
                                <span className="font-jetbrains ml-2 text-[9px] font-bold text-rose-600">INACTIVE</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-brand-text">{EXAM_LABELS[row.examType]}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`font-jetbrains inline-block px-2 py-1 text-[10px] font-bold tracking-wider rounded ${STATUS_PILL[row.billingStatus]}`}>
                                {row.billingStatus.charAt(0) + row.billingStatus.slice(1).toLowerCase()}
                              </span>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span className="text-sm font-medium text-brand-text">{row.studentCount}</span>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              {row.trialEndsAt ? (
                                <div className="w-24">
                                  <span className="text-sm text-brand-text-mute whitespace-nowrap">{formatDate(row.trialEndsAt)}</span>
                                  <div className="h-1 rounded-full bg-brand-bg-alt overflow-hidden mt-1">
                                    <div className={cn('h-full rounded-full', urgencyColor(d))} style={{ width: `${d !== null ? Math.min(Math.max((d / 30) * 100, 6), 100) : 0}%` }} />
                                  </div>
                                </div>
                              ) : <span className="text-sm text-brand-text-mute">—</span>}
                            </td>
                            <td className="px-4 py-4 text-right pr-5">
                              <div className="inline-flex items-center gap-2">
                                {savingId === row.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-teal-500" />}
                                <div className="relative">
                                  <select
                                    value={row.billingStatus}
                                    disabled={savingId === row.id}
                                    onChange={(e) => handleStatusChange(row, e.target.value as BillingStatus)}
                                    className={cn(
                                      'appearance-none pl-2.5 pr-6 py-1.5 text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 disabled:opacity-50 cursor-pointer',
                                      SELECT_PILL[row.billingStatus]
                                    )}
                                  >
                                    {BILLING_STATUSES.map((s) => (
                                      <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right rail */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-brand-line p-4">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">Needs your attention</p>
                <p className="text-sm text-brand-text leading-snug">
                  {summary.trial > 0
                    ? `${summary.trial} trials are running with ${seatsAtRisk} seats behind them, and the earliest ends in ${soonestTrialDays} days. None have been converted yet.`
                    : 'No trials are currently at risk.'}
                </p>
                <div className="mt-3 space-y-1.5">
                  <button
                    onClick={() => setStatusFilter('TRIAL')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-brand-bg-alt hover:bg-brand-bg-alt/70 text-left transition-colors"
                  >
                    <span className="text-xs font-semibold text-brand-text">Convert expiring trials</span>
                    <span className="text-xs font-black text-brand-teal-600 tabular-nums">{summary.trial} →</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-brand-bg-alt hover:bg-brand-bg-alt/70 text-left transition-colors"
                  >
                    <span className="text-xs font-semibold text-brand-text">Institutes with no paid plan</span>
                    <span className="text-xs font-black text-brand-teal-600 tabular-nums">{institutesWithNoPaidPlan} →</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-brand-line p-4">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-1">Seats under subscription</p>
                <p className="text-3xl font-black tabular-nums text-brand-text">{seatsTotal}</p>
                <p className="text-[11px] text-brand-text-mute mb-3">across {instituteCount} institute{instituteCount === 1 ? '' : 's'}</p>
                <div className="flex h-2.5 rounded-full overflow-hidden">
                  {seatsActive > 0 && <div className="bg-emerald-500" style={{ width: `${(seatsActive / (seatsTotal || 1)) * 100}%` }} />}
                  {seatsTrial > 0 && <div className="bg-amber-500" style={{ width: `${(seatsTrial / (seatsTotal || 1)) * 100}%` }} />}
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="flex items-center gap-1.5 text-brand-text-mute"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> On a paid plan</span>
                  <span className="font-bold text-brand-text tabular-nums">{seatsActive}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-brand-text-mute"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> On trial</span>
                  <span className="font-bold text-brand-text tabular-nums">{seatsTrial}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-brand-line p-4">
                <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-3">By exam</p>
                <div className="space-y-3">
                  {byExam.map(e => (
                    <div key={e.examType}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-brand-text">{EXAM_LABELS[e.examType as keyof typeof EXAM_LABELS] ?? e.examType}</span>
                        <span className="font-black tabular-nums text-brand-text">{e.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-brand-bg-alt overflow-hidden">
                        <div className="h-full rounded-full bg-brand-teal-500" style={{ width: `${(e.total / maxByExam) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-brand-text-mute mt-1">{e.active} active · {e.trial} on trial</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
