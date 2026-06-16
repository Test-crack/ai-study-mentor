import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, ArrowLeft, AlertTriangle, CheckCircle, XCircle, Brain, Target,
  ChevronLeft, ChevronRight, Check, Settings, Loader2, AlertCircle, Clock, Hash, BookOpen, Briefcase, BrainCircuit, Sparkles
} from 'lucide-react';
import { PremiumModal } from "@/features/payment/components/PremiumModal";
import StudentLayout from './StudentLayout';

import {
  fetchSpeedReadingReports, fetchSpeedReadingReportById, submitSpeedReadingSession,
  SpeedReadingReportSummary, SpeedReadingReport, SpeedReadingQuestion, SessionEvaluation
} from '../services/speedReadingService';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  tech: { label: 'Tech & VC', icon: <BrainCircuit size={15} className="mr-1.5 shrink-0" /> },
  business: { label: 'Business Strategy', icon: <Briefcase size={15} className="mr-1.5 shrink-0" /> },
  literature: { label: 'Literature', icon: <BookOpen size={15} className="mr-1.5 shrink-0" /> },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, icon: <BookOpen size={15} className="mr-1.5 shrink-0" /> };
}

function getCategories(r: SpeedReadingReportSummary[]) {
  const seen = new Set<string>();
  return r.map(x => x.category).filter(c => { if (seen.has(c)) return false; seen.add(c); return true; });
}

function renderWord(word: string) {
  if (!word) return null;
  const pivot = Math.max(0, Math.ceil(word.length * 0.35) - 1);
  return (
    <div className="flex items-center text-4xl sm:text-5xl md:text-6xl font-medium tracking-wide">
      <span className="text-slate-400 dark:text-gray-300 text-right w-[120px] sm:w-[150px] md:w-[250px]">{word.substring(0, pivot)}</span>
      <span className="text-red-500 w-[15px] sm:w-[20px] md:w-[30px] text-center">{word.substring(pivot, pivot + 1)}</span>
      <span className="text-slate-400 dark:text-gray-300 text-left w-[120px] sm:w-[150px] md:w-[250px]">{word.substring(pivot + 1)}</span>
    </div>
  );
}

const StatCard = ({ value, label, color = 'text-[#7B61FF]' }: { value: React.ReactNode; label: string; color?: string; }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center">
    <div className={`text-3xl md:text-5xl font-black mb-1 md:mb-2 ${color}`}>{value}</div>
    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">{label}</div>
  </div>
);

type View = 'dashboard' | 'reader' | 'quiz' | 'analysis';

export default function SpeedReading() {
  const [activeTab, setActiveTab] = useState("speed-reading");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [reports, setReports] = useState<SpeedReadingReportSummary[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [view, setView] = useState<View>('dashboard');
  const [wpm, setWpm] = useState(400);
  const [words, setWords] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const startRef = useRef<number>(0);
  const [fullReport, setFullReport] = useState<SpeedReadingReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selected, setSelected] = useState<SpeedReadingReportSummary | null>(null);
  const [repIdx, setRepIdx] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<SessionEvaluation | null>(null);

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
    let t: ReturnType<typeof setInterval>;
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
    } catch { }
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
        reportId: fullReport.id, readingTimeSeconds, wpm,
        answers: qs.map(q => ({ questionId: q.id, selectedOption: answers[q.id] ?? '' })),
      });
      setEvaluation(result);
      setView('analysis');
    } catch (err) {
      console.error('Submit failed:', err);
      const correct = qs.filter(q => answers[q.id] === q.answer).length;
      const ret = qs.length ? Math.round((correct / qs.length) * 100) : 0;
      setEvaluation({
        retentionScore: ret, wpm, readingTimeSeconds, correct, total: qs.length,
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

  const pct = words.length > 0 ? ((wordIdx + (isFinished ? 1 : 0)) / words.length) * 100 : 0;
  const cats = getCategories(reports);
  const qs = (fullReport?.questions ?? []) as SpeedReadingQuestion[];
  const curQ = qs[quizIdx] as SpeedReadingQuestion | undefined;
  const allAnswered = qs.length > 0 && qs.every(q => answers[q.id]);
  const hasQuiz = qs.length > 0;

  return (
    <>
      <StudentLayout
        activeTab="speed"
        mainClassName="flex-1 p-4 md:p-6 lg:p-8 flex justify-center items-start animate-in fade-in duration-500 w-full"
      >
        <div className="w-full max-w-7xl">

          {view === 'dashboard' && (
            <>
              <div className="bg-[#7B61FF] rounded-2xl p-8 md:p-10 text-white shadow-md relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold mb-3 flex items-center gap-2">
                    Speed Reading <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                  </h1>
                  <p className="text-indigo-50 max-w-2xl text-base md:text-lg leading-relaxed mb-6">
                    Read faster and improve comprehension with RSVP technology. Select a category below, set your target WPM, and push your reading efficiency to the next level.
                  </p>
                </div>
              </div>

              <div className="w-full bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm transition-colors duration-300">
                {loadingReports ? (
                  <div className="flex items-center gap-3 text-slate-500 dark:text-gray-400 mb-6">
                    <Loader2 size={17} className="animate-spin" /><span className="text-sm">Loading reports…</span>
                  </div>
                ) : reportsError ? (
                  <div className="flex items-center gap-3 text-red-500 mb-6 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
                    <AlertCircle size={17} /><span className="text-sm">{reportsError}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex overflow-x-auto gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                      {cats.map(cat => {
                        const m = getCategoryMeta(cat);
                        return (
                          <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-[#7B61FF] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200 dark:border-slate-800'}`}
                          >{m.icon}{m.label}</button>
                        );
                      })}
                    </div>

                    {selected && (() => {
                      const inCat = reports.filter(r => r.category === activeCategory);
                      const estMin = Math.max(1, Math.ceil(selected.wordCount / wpm));
                      return (
                        <div className="mb-6 md:mb-8 w-full max-w-2xl bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] md:text-xs text-[#7B61FF] dark:text-[#9b86ff] font-semibold mb-1 md:mb-2 tracking-wider uppercase">{selected.source}</p>
                          <h3 className="text-lg md:text-xl font-bold text-[#0b132b] dark:text-white mb-3 md:mb-4 leading-snug">{selected.title}</h3>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1.5"><Hash size={14} /> {selected.wordCount} words</span>
                              <span className="flex items-center gap-1.5"><Clock size={14} /> ~{estMin} min at {wpm} WPM</span>
                            </div>
                            {inCat.length > 1 && (
                              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-1 w-full sm:w-auto justify-between sm:justify-start">
                                <button onClick={() => setRepIdx(i => (i - 1 + inCat.length) % inCat.length)} className="p-2 sm:p-1 rounded text-slate-400 hover:text-[#7B61FF] transition-colors"><ChevronLeft size={16} /></button>
                                <span className="text-xs font-medium text-slate-500 min-w-[30px] text-center">{repIdx + 1}/{inCat.length}</span>
                                <button onClick={() => setRepIdx(i => (i + 1) % inCat.length)} className="p-2 sm:p-1 rounded text-slate-400 hover:text-[#7B61FF] transition-colors"><ChevronRight size={16} /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-start">
                      <button onClick={() => handleStartReading()} disabled={loadingReport || !selected}
                        className="flex items-center justify-center gap-2 bg-[#7B61FF] hover:bg-[#6a50e5] disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 md:px-8 py-3 rounded-xl font-semibold transition-colors w-full sm:w-auto shadow-sm">
                        {loadingReport ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                        Start Reading
                      </button>
                      <button onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full sm:w-auto">
                        <Settings size={18} /><span>Settings</span>
                      </button>
                    </div>

                    {showSettings && (
                      <div className="mt-4 md:mt-6 p-4 md:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">Reading Speed</span>
                          <span className="text-[#7B61FF] font-bold text-sm bg-indigo-50 dark:bg-[#7B61FF]/10 px-3 py-1 rounded-md">{wpm} WPM</span>
                        </div>
                        <input type="range" min="200" max="800" step="25" value={wpm} onChange={e => setWpm(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#7B61FF]" />
                        <div className="flex justify-between text-xs text-slate-400 font-medium mt-3">
                          <span>200</span><span>500</span><span>800</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {view === 'reader' && fullReport && (
            <div className="w-full flex flex-col h-[calc(100vh-120px)] md:h-[80vh] min-h-[500px] md:min-h-[600px] justify-between text-slate-900 dark:text-white max-w-4xl mx-auto">
              <div className="flex flex-col gap-3 md:gap-4 mb-2 md:mb-4">
                <div className="flex items-center justify-between w-full">
                  <button onClick={handleBack} className="p-2 md:px-4 md:py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors shrink-0">
                    <ArrowLeft size={18} className="md:mr-2 inline" /><span className="hidden md:inline">Back</span>
                  </button>
                  <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-slate-900 px-3 md:px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex-1 md:flex-none max-w-[200px] md:max-w-none ml-2 md:ml-0">
                    <input type="range" min="200" max="800" step="25" value={wpm} onChange={e => setWpm(Number(e.target.value))}
                      className="w-full md:w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7B61FF]" />
                    <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-white w-12 md:w-14 text-right shrink-0">{wpm} WPM</span>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm md:text-lg font-bold text-[#0b132b] dark:text-white truncate">{fullReport.title}</h2>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 uppercase tracking-wider truncate">{fullReport.source}</p>
                  </div>
                  <button onClick={() => setIsPlaying(!isPlaying)} disabled={isFinished}
                    className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 bg-[#7B61FF] hover:bg-[#6a50e5] text-white">
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Resume'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 my-2 md:my-4 bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                {isFinished ? (
                  <div className="text-center px-4 md:px-6 space-y-4 md:space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-[#10b981]/10 text-[#10b981] text-xs md:text-sm font-bold uppercase tracking-widest">
                      <CheckCircle size={14} className="md:w-4 md:h-4" /> Reading Complete
                    </div>
                    <div>
                      <span className="text-5xl md:text-6xl font-black text-[#0b132b] dark:text-white">{words.length}</span>
                      <span className="text-lg md:text-xl font-bold text-slate-400 ml-1.5 md:ml-2">words</span>
                    </div>
                    <p className="text-sm md:text-base text-slate-500">read at <span className="font-bold text-[#7B61FF]">{wpm} WPM</span></p>
                    {hasQuiz ? (
                      <button onClick={handleGoToQuiz} className="flex items-center justify-center gap-2 w-full md:w-auto md:mx-auto bg-[#7B61FF] hover:bg-[#6a50e5] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold transition-colors shadow-sm mt-2 md:mt-4">
                        <Brain size={18} /> Take Comprehension Quiz
                      </button>
                    ) : (
                      <button onClick={handleBack} className="flex items-center justify-center gap-2 w-full md:w-auto md:mx-auto bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-semibold transition-colors mt-2 md:mt-4">
                        Back to Reports
                      </button>
                    )}
                  </div>
                ) : renderWord(words[wordIdx])}
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-4 px-1 md:px-2">
                  <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider w-12 md:w-16">Progress</span>
                  <div className="flex-1 h-1.5 md:h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#7B61FF] transition-all duration-150 ease-linear" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 w-12 md:w-16 text-right">{wordIdx + (isFinished ? 1 : 0)} / {words.length}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl p-2 md:p-4 shadow-sm flex flex-col items-center justify-center">
                    <div className="text-lg md:text-2xl font-bold text-[#7B61FF] mb-0.5 md:mb-1">{wpm}</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">WPM</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl p-2 md:p-4 shadow-sm flex flex-col items-center justify-center">
                    <div className="text-lg md:text-2xl font-bold text-[#10b981] mb-0.5 md:mb-1">{wordIdx + (isFinished ? 1 : 0)}</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Words</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl p-2 md:p-4 shadow-sm flex flex-col items-center justify-center">
                    <div className="text-lg md:text-2xl font-bold text-blue-500 mb-0.5 md:mb-1">~{Math.max(1, Math.ceil(fullReport.wordCount / wpm))}m</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Duration</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'quiz' && fullReport && curQ && (
            <div className="w-full mt-2 md:mt-4 max-w-3xl mx-auto space-y-4 md:space-y-6">
              <div className="flex flex-row justify-between items-center gap-2 md:gap-4 mb-2 md:mb-4">
                <button onClick={handleBack} className="p-2 md:py-1 md:px-0 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 bg-white md:bg-transparent rounded-lg md:rounded-none shadow-sm md:shadow-none">
                  <ChevronLeft size={18} className="md:w-4 md:h-4" /> <span className="hidden md:inline">Back</span>
                </button>
                <span className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-md bg-indigo-50 dark:bg-[#7B61FF]/10 text-[#7B61FF] text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
                  <Brain size={12} className="md:w-3.5 md:h-3.5" /> Quiz
                </span>
              </div>

              <div className="flex overflow-x-auto items-center justify-start md:justify-center gap-2 md:gap-3 mb-4 md:mb-8 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {qs.map((q, i) => (
                  <button key={q.id} onClick={() => setQuizIdx(i)}
                    className={`h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all ${
                      i === quizIdx ? 'bg-[#7B61FF] text-white scale-110'
                      : answers[q.id] ? 'bg-[#10b981] text-white'
                      : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                    {answers[q.id] && i !== quizIdx ? <Check size={14} className="md:w-4 md:h-4" strokeWidth={3} /> : i + 1}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-sm transition-colors animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-widest ${curQ.type === 'MCQ' ? 'bg-indigo-50 text-[#7B61FF]' : 'bg-blue-50 text-blue-600'}`}>
                    {curQ.type === 'MCQ' ? 'Multiple Choice' : 'T / F / NG'}
                  </span>
                  <span className="text-xs md:text-sm text-slate-400 font-bold">{quizIdx + 1} of {qs.length}</span>
                </div>

                <h3 className="text-xl md:text-3xl font-bold text-[#0b132b] dark:text-white leading-tight mb-6 md:mb-8">{curQ.stem}</h3>

                {curQ.type === 'MCQ' && (
                  <div className="space-y-3 md:space-y-4">
                    {curQ.options.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi);
                      const sel = answers[curQ.id] === opt;
                      return (
                        <button key={oi} onClick={() => setAnswers(p => ({ ...p, [curQ.id]: opt }))}
                          className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl border-2 text-left transition-all ${sel ? 'border-[#7B61FF] bg-indigo-50 dark:bg-[#7B61FF]/10' : 'border-slate-100 hover:border-slate-300 bg-white dark:bg-slate-800'}`}>
                          <span className={`w-6 h-6 md:w-8 md:h-8 rounded-md flex items-center justify-center text-xs md:text-sm font-bold shrink-0 ${sel ? 'bg-[#7B61FF] text-white' : 'bg-slate-100 text-slate-500'}`}>{letter}</span>
                          <span className={`text-sm md:text-base font-semibold ${sel ? 'text-[#7B61FF] dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {curQ.type === 'TRUE_FALSE_NOT_GIVEN' && (
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    {curQ.options.map(opt => {
                      const sel = answers[curQ.id] === opt;
                      const look: Record<string, string> = {
                        True: sel ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]' : 'border-slate-100 hover:border-[#10b981] text-slate-700',
                        False: sel ? 'border-rose-500 bg-rose-500/10 text-rose-600' : 'border-slate-100 hover:border-rose-400 text-slate-700',
                        'Not Given': sel ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-slate-100 hover:border-amber-400 text-slate-700',
                      };
                      return (
                        <button key={opt} onClick={() => setAnswers(p => ({ ...p, [curQ.id]: opt }))}
                          className={`flex-1 py-3 md:py-5 px-4 md:px-6 rounded-xl md:rounded-2xl border-2 font-bold text-base md:text-lg transition-all text-center bg-white dark:bg-slate-800 ${look[opt] ?? look['Not Given']}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-row items-center justify-between gap-3 md:gap-4 mt-6 md:mt-8">
                <button onClick={() => setQuizIdx(i => Math.max(0, i - 1))} disabled={quizIdx === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-3 rounded-xl bg-white shadow-sm text-slate-600 font-semibold disabled:opacity-40 text-sm md:text-base">
                  <ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden sm:inline">Previous</span>
                </button>
                {quizIdx < qs.length - 1 ? (
                  <button onClick={() => setQuizIdx(i => i + 1)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-8 py-3 rounded-xl bg-[#7B61FF] hover:bg-[#6a50e5] text-white font-semibold shadow-sm text-sm md:text-base">
                    Next <ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                ) : (
                  <div className="flex-1 sm:flex-none flex flex-col items-center w-full sm:w-auto">
                    <button onClick={handleSubmitQuiz} disabled={!allAnswered || submitting}
                      className="w-full flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-8 py-3 rounded-xl bg-[#7B61FF] hover:bg-[#6a50e5] disabled:opacity-50 text-white font-bold shadow-sm text-sm md:text-base">
                      {submitting ? <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" /> : <Target size={16} className="md:w-[18px] md:h-[18px]" />}
                      {submitting ? 'Wait...' : 'Submit'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'analysis' && evaluation && fullReport && (
            <div className="w-full mt-2 md:mt-4 space-y-6 md:space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 flex flex-col items-center">
              <div className="text-center space-y-1 md:space-y-2 mb-2 w-full">
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#0b132b] dark:text-white">Results</h2>
                <span className="inline-block px-2 md:px-3 py-1 bg-indigo-50 text-[#7B61FF] rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1 md:mt-2">{evaluation.speedCategory}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full">
                <StatCard value={`${evaluation.retentionScore}%`} label="Retention" color={evaluation.retentionScore >= 80 ? 'text-[#10b981]' : evaluation.retentionScore >= 60 ? 'text-amber-500' : 'text-rose-500'} />
                <StatCard value={evaluation.wpm} label="Avg WPM" color="text-[#7B61FF]" />
                <StatCard value={`${evaluation.correct}/${evaluation.total}`} label="Correct Answers" color="text-[#7B61FF]" />
              </div>

              {evaluation.feedback.length > 0 && (
                <div className="w-full bg-[#fffbf0] border border-amber-100 rounded-xl md:rounded-2xl p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <AlertTriangle size={16} className="text-amber-500 md:w-[18px] md:h-[18px]" />
                    <h3 className="font-bold text-sm md:text-base text-[#8a6a24]">AI Feedback</h3>
                  </div>
                  <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                    {evaluation.feedback.map((f, i) => (
                      <div key={i} className="text-xs md:text-sm text-[#8a6a24]/80">{f}</div>
                    ))}
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold text-[#8a6a24] bg-amber-100/50 p-2 md:p-3 rounded-lg flex items-start gap-2">
                    <span className="opacity-80 mt-0.5">💡</span>
                    <span>Tip: Next target speed should be around {evaluation.idealWpmSuggestion} WPM.</span>
                  </div>
                </div>
              )}

              <div className="w-full bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm">
                <h3 className="font-bold text-base md:text-lg text-[#0b132b] dark:text-white mb-4 md:mb-6 uppercase tracking-wider text-center">Question Breakdown</h3>
                <div className="space-y-3 md:space-y-4">
                  {evaluation.scoredAnswers.map((a, i) => (
                    <div key={a.questionId} className={`rounded-xl md:rounded-2xl border-2 p-3 md:p-6 ${a.isCorrect ? 'border-[#10b981]/20 bg-[#10b981]/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                        <div className="shrink-0 hidden sm:block">
                          {a.isCorrect ? <div className="bg-[#10b981] p-1.5 rounded-full text-white"><Check size={14} className="md:w-4 md:h-4" strokeWidth={3} /></div> : <div className="bg-rose-500 p-1.5 rounded-full text-white"><XCircle size={14} className="md:w-4 md:h-4" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between sm:justify-start gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="sm:hidden">{a.isCorrect ? <Check size={14} className="text-[#10b981]" strokeWidth={3}/> : <XCircle size={14} className="text-rose-500"/>}</span>
                              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Q{i + 1}</span>
                            </div>
                            <span className={`text-[8px] md:text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest ${a.type === 'MCQ' ? 'bg-indigo-50 text-[#7B61FF]' : 'bg-blue-50 text-blue-600'}`}>
                              {a.type === 'MCQ' ? 'MCQ' : 'T/F/NG'}
                            </span>
                          </div>
                          <p className="font-bold text-[#0b132b] dark:text-white text-sm md:text-base mb-2 md:mb-3 leading-relaxed">{a.stem}</p>
                          <div className="text-xs md:text-sm space-y-1.5 md:space-y-2 bg-white dark:bg-slate-950 p-3 md:p-4 rounded-lg md:rounded-xl border border-slate-100">
                            {!a.isCorrect && (
                              <p className="text-rose-600 flex justify-between border-b border-slate-100 pb-1.5 md:pb-2">
                                <span>Your answer:</span> <span className="font-bold text-right ml-2">{a.userAnswer || '—'}</span>
                              </p>
                            )}
                            <p className={`flex justify-between ${a.isCorrect ? 'text-[#10b981]' : 'text-slate-700 pt-0.5 md:pt-1'}`}>
                              <span>Correct Answer:</span> <span className="font-bold text-right ml-2">{a.correctAnswer}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full">
                <button onClick={handleBack} className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl font-bold border-2 text-[#0b132b] bg-white text-sm md:text-base hover:bg-slate-50">
                  Back to Reports
                </button>
                <button onClick={() => { setView('reader'); setWordIdx(0); setIsFinished(false); setIsPlaying(false); }} className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl font-bold bg-[#7B61FF] hover:bg-[#6a50e5] text-white text-sm md:text-base shadow-sm">
                  Read Again
                </button>
              </div>
            </div>
          )}

        </div>
      </StudentLayout>
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
}