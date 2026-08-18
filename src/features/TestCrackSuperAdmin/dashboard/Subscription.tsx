import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { SuperAdminTopbar } from '../Components/Superadmintopbar';
import { SuperAdminSidebar } from '../Components/SuperadminSidebar';
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

type StatusFilter = 'ALL' | BillingStatus;

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

export default function Subscription() {
  const { toast } = useToast();
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

  const metrics = [
    { label: 'Total Subscriptions', value: summary.total, tone: 'text-brand-text' },
    { label: 'Active', value: summary.active, tone: 'text-emerald-600' },
    { label: 'On Trial', value: summary.trial, tone: 'text-amber-600' },
    { label: 'Cancelled', value: summary.cancelled, tone: 'text-brand-text-mute' },
  ];

  const filterTabs: StatusFilter[] = ['ALL', 'TRIAL', 'ACTIVE', 'CANCELLED'];

  return (
    <div className="relative min-h-screen font-plex antialiased overflow-x-hidden bg-brand-bg text-brand-text">

      {/* Sidebar */}
      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="superadmin-subscription"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

        {/* Topbar */}
        <SuperAdminTopbar />

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 max-w-[90rem] mx-auto pb-16">
          <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-manrope font-bold text-brand-text">Subscriptions</h1>
                <p className="text-sm text-brand-text-mute mt-1">Exam subscriptions across all institutes</p>
              </div>
              <button onClick={load} className="p-2 rounded-lg text-brand-text-mute hover:text-brand-teal-600 hover:bg-brand-bg-alt transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm">
                  <p className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute mb-2">{m.label}</p>
                  <h3 className={`text-2xl font-bold ${m.tone}`}>{m.value}</h3>
                </div>
              ))}
            </div>

            {/* Search + status filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-brand-text-mute" />
                </div>
                <input
                  type="text"
                  placeholder="Search institutes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-brand-bg-alt border border-brand-line rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-brand-text placeholder:text-brand-text-mute"
                />
              </div>
              <div className="flex items-center gap-1 bg-brand-bg-alt rounded-lg p-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                      statusFilter === tab
                        ? 'bg-white text-brand-teal-700 shadow-sm'
                        : 'text-brand-text-mute hover:text-brand-text'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden">
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
                  <table className="w-full text-left border-collapse min-w-[820px]">
                    <thead>
                      <tr className="border-b border-brand-line bg-brand-bg-alt">
                        <th className="font-jetbrains px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap">Institute</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap">Exam</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute text-center whitespace-nowrap">Status</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute text-center whitespace-nowrap hidden md:table-cell">Students</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute whitespace-nowrap hidden lg:table-cell">Trial Ends</th>
                        <th className="font-jetbrains px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute text-right pr-5 whitespace-nowrap">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-line">
                      {rows.map((row) => (
                        <tr key={row.id} className="hover:bg-brand-bg-alt transition-colors group">
                          <td className="px-5 py-4">
                            <span className="font-semibold text-[13.5px] text-brand-text">{row.instituteName}</span>
                            {!row.instituteActive && (
                              <span className="font-jetbrains ml-2 text-[9px] font-bold text-rose-600">INSTITUTE INACTIVE</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-brand-text">{EXAM_LABELS[row.examType]}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-jetbrains inline-block px-2 py-1 text-[10px] font-bold tracking-wider rounded ${STATUS_PILL[row.billingStatus]}`}>
                              {row.billingStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center hidden md:table-cell">
                            <span className="text-sm font-medium text-brand-text">{row.studentCount}</span>
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <span className="text-sm text-brand-text-mute whitespace-nowrap">{formatDate(row.trialEndsAt)}</span>
                          </td>
                          <td className="px-4 py-4 text-right pr-5">
                            <div className="inline-flex items-center gap-2">
                              {savingId === row.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-teal-500" />}
                              <select
                                value={row.billingStatus}
                                disabled={savingId === row.id}
                                onChange={(e) => handleStatusChange(row, e.target.value as BillingStatus)}
                                className="px-2.5 py-2 text-xs font-bold rounded-lg border border-brand-line bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 disabled:opacity-50 cursor-pointer"
                              >
                                {BILLING_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
