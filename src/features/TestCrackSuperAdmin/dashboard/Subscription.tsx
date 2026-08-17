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
  ACTIVE:    'text-emerald-700 bg-emerald-100 dark:text-[#10B981] dark:bg-[#10B981]/10',
  TRIAL:     'text-amber-700 bg-amber-100 dark:text-[#F59E0B] dark:bg-[#F59E0B]/10',
  CANCELLED: 'text-slate-500 bg-slate-200 dark:text-slate-400 dark:bg-slate-700/40',
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
    { label: 'Total Subscriptions', value: summary.total, tone: 'text-slate-900 dark:text-white' },
    { label: 'Active', value: summary.active, tone: 'text-emerald-600 dark:text-[#10B981]' },
    { label: 'On Trial', value: summary.trial, tone: 'text-amber-600 dark:text-[#F59E0B]' },
    { label: 'Cancelled', value: summary.cancelled, tone: 'text-slate-500 dark:text-slate-400' },
  ];

  const filterTabs: StatusFilter[] = ['ALL', 'TRIAL', 'ACTIVE', 'CANCELLED'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">

      <div className="hidden lg:block">
        <SuperAdminSidebar
          activeTab="superadmin-subscription"
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <SuperAdminTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscriptions</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Exam subscriptions across all institutes</p>
              </div>
              <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-brand-teal-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl p-5 shadow-sm transition-colors">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{m.label}</p>
                  <h3 className={`text-2xl font-bold ${m.tone}`}>{m.value}</h3>
                </div>
              ))}
            </div>

            {/* Search + status filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search institutes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-transparent border border-slate-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:border-brand-teal-500 transition-all dark:text-white placeholder-slate-400 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      statusFilter === tab
                        ? 'bg-white dark:bg-[#15141B] text-brand-teal-700 dark:text-brand-teal-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-teal-500" />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-gray-500 text-sm">
                  {debouncedSearch ? `No subscriptions matching "${debouncedSearch}"` : 'No subscriptions yet. Create an institute with exams to get started.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[820px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#26252D] bg-slate-50/70 dark:bg-white/[0.02] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3">Institute</th>
                        <th className="px-4 py-3">Exam</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Students</th>
                        <th className="px-4 py-3">Trial Ends</th>
                        <th className="px-4 py-3 text-right pr-5">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#26252D]">
                      {rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-semibold text-[13.5px] text-slate-900 dark:text-gray-100">{row.instituteName}</span>
                            {!row.instituteActive && (
                              <span className="ml-2 text-[9px] font-bold text-rose-600 dark:text-rose-400">INSTITUTE INACTIVE</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{EXAM_LABELS[row.examType]}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded ${STATUS_PILL[row.billingStatus]}`}>
                              {row.billingStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-medium text-slate-900 dark:text-gray-200">{row.studentCount}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(row.trialEndsAt)}</span>
                          </td>
                          <td className="px-4 py-4 text-right pr-5">
                            <div className="inline-flex items-center gap-2">
                              {savingId === row.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-teal-500" />}
                              <select
                                value={row.billingStatus}
                                disabled={savingId === row.id}
                                onChange={(e) => handleStatusChange(row, e.target.value as BillingStatus)}
                                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#26252D] bg-white dark:bg-[#0A0A0B] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-teal-500 disabled:opacity-50 cursor-pointer"
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
