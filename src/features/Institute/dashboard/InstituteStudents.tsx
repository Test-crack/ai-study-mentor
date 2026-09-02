// src/features/Institute/dashboard/InstituteStudents.tsx
// Students — fully data-driven table (replaces the 16-fake-students mock).
// Source: GET /students-overview (owner handler reused on admin routes):
// band, trend, streak, momentum, at-risk flags per student.
// Row click → the student's full progress page (admin route).
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Users, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Flame, Zap, UserPlus, ChevronRight,
} from "lucide-react";
import { InstituteAdminLayout } from "../components/InstituteAdminLayout";
import {
  KpiCard, StatusBadge, BandPill, TableSkeleton, EmptyState, ErrorBanner, SectionCard, PageHero, HeroAction,
} from "../components/shared/primitives";
import { fetchStudentsOverview } from "../services/instituteAdminService";
import type { StudentRow } from "@/features/InstituteOwner/services/instituteOwnerService";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select";

type RiskFilter = "all" | "at-risk" | "on-track";

function TrendIcon({ trend }: { trend: StudentRow["band_trend"] }) {
  if (trend === "up")   return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-rose-500" />;
  if (trend === "flat") return <Minus className="h-4 w-4 text-brand-text-mute" />;
  return null;
}

const PAGE_SIZE = 15;

export default function InstituteStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchStudentsOverview();
      setStudents(res.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const batches = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach(s => { if (s.batch_id) map.set(s.batch_id, s.batch_name); });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s => {
      if (q && !s.name?.toLowerCase().includes(q)) return false;
      if (risk === "at-risk" && !s.is_at_risk) return false;
      if (risk === "on-track" && s.is_at_risk) return false;
      if (batchFilter !== "all" && s.batch_id !== batchFilter) return false;
      return true;
    });
  }, [students, search, risk, batchFilter]);

  useEffect(() => { setPage(0); }, [search, risk, batchFilter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const atRiskCount = students.filter(s => s.is_at_risk).length;
  const activeTodayCount = students.filter(s => s.drilled_today).length;
  const avgBand = (() => {
    const withBand = students.filter(s => s.current_band != null);
    if (!withBand.length) return null;
    return Math.round(withBand.reduce((sum, s) => sum + (s.current_band as number), 0) / withBand.length * 10) / 10;
  })();

  const openProgress = (s: StudentRow) => {
    const slug = (s.name ?? "student").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    navigate(`/institute-admin/students/${slug}/progress`, { state: { studentId: s.user_id } });
  };

  return (
    <InstituteAdminLayout activeTab="students">
      <PageHero
        eyebrow="Admin Portal"
        title="Students"
        subtitle="Live band, streak and risk status for every student."
        actions={
          <HeroAction onClick={() => navigate("/institute-admin/studentOnboarding")}>
            <UserPlus className="h-3.5 w-3.5" /> Onboard Student
          </HeroAction>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard label="Total Students" value={students.length} icon={Users} accent="indigo" />
            <KpiCard label="Active Today" value={activeTodayCount} icon={Flame} accent="emerald" />
            <KpiCard label="At Risk" value={atRiskCount} icon={AlertTriangle} accent={atRiskCount > 0 ? "rose" : "emerald"} />
            <KpiCard label="Average Band" value={avgBand ?? "—"} icon={Zap} accent="blue" />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-mute" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full pl-10 pr-4 py-2.5 min-h-[40px] bg-white border border-brand-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-sm font-medium text-brand-text placeholder:text-brand-text-mute"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "at-risk", "on-track"] as RiskFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setRisk(f)}
                  className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-colors ${
                    risk === f
                      ? "bg-brand-teal-600 text-white shadow-sm"
                      : "bg-white text-brand-text border border-brand-line hover:bg-brand-bg-alt"
                  }`}
                >
                  {f === "all" ? "All" : f === "at-risk" ? "At Risk" : "On Track"}
                </button>
              ))}
              {batches.length > 0 && (
                // Radix Select, not a native <select>: a native select's popup is
                // drawn by the browser at the width of its longest option and
                // ignores CSS, overflowing narrow mobile viewports. Radix renders
                // the panel in a portal with collision detection, so it stays on
                // screen and its width/positioning are CSS-controllable.
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                  <SelectTrigger
                    aria-label="Filter by batch"
                    className="px-3 py-2 min-h-[40px] w-auto rounded-xl text-xs font-bold bg-white text-brand-text border border-brand-line focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-w-[calc(100vw-2rem)]">
                    <SelectItem value="all">All batches</SelectItem>
                    {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <SectionCard title="Students" icon={Users}>
              <EmptyState
                title={search || risk !== "all" || batchFilter !== "all" ? "No students match these filters" : "No students yet"}
                hint={search || risk !== "all" || batchFilter !== "all" ? "Try widening the filters." : "Onboard your first students to see them here."}
              />
            </SectionCard>
          ) : (
            <div className="rounded-2xl bg-white border border-brand-line shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="font-jetbrains text-[10px] uppercase tracking-[0.12em] text-brand-text-mute bg-brand-bg-alt/80 border-b border-brand-line">
                      <th className="px-4 sm:px-5 py-3 font-bold whitespace-nowrap">Student</th>
                      <th className="px-4 py-3 font-bold whitespace-nowrap">Batch</th>
                      <th className="px-4 py-3 font-bold whitespace-nowrap">Band</th>
                      <th className="px-4 py-3 font-bold whitespace-nowrap">Target</th>
                      <th className="px-4 py-3 font-bold whitespace-nowrap">Streak</th>
                      <th className="px-4 py-3 font-bold whitespace-nowrap">Momentum</th>
                      <th className="px-4 py-3 font-bold whitespace-nowrap">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-line">
                    {paged.map((s) => (
                      <tr
                        key={s.student_id}
                        onClick={() => openProgress(s)}
                        className="hover:bg-brand-teal-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 sm:px-5 py-3">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src={s.avatar ?? ""} />
                              <AvatarFallback className="bg-brand-teal-100 text-brand-teal-700 text-xs font-bold">
                                {(s.name ?? "?").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-brand-text truncate">{s.name}</p>
                              {s.drilled_today && <p className="text-[11px] text-emerald-600 font-bold">active today</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-brand-text-mute whitespace-nowrap">{s.batch_name || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <BandPill band={s.current_band} />
                            <TrendIcon trend={s.band_trend} />
                          </div>
                        </td>
                        <td className="px-4 py-3"><BandPill band={s.target_band} /></td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-text tabular-nums">
                            <Flame className={`h-3.5 w-3.5 ${s.daily_streak > 0 ? "text-orange-500" : "text-brand-text-mute"}`} />
                            {s.daily_streak}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-text tabular-nums">
                            <Zap className="h-3.5 w-3.5 text-brand-teal-500" /> {s.momentum_score}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {s.is_at_risk
                            ? <StatusBadge tone="danger">{s.primary_flag ?? "At risk"}</StatusBadge>
                            : <StatusBadge tone="success">On track</StatusBadge>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="h-4 w-4 text-brand-text-mute inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <div className="px-4 sm:px-5 py-3 border-t border-brand-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-xs text-brand-text-mute font-medium">
                    {filtered.length} student{filtered.length !== 1 ? "s" : ""} · page {page + 1} of {pageCount}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold bg-brand-bg-alt text-brand-text disabled:opacity-40 hover:bg-brand-teal-100 hover:text-brand-teal-700 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                      disabled={page >= pageCount - 1}
                      className="px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold bg-brand-bg-alt text-brand-text disabled:opacity-40 hover:bg-brand-teal-100 hover:text-brand-teal-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </InstituteAdminLayout>
  );
}
