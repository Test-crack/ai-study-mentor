import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, Play, Pause, ArrowLeft, ArrowRight,
  BrainCircuit, Briefcase, BookOpen,
  Clock, Loader2, AlertCircle, Settings,
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Trophy, Brain, Target, RefreshCcw, Sparkles, Activity, Hash
} from 'lucide-react';

import { StudentSidebar } from "./dashboard/StudentSidebar";
import { StudentTopbar } from "./dashboard/StudentTopbar";
import { PremiumModal } from "@/features/payment/components/PremiumModal";

import {
  fetchSpeedReadingReports,
  fetchSpeedReadingReportById,
  submitSpeedReadingSession,
  SpeedReadingReportSummary,
  SpeedReadingReport,
  SpeedReadingQuestion,
  SessionEvaluation,
} from '../services/speedReadingService';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  tech:       { label: 'Tech & VC',         icon: <BrainCircuit size={15} className="mr-1.5" /> },
  business:   { label: 'Business Strategy', icon: <Briefcase size={15} className="mr-1.5" /> },
  literature: { label: 'Literature',        icon: <BookOpen size={15} className="mr-1.5" /> },
};
function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, icon: <BookOpen size={15} className="mr-1.5" /> };
}
function getCategories(r: SpeedReadingReportSummary[]) {
  const seen = new Set<string>();
  return r.map(x => x.category).filter(c => { if (seen.has(c)) return false; seen.add(c); return true; });
}

// ORP pivot word renderer
function renderWord(word: string) {
  if (!word) return null;
  const pivot = Math.max(0, Math.ceil(word.length * 0.35) - 1);
  return (
    <div className="flex items-center text-4xl md:text-6xl font-medium tracking-wide">
      <span className="text-slate-400 dark:text-gray-300 text-right w-[150px] md:w-[250px]">{word.substring(0, pivot)}</span>
      <span className="text-red-500 w-[20px] md:w-[30px] text-center">{word.substring(pivot, pivot + 1)}</span>
      <span className="text-slate-400 dark:text-gray-300 text-left w-[150px] md:w-[250px]">{word.substring(pivot + 1)}</span>
    </div>
  );
}

// Small stat card used in reader footers and analysis
const StatCard = ({ value, label, color = 'text-purple-600 dark:text-purple-400' }: {
  value: React.ReactNode; label: string; color?: string;
}) => (
  <div className="bg-white dark:bg-[#121118] rounded-xl p-4 shadow-sm border border-slate-100 dark:border-gray-800 text-center">
    <div className={`text-2xl font-bold mb-0.5 ${color}`}>{value}</div>
    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">{label}</div>
  </div>
);

type View = 'dashboard' | 'reader' | 'quiz' | 'analysis';

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SpeedReading() {
  const [activeTab, setActiveTab]               = useState("speed-reading");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Listing
  const [reports, setReports]               = useState<SpeedReadingReportSummary[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError]     = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('');

  // Reader
  const [view, setView]       = useState<View>('dashboard');
  const [wpm, setWpm]         = useState(400);
  const [words, setWords]     = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const startRef = useRef<number>(0);

  // Report selection
  const [fullReport, setFullReport]       = useState<SpeedReadingReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selected, setSelected]           = useState<SpeedReadingReportSummary | null>(null);
  const [repIdx, setRepIdx]               = useState(0);
  const [showSettings, setShowSettings]   = useState(false);

  // Quiz
  const [quizIdx, setQuizIdx]       = useState(0);
  const [answers, setAnswers]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Analysis (from backend)
  const [evaluation, setEvaluation] = useState<SessionEvaluation | null>(null);

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let gone = false;
    setLoadingReports(true);
    fetchSpeedReadingReports()
      .then(d => { if (!gone) { setReports(d); if (d.length) setActiveCategory(d[0].category); } })
      .catch(() => { if (!gone) setReportsError('Failed to load reports. Please try again.'); })
      .finally(() => { if (!gone) setLoadingReports(false); });
    return () => { gone = true; };
  }, []);

  useEffect(() => { setRepIdx(0); }, [activeCategory]);

  useEffect(() => {
    const inCat = reports.filter(r => r.category === activeCategory);
    setSelected(inCat[repIdx] ?? null);
  }, [repIdx, activeCategory, reports]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (isPlaying && !isFinished) {
      t = setInterval(() => {
        setWordIdx(p => {
          if (p >= words.length - 1) { setIsPlaying(false); setIsFinished(true); return p; }
          return p + 1;
        });
      }, 60000 / wpm);
    }
    return () => clearInterval(t);
  }, [isPlaying, wpm, words.length, isFinished]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleStartReading = async (rep?: SpeedReadingReportSummary) => {
    const target = rep ?? selected;
    if (!target) return;
    setLoadingReport(true);
    try {
      const r = await fetchSpeedReadingReportById(target.id);
      setFullReport(r);
      setWords(r.text.trim().split(/\s+/));
      setWordIdx(0); setIsFinished(false);
      setView('reader');
      startRef.current = Date.now();
      setTimeout(() => setIsPlaying(true), 500);
    } catch { /* silent */ }
    finally { setLoadingReport(false); }
  };

  const handleGoToQuiz = () => { setQuizIdx(0); setAnswers({}); setView('quiz'); };

  const handleSubmitQuiz = async () => {
    if (!fullReport) return;
    const qs = (fullReport.questions ?? []) as SpeedReadingQuestion[];
    const readingTimeSeconds = Math.round((Date.now() - startRef.current) / 1000);
    setSubmitting(true);
    try {
      const result = await submitSpeedReadingSession({
        reportId: fullReport.id,
        readingTimeSeconds,
        wpm,
        answers: qs.map(q => ({ questionId: q.id, selectedOption: answers[q.id] ?? '' })),
      });
      setEvaluation(result);
      setView('analysis');
    } catch (err) {
      console.error('Submit failed:', err);
      // Fallback: compute locally so user isn't stuck
      const correct = qs.filter(q => answers[q.id] === q.answer).length;
      const ret = qs.length ? Math.round((correct / qs.length) * 100) : 0;
      setEvaluation({
        retentionScore: ret, wpm, readingTimeSeconds, correct,
        total: qs.length,
        grade: ret >= 80 ? 'A' : ret >= 60 ? 'B' : ret >= 50 ? 'C' : 'F',
        speedCategory: wpm >= 550 ? 'Advanced' : wpm >= 400 ? 'Proficient' : 'Developing',
        speedScore: Math.round((wpm - 200) / 6),
        efficiencyScore: Math.round(ret * 0.6 + ((wpm - 200) / 6) * 0.4),
        feedback: ['Results computed offline — check your connection.'],
        idealWpmSuggestion: ret >= 70 ? Math.min(wpm + 50, 800) : Math.max(wpm - 50, 200),
        scoredAnswers: qs.map(q => ({
          questionId: q.id, type: q.type, stem: q.stem, options: q.options,
          correctAnswer: q.answer, userAnswer: answers[q.id] ?? '',
          isCorrect: answers[q.id] === q.answer, explanation: q.explanation ?? null,
        })),
      });
      setView('analysis');
    } finally { setSubmitting(false); }
  };

  const handleBack = () => {
    setIsPlaying(false); setView('dashboard');
    setFullReport(null); setWords([]); setWordIdx(0); setIsFinished(false); setEvaluation(null);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const pct = words.length > 0 ? ((wordIdx + (isFinished ? 1 : 0)) / words.length) * 100 : 0;
  const cats = getCategories(reports);
  const qs = (fullReport?.questions ?? []) as SpeedReadingQuestion[];
  const curQ = qs[quizIdx] as SpeedReadingQuestion | undefined;
  const allAnswered = qs.length > 0 && qs.every(q => answers[q.id]);
  const hasQuiz = qs.length > 0;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar activeTab={activeTab} onTabChange={setActiveTab} isCollapsed={isSidebarCollapsed} toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <StudentTopbar onUpgradeClick={() => setShowPremiumModal(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-start">
          <div className="w-full max-w-5xl">

            {/* ════════════════════ DASHBOARD ══════════════════════════════════ */}
            {view === 'dashboard' && (
              <div className="w-full mt-4 bg-white dark:bg-[#121118] text-slate-900 dark:text-white border border-slate-200 dark:border-gray-800 rounded-2xl p-8 relative overflow-hidden shadow-sm dark:shadow-xl transition-colors duration-300">
                <Zap className="absolute -top-10 -right-10 text-purple-500/10 dark:text-purple-900/20" size={240} strokeWidth={1} />
                <div className="relative z-10">
                  <div className="inline-flex items-center space-x-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-semibold mb-6">
                    <Sparkles size={13} /><span>RSVP • Speed Reading</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                    Read a Full Report in<br />
                    <span className="text-purple-600 dark:text-purple-400">15 Minutes</span> with 90% Retention
                  </h1>
                  <p className="text-slate-500 dark:text-gray-400 max-w-2xl mb-8 text-sm md:text-base leading-relaxed">
                    Rapid Serial Visual Presentation flashes words at <strong className="text-slate-800 dark:text-gray-200">200–800 WPM</strong> calibrated to your comprehension. Finish with a quiz to measure retention.
                  </p>

                  {loadingReports && (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-gray-400 mb-6">
                      <Loader2 size={17} className="animate-spin" /><span className="text-sm">Loading reports…</span>
                    </div>
                  )}
                  {reportsError && (
                    <div className="flex items-center gap-3 text-red-500 mb-6 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
                      <AlertCircle size={17} /><span className="text-sm">{reportsError}</span>
                    </div>
                  )}

                  {!loadingReports && !reportsError && (
                    <>
                      {/* Category tabs */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {cats.map(cat => {
                          const m = getCategoryMeta(cat);
                          return (
                            <button key={cat} onClick={() => setActiveCategory(cat)}
                              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeCategory === cat ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800'}`}
                            >{m.icon}{m.label}</button>
                          );
                        })}
                      </div>

                      {/* Report card */}
                      {selected && (() => {
                        const inCat = reports.filter(r => r.category === activeCategory);
                        const estMin = Math.max(1, Math.ceil(selected.wordCount / wpm));
                        return (
                          <div className="mb-8 w-full max-w-md">
                            <div className="bg-slate-50 dark:bg-[#1C1A24] border border-slate-200 dark:border-gray-700/50 rounded-xl p-5 transition-colors">
                              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1 tracking-wider uppercase">{selected.source}</p>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 leading-snug">{selected.title}</h3>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500 dark:text-gray-500 flex items-center gap-3">
                                  <span className="flex items-center gap-1"><Hash size={11} /> {selected.wordCount} words</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Clock size={11} /> ~{estMin} min at {wpm} WPM</span>
                                </p>
                                {inCat.length > 1 && (
                                  <div className="flex items-center gap-0.5">
                                    <button onClick={() => setRepIdx(i => (i - 1 + inCat.length) % inCat.length)} className="p-1 rounded text-slate-400 hover:text-purple-600 transition-colors"><ChevronLeft size={15} /></button>
                                    <span className="text-xs text-slate-400 min-w-[28px] text-center">{repIdx + 1}/{inCat.length}</span>
                                    <button onClick={() => setRepIdx(i => (i + 1) % inCat.length)} className="p-1 rounded text-slate-400 hover:text-purple-600 transition-colors"><ChevronRight size={15} /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <button onClick={() => handleStartReading()} disabled={loadingReport || !selected}
                          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md w-full sm:w-auto">
                          {loadingReport ? <Loader2 size={17} className="animate-spin" /> : <Play size={17} fill="currentColor" />}
                          Start Speed Reading
                        </button>
                        <button onClick={() => setShowSettings(!showSettings)}
                          className="flex items-center justify-center gap-2 bg-white dark:bg-[#1C1A24] hover:bg-slate-50 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto">
                          <Settings size={17} /><span>Settings</span>
                        </button>
                      </div>

                      {showSettings && (
                        <div className="mt-4 p-5 bg-slate-50 dark:bg-[#1C1A24] border border-slate-200 dark:border-gray-700 rounded-xl max-w-md shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Reading Speed (WPM)</span>
                            <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">{wpm} WPM</span>
                          </div>
                          <input type="range" min="200" max="800" step="25" value={wpm} onChange={e => setWpm(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                          <div className="flex justify-between text-xs text-slate-400 mt-2">
                            <span>200</span><span>500</span><span>800</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════ READER ═════════════════════════════════════ */}
            {view === 'reader' && fullReport && (
              <div className="w-full flex flex-col h-[80vh] min-h-[600px] justify-between text-slate-900 dark:text-white">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 p-4 rounded-xl shadow-sm transition-colors">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800 dark:text-white">{fullReport.title}</h2>
                    <p className="text-xs text-slate-400 dark:text-gray-500">{fullReport.source}</p>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                      <span className="text-xs text-slate-400 font-semibold tracking-wider hidden sm:block">SPEED</span>
                      <input type="range" min="200" max="800" step="25" value={wpm} onChange={e => setWpm(Number(e.target.value))}
                        className="w-24 h-1 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white w-14 text-right">{wpm} WPM</span>
                    </div>
                    <button onClick={handleBack} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-white text-sm font-medium transition-colors">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button onClick={() => setIsPlaying(!isPlaying)} disabled={isFinished}
                      className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${isPlaying ? 'bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-white' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'}`}>
                      {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                      {isPlaying ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </div>

                {/* RSVP */}
                <div className="flex-1 my-4 bg-white dark:bg-[#0B0A0F] border border-slate-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                  {isFinished ? (
                    <div className="text-center px-6 space-y-4 animate-in zoom-in-95 duration-500">
                      <div className="inline-block px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-semibold tracking-wide">Reading Complete ✓</div>
                      <div>
                        <span className="text-5xl font-bold text-slate-800 dark:text-white">{words.length}</span>
                        <span className="text-xl font-medium text-purple-500 ml-2">words</span>
                      </div>
                      <p className="text-sm text-slate-500">at <span className="font-bold text-slate-700 dark:text-gray-300">{wpm} WPM</span></p>
                      {hasQuiz ? (
                        <button onClick={handleGoToQuiz}
                          className="flex items-center gap-2 mx-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md">
                          <Brain size={17} /> Take Comprehension Quiz <ArrowRight size={17} />
                        </button>
                      ) : (
                        <button onClick={handleBack} className="flex items-center gap-2 mx-auto bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-slate-700 dark:text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
                          <ArrowLeft size={17} /> Back to Reports
                        </button>
                      )}
                    </div>
                  ) : renderWord(words[wordIdx])}
                </div>

                {/* Footer stats */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-14">Progress</span>
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 transition-all duration-150 ease-linear" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-20 text-right">{wordIdx + (isFinished ? 1 : 0)}/{words.length}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard value={wpm} label="WPM" />
                    <StatCard value={wordIdx + (isFinished ? 1 : 0)} label="Words Read" color="text-green-500" />
                    <StatCard value={`~${Math.max(1, Math.ceil(fullReport.wordCount / wpm))} min`} label="Est. Duration" color="text-blue-500" />
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════ QUIZ ═══════════════════════════════════════ */}
            {view === 'quiz' && fullReport && curQ && (
              <div className="w-full mt-4 max-w-3xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 p-4 rounded-xl shadow-sm transition-colors">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-1.5">
                      <Brain size={11} /> Comprehension Quiz
                    </span>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{fullReport.title}</h2>
                  </div>
                  <button onClick={handleBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white font-medium transition-colors">
                    <ArrowLeft size={14} /> Back
                  </button>
                </div>

                {/* Step circles */}
                <div className="flex items-center justify-center gap-2.5">
                  {qs.map((q, i) => (
                    <button key={q.id} onClick={() => setQuizIdx(i)}
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        i === quizIdx ? 'bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-900/50 scale-110'
                        : answers[q.id] ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-gray-700'
                      }`}>
                      {answers[q.id] && i !== quizIdx ? <CheckCircle size={14} /> : i + 1}
                    </button>
                  ))}
                </div>

                {/* Question card */}
                <div className="bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm transition-colors animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      curQ.type === 'MCQ'
                        ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {curQ.type === 'MCQ' ? 'Multiple Choice' : 'True / False / Not Given'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{quizIdx + 1}/{qs.length}</span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-white leading-snug mb-7">{curQ.stem}</h3>

                  {curQ.type === 'MCQ' && (
                    <div className="space-y-3">
                      {curQ.options.map((opt, oi) => {
                        const letter = String.fromCharCode(65 + oi);
                        const sel = answers[curQ.id] === opt;
                        return (
                          <button key={oi} onClick={() => setAnswers(p => ({ ...p, [curQ.id]: opt }))}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${sel ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : 'border-slate-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-[#1C1A24]'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${sel ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-gray-800 text-slate-500'}`}>{letter}</span>
                            <span className={`text-sm font-medium ${sel ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-gray-300'}`}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {curQ.type === 'TRUE_FALSE_NOT_GIVEN' && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      {curQ.options.map(opt => {
                        const sel = answers[curQ.id] === opt;
                        const look: Record<string, string> = {
                          True:        sel ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-gray-700 hover:border-emerald-400 text-slate-700 dark:text-gray-300',
                          False:       sel ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'border-slate-200 dark:border-gray-700 hover:border-red-400 text-slate-700 dark:text-gray-300',
                          'Not Given': sel ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-slate-200 dark:border-gray-700 hover:border-amber-400 text-slate-700 dark:text-gray-300',
                        };
                        return (
                          <button key={opt} onClick={() => setAnswers(p => ({ ...p, [curQ.id]: opt }))}
                            className={`flex-1 py-4 px-5 rounded-xl border-2 font-semibold text-base transition-all text-center bg-white dark:bg-[#1C1A24] ${look[opt] ?? look['Not Given']}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between">
                  <button onClick={() => setQuizIdx(i => Math.max(0, i - 1))} disabled={quizIdx === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#1C1A24] border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-white text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors">
                    <ChevronLeft size={15} /> Previous
                  </button>
                  {quizIdx < qs.length - 1 ? (
                    <button onClick={() => setQuizIdx(i => i + 1)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors shadow-sm">
                      Next <ChevronRight size={15} />
                    </button>
                  ) : (
                    <button onClick={handleSubmitQuiz} disabled={!allAnswered || submitting}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm">
                      {submitting ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
                      {submitting ? 'Submitting…' : 'Submit & See Results'}
                    </button>
                  )}
                </div>
                {!allAnswered && (
                  <p className="text-center text-xs text-slate-400">Answer all {qs.length} questions to submit</p>
                )}
              </div>
            )}

            {/* ════════════════════ ANALYSIS ═══════════════════════════════════ */}
            {view === 'analysis' && evaluation && fullReport && (
              <div className="w-full mt-4 space-y-5 max-w-3xl mx-auto animate-in fade-in duration-500">
                {/* Title */}
                <div className="text-center space-y-1.5">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Session Results</h2>
                  <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold">
                    {fullReport.source} · {evaluation.speedCategory} Reader
                  </span>
                </div>

                {/* Score cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    value={`${evaluation.retentionScore}%`} label="Retention"
                    color={evaluation.retentionScore >= 80 ? 'text-emerald-500' : evaluation.retentionScore >= 60 ? 'text-amber-500' : 'text-red-500'}
                  />
                  <StatCard value={evaluation.grade} label="Grade" />
                  <StatCard value={evaluation.efficiencyScore} label="Efficiency" />
                  <StatCard value={`${evaluation.correct}/${evaluation.total}`} label="Correct" color="text-emerald-500" />
                </div>

                {/* Detail row */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard value={evaluation.wpm} label="WPM" />
                  <StatCard value={evaluation.idealWpmSuggestion} label="Next Target WPM" color="text-purple-600 dark:text-purple-400" />
                  <StatCard value={`${Math.floor(evaluation.readingTimeSeconds / 60)}m ${evaluation.readingTimeSeconds % 60}s`} label="Session Time" color="text-blue-500" />
                </div>

                {/* Feedback */}
                {evaluation.feedback.length > 0 && (
                  <div className="bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Feedback</p>
                    {evaluation.feedback.map((f, i) => (
                      <div key={i} className="flex gap-2.5 text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
                        <span className="text-purple-500 shrink-0">💡</span> {f}
                      </div>
                    ))}
                  </div>
                )}

                {/* Per-question breakdown */}
                <div className="bg-white dark:bg-[#121118] border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-semibold text-base text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                    <Activity size={17} className="text-purple-500" /> Question Breakdown
                  </h3>
                  <div className="space-y-3">
                    {evaluation.scoredAnswers.map((a, i) => (
                      <div key={a.questionId} className={`rounded-xl border p-4 ${a.isCorrect ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10'}`}>
                        <div className="flex gap-3">
                          <div className="shrink-0 mt-0.5">
                            {a.isCorrect ? <CheckCircle size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-red-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-400">Q{i + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.type === 'MCQ' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600'}`}>
                                {a.type === 'MCQ' ? 'MCQ' : 'T/F/NG'}
                              </span>
                            </div>
                            <p className="font-medium text-slate-800 dark:text-white text-sm mb-2 leading-snug">{a.stem}</p>
                            <div className="text-xs space-y-1">
                              {!a.isCorrect && (
                                <p className="text-red-600 dark:text-red-400">Your answer: <span className="font-semibold">{a.userAnswer || '—'}</span></p>
                              )}
                              <p className={a.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-700 dark:text-emerald-400'}>
                                {a.isCorrect ? '✓ ' : 'Correct: '}<span className="font-semibold">{a.correctAnswer}</span>
                              </p>
                              {a.explanation && (
                                <p className="text-slate-400 italic pt-1 border-t border-slate-200 dark:border-gray-700 mt-1">{a.explanation}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleBack}
                    className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-[#1C1A24] hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-white font-medium transition-colors text-sm">
                    <ArrowLeft size={16} /> Back to Reports
                  </button>
                  <button onClick={() => { setView('reader'); setWordIdx(0); setIsFinished(false); setIsPlaying(false); }}
                    className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-md text-sm">
                    <RefreshCcw size={16} /> Read Again
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
}