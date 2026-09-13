"use client";
// Spoken English — Recommendations. Unlike the IELTS SuggestionsPage (a static mock), this
// consumes the real recommendation engine: GET /api/student/recommendations returns SE videos
// grouped by the 6 CEFR sub-skills at the student's current level per sub-skill. Routed via
// RecommendationsDispatch so IELTS keeps its own page untouched.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, PlayCircle, Clock, ExternalLink, Filter, Lightbulb, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { getBackendUrl } from "@/shared/utils";
import { StudentLayout } from "@/features/student/components/StudentLayout";
import { SE_SUBSKILLS } from "@/features/student/config/spokenEnglishSubskills";
import { cefrColor, cefrBg } from "@/features/student/config/cefrDisplay";

interface RecItem {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  thumbnail_url?: string | null;
  source?: string | null;
  duration_min?: number | null;
  level?: string;
}
type RecData = Record<string, RecItem[]>;

const LEVEL_LABEL: Record<string, string> = { BEGINNER: "A · Beginner", INTERMEDIATE: "B · Intermediate", ADVANCED: "C · Advanced" };
const levelToCefr = (lvl?: string) => (lvl === "ADVANCED" ? "c1" : lvl === "INTERMEDIATE" ? "b1" : "a2");

export default function SpokenEnglishRecommendationsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const examId = profile?.examId ?? "spoken_english";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<RecData>({});
  const [levels, setLevels] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend(`${getBackendUrl()}/api/student/recommendations?limit=12`);
        if (cancelled) return;
        if (res?.success) {
          setData((res.data ?? {}) as RecData);
          setLevels((res.levels ?? {}) as Record<string, string>);
        } else setError(true);
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalCount = useMemo(() => Object.values(data).reduce((n, arr) => n + (arr?.length ?? 0), 0), [data]);
  const visibleSubskills = SE_SUBSKILLS.filter((s) => (filter === "all" || filter === s.id) && (data[s.id]?.length ?? 0) > 0);

  return (
    <StudentLayout activeTab="suggestion" mainClassName="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-brand-ink-deep p-6 sm:p-8 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-teal-500/20 blur-2xl" />
          <div className="relative mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Sparkles className="h-5 w-5 text-brand-mint" /></div>
            <div>
              <p className="font-jetbrains text-[10.5px] uppercase tracking-[0.18em] text-brand-mint">Recommendations</p>
              <h1 className="font-dm text-2xl font-bold leading-tight">Handpicked for your level</h1>
            </div>
          </div>
          <p className="relative max-w-lg text-sm leading-[1.6] text-brand-on-ink-mute">
            Curated videos for each of your six speaking sub-skills, matched to your current CEFR level. Watch, then put it into practice in your daily drills.
          </p>
        </section>

        {/* Filter */}
        {!loading && !error && totalCount > 0 && (
          <div className="rounded-2xl border border-brand-line bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-text-mute"><Filter className="h-3.5 w-3.5" /> Sub-skill</span>
              <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
              {SE_SUBSKILLS.filter((s) => (data[s.id]?.length ?? 0) > 0).map((s) => (
                <FilterChip key={s.id} label={s.label} active={filter === s.id} onClick={() => setFilter(s.id)} />
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-brand-text-mute"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading recommendations…</span></div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-brand-text-mute"><AlertCircle className="h-8 w-8 text-rose-400" /><p className="text-sm font-semibold">Couldn't load recommendations</p></div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-brand-line bg-white/60 px-4 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-bg-alt"><Lightbulb className="h-6 w-6 text-brand-text-mute opacity-70" /></div>
            <p className="font-semibold text-brand-text">Recommendations are on their way</p>
            <p className="mt-1 max-w-xs text-sm text-brand-text-mute">Curated speaking videos for your cohort are being prepared. Keep drilling in the meantime.</p>
            <button onClick={() => navigate(`/${examId}/dashboard`)} className="mt-5 rounded-xl bg-brand-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-teal-700">Back to dashboard</button>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleSubskills.map((cfg) => {
              const items = data[cfg.id] ?? [];
              const lvl = levels[cfg.id];
              return (
                <section key={cfg.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-px w-6 shrink-0 bg-brand-teal-600" aria-hidden="true" />
                      <h2 className="font-dm text-base font-bold text-brand-text">{cfg.label}</h2>
                    </div>
                    {lvl && <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cefrBg(levelToCefr(lvl))} ${cefrColor(levelToCefr(lvl))}`}>{LEVEL_LABEL[lvl] ?? lvl}</span>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((it) => <RecCard key={it.id} item={it} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

const RecCard = ({ item }: { item: RecItem }) => (
  <a href={item.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm transition-all hover:border-brand-teal-300 hover:shadow-md">
    <div className="relative aspect-video w-full overflow-hidden bg-brand-ink-deep">
      {item.thumbnail_url ? (
        <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
      ) : (
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #3EE0A0 1px, transparent 1px), linear-gradient(to bottom, #3EE0A0 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.08 }} />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <PlayCircle className="h-11 w-11 text-white/90 drop-shadow transition-transform group-hover:scale-110" />
      </div>
    </div>
    <div className="flex flex-1 flex-col p-4">
      <p className="line-clamp-2 font-semibold leading-snug text-brand-text">{item.title}</p>
      {item.description && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-brand-text-mute">{item.description}</p>}
      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-brand-text-mute">
        <span className="flex items-center gap-3">
          {item.source && <span className="truncate font-medium">{item.source}</span>}
          {item.duration_min ? <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.duration_min} min</span> : null}
        </span>
        <span className="flex items-center gap-1 font-semibold text-brand-teal-700">Watch <ExternalLink className="h-3.5 w-3.5" /></span>
      </div>
    </div>
  </a>
);

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${active ? "border-brand-teal-600 bg-brand-teal-600 text-white shadow-sm" : "border-brand-line bg-brand-bg-alt text-brand-text-mute hover:border-brand-teal-300 hover:text-brand-teal-600"}`}>{label}</button>
);
