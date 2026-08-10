import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ArrowLeft, Send, BookOpen, FileText, Sparkles, Loader2, Clock,
  CheckCircle2, XCircle, Trophy, Zap, Target, BarChart2, AlertTriangle,
  RotateCcw, ChevronRight, Tag, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  fetchSpeedReadingReports,
  fetchSpeedReadingReportById,
  type SpeedReadingReportSummary,
  type SpeedReadingReport,
} from '@/features/student/services/speedReadingService';
import {
  submitReadingPracticeSession,
  type ReadingPracticeResult,
} from '@/features/student/services/readingPracticeService';
import StudentLayout from './StudentLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewState = 'library' | 'reading' | 'results';

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A+': case 'A': return 'text-emerald-500';
    case 'B': return 'text-blue-500';
    case 'C': return 'text-amber-500';
    default: return 'text-rose-500';
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-rose-500';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-4 border border-slate-200 dark:border-slate-800 shadow-sm min-w-[100px]">
    <span className={`text-2xl font-black ${color}`}>{value}</span>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReadingPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [view, setView] = useState<ViewState>('library');
  const [passages, setPassages] = useState<SpeedReadingReportSummary[]>([]);
  const [loadingPassages, setLoadingPassages] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedPassage, setSelectedPassage] = useState<SpeedReadingReport | null>(null);
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [results, setResults] = useState<ReadingPracticeResult | null>(null);

  // ─── Load passages on mount ──────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchSpeedReadingReports();
        setPassages(data);
      } catch {
        toast({ title: 'Error', description: 'Failed to load passages. Please try again.', variant: 'destructive' });
      } finally {
        setLoadingPassages(false);
      }
    })();
  }, []);

  // ─── Timer Logic ─────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ─── Derived values ───────────────────────────────────────────────────────────

  const categories = ['All', ...Array.from(new Set(passages.map(p => p.category)))];
  const filteredPassages = activeCategory === 'All'
    ? passages
    : passages.filter(p => p.category === activeCategory);

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const handleSelectPassage = async (summary: SpeedReadingReportSummary) => {
    setLoadingPassage(true);
    try {
      const full = await fetchSpeedReadingReportById(summary.id);
      setSelectedPassage(full);
      setAnswers({});
      setElapsed(0);
      setView('reading');
      startTimer();
    } catch {
      toast({ title: 'Error', description: 'Failed to load this passage. Please try another.', variant: 'destructive' });
    } finally {
      setLoadingPassage(false);
    }
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!selectedPassage) return;
    const totalQ = selectedPassage.questions?.length ?? 0;
    if (totalQ > 0 && Object.keys(answers).length < totalQ) {
      toast({ title: 'Incomplete', description: 'Please answer all questions before submitting.', variant: 'destructive' });
      return;
    }
    stopTimer();
    const readingTimeSeconds = Math.max(10, elapsed);
    const wpm = Math.round(selectedPassage.wordCount / (readingTimeSeconds / 60));
    setSubmitting(true);
    try {
      const evaluation = await submitReadingPracticeSession({
        reportId: selectedPassage.id,
        passageTitle: selectedPassage.title,
        category: selectedPassage.category,
        wordCount: selectedPassage.wordCount,
        readingTimeSeconds,
        wpm,
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption })),
      });
      setResults(evaluation);
      setView('results');
    } catch {
      toast({ title: 'Error', description: 'Submission failed. Please try again.', variant: 'destructive' });
      startTimer();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    stopTimer();
    setSelectedPassage(null);
    setResults(null);
    setAnswers({});
    setElapsed(0);
    setView('library');
  };

  const handleRetry = async () => {
    if (!selectedPassage) return;
    setAnswers({});
    setElapsed(0);
    setResults(null);
    setView('reading');
    startTimer();
  };

  // ─── Render: Loading Overlay ──────────────────────────────────────────────────

  if (loadingPassage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#3E9E93]/10 flex items-center justify-center animate-pulse">
          <BookOpen className="w-8 h-8 text-[#3E9E93]" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Loading passage...</p>
      </div>
    );
  }

  return (
    <StudentLayout activeTab="reading" mainClassName="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* VIEW 1: PASSAGE LIBRARY */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {view === 'library' && (
        <div className="space-y-6">

          <div className="bg-gradient-to-br from-[#3E9E93] to-[#087F73] rounded-2xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
                  IELTS Reading Practice <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                </h1>
                <p className="text-brand-teal-100 max-w-2xl text-base leading-relaxed">
                  Sharpen your comprehension with authentic IELTS-style passages. Read, answer, and receive
                  instant performance analysis with WPM, accuracy, and efficiency scores.
                </p>
              </div>
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap"
                onClick={() => navigate('/student/reading-assessment/history')}
              >
                <History className="w-4 h-4 mr-2" /> My History
              </Button>
            </div>
          </div>

          {!loadingPassages && categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-[#3E9E93] text-white shadow-md shadow-[#3E9E93]/25'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-[#3E9E93]/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loadingPassages ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredPassages.length === 0 ? (
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-16 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <CardTitle className="text-lg text-slate-700 dark:text-slate-200">No Passages Yet</CardTitle>
              <CardDescription className="dark:text-slate-400 mt-1">
                No reading passages are available for this category.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredPassages.map(passage => (
                <Card
                  key={passage.id}
                  onClick={() => handleSelectPassage(passage)}
                  className="group border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md hover:border-[#3E9E93] dark:hover:border-[#3E9E93] transition-all cursor-pointer flex flex-col h-52"
                >
                  <CardHeader className="pb-3 flex-none">
                    <div className="flex justify-between items-start gap-3">
                      <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#3E9E93] dark:group-hover:text-[#7FBFB6] transition-colors line-clamp-2 leading-snug">
                        {passage.title}
                      </CardTitle>
                      <Badge className="bg-brand-teal-50 text-[#3E9E93] hover:bg-brand-teal-100 dark:bg-[#3E9E93]/20 dark:text-[#7FBFB6] flex-shrink-0 text-xs">
                        {passage.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow pt-0 pb-4">
                    <p className="text-slate-500 dark:text-slate-400 text-xs flex-grow line-clamp-2">
                      Source: {passage.source}
                    </p>
                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {passage.wordCount} words
                      </span>
                      <span className="text-xs text-[#3E9E93] dark:text-[#7FBFB6] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Start Reading <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* VIEW 2: READING + Q&A INTERFACE */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {view === 'reading' && selectedPassage && (
        <div className="flex flex-col h-full flex-1 min-h-[calc(100vh-140px)]">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <Button variant="ghost" onClick={handleRestart} className="text-slate-600 dark:text-slate-400 -ml-2 w-fit">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm">
                <Clock className="w-4 h-4 text-[#3E9E93]" />
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">{formatTime(elapsed)}</span>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-[#3E9E93] hover:bg-[#12897C] text-white shadow-sm rounded-full">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Submit Answers</>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5 flex-grow min-h-0">

            <div className="w-full lg:w-[55%] flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[#3E9E93] dark:text-[#7FBFB6] mb-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Reading Passage</span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                    {selectedPassage.title}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {selectedPassage.wordCount} words
                    </span>
                    <Badge className="bg-brand-teal-50 text-[#3E9E93] dark:bg-[#3E9E93]/20 dark:text-[#7FBFB6] text-xs">
                      {selectedPassage.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-slate-700 dark:text-slate-300 text-[15px] leading-[1.9] whitespace-pre-line">
                    {selectedPassage.text}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-brand-teal-100 dark:border-brand-teal-900/30 bg-brand-teal-50 dark:bg-brand-teal-900/10 flex-shrink-0 mb-4">
                <CardContent className="p-4 flex gap-3">
                  <AlertTriangle className="h-4 w-4 text-brand-teal-500 dark:text-brand-teal-400 flex-shrink-0 mt-0.5" />
                  <ul className="text-xs text-brand-teal-700 dark:text-brand-teal-400/80 space-y-1 list-disc list-inside">
                    <li>Read the questions first to know what details to look for.</li>
                    <li>Skim the passage once, then read key sections in depth.</li>
                    <li>Your reading time is tracked — it contributes to your WPM score.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {selectedPassage.questions && selectedPassage.questions.length > 0 ? (
              <Card className="w-full lg:w-[45%] border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Comprehension Questions</h3>
                  <Badge
                    variant="secondary"
                    className={`font-semibold text-xs ${
                      Object.keys(answers).length === selectedPassage.questions.length
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {Object.keys(answers).length} / {selectedPassage.questions.length}
                  </Badge>
                </div>
                <div className="flex-grow overflow-y-auto p-5 space-y-7 custom-scrollbar">
                  {selectedPassage.questions.map((q, qi) => (
                    <div key={q.id} className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                        <span className="text-[#3E9E93] font-black mr-1.5">Q{qi + 1}.</span>
                        {q.stem}
                      </h4>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => {
                          const isSelected = answers[q.id] === opt;
                          const label = String.fromCharCode(65 + oi);
                          return (
                            <div
                              key={oi}
                              onClick={() => handleOptionSelect(q.id, opt)}
                              className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                                isSelected
                                  ? 'border-[#3E9E93] bg-brand-teal-50 dark:border-[#3E9E93] dark:bg-[#3E9E93]/10'
                                  : 'border-slate-200 bg-white hover:border-[#3E9E93]/40 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#3E9E93]/40'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-black transition-all ${
                                isSelected
                                  ? 'border-[#3E9E93] bg-[#3E9E93] text-white'
                                  : 'border-slate-300 dark:border-slate-600 text-slate-400'
                              }`}>
                                {label}
                              </div>
                              <span className={`text-sm ${isSelected ? 'text-brand-teal-900 font-semibold dark:text-brand-teal-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                {opt}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <div className="w-full lg:w-[45%] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center gap-4">
                <BookOpen className="w-12 h-12 text-slate-300" />
                <p className="text-slate-500 text-sm">No comprehension questions for this passage. Submit to record your reading time and WPM.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* VIEW 3: RESULTS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {view === 'results' && results && selectedPassage && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="bg-gradient-to-br from-[#3E9E93] to-[#087F73] rounded-3xl p-8 text-white text-center relative overflow-hidden shadow-xl shadow-[#3E9E93]/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 border-2 border-white/20">
                <Trophy className="w-10 h-10 text-yellow-300" />
              </div>
              <p className="text-brand-teal-100 text-sm font-bold uppercase tracking-widest mb-1">Your Grade</p>
              <div className={`text-7xl font-black mb-3 ${results.grade === 'F' ? 'text-rose-300' : 'text-white'}`}>
                {results.grade}
              </div>
              <p className="text-brand-teal-100 max-w-sm mx-auto text-sm leading-relaxed">
                {results.feedback?.[0] ?? 'Great effort! Keep practicing to improve.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <StatBadge label="WPM" value={Math.round(results.wpm)} color="text-[#3E9E93]" />
            <StatBadge label="Retention" value={`${Math.round(results.retentionScore)}%`} color={getScoreColor(results.retentionScore)} />
            <StatBadge label="Efficiency" value={`${Math.round(results.efficiencyScore)}%`} color={getScoreColor(results.efficiencyScore)} />
            <StatBadge label="Correct" value={`${results.correct}/${results.total}`} color="text-emerald-500" />
            <StatBadge label="Read Time" value={formatTime(results.readingTimeSeconds)} color="text-slate-600 dark:text-slate-300" />
            <StatBadge label="Speed" value={results.speedCategory} color="text-blue-500" />
          </div>

          {results.feedback && results.feedback.length > 1 && (
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Coach Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.feedback.slice(1).map((tip, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3E9E93] mt-2 flex-shrink-0" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
            <Target className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              <span className="font-bold">Next session target:</span> {results.idealWpmSuggestion} WPM
            </p>
          </div>

          {results.scoredAnswers && results.scoredAnswers.length > 0 && (
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#3E9E93]" /> Answer Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.scoredAnswers.map((sa, i) => (
                  <div key={sa.questionId} className={`p-4 rounded-xl border ${
                    sa.isCorrect
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10'
                      : 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-900/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {sa.isCorrect
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          : <XCircle className="w-5 h-5 text-rose-500" />
                        }
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          <span className="text-[#3E9E93] mr-1">Q{i + 1}.</span>
                          {sa.stem}
                        </p>
                        <div className="space-y-1 text-xs">
                          <p className={`${sa.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            <span className="font-bold">Your answer:</span> {sa.userAnswer || '(not answered)'}
                          </p>
                          {!sa.isCorrect && (
                            <p className="text-emerald-700 dark:text-emerald-400">
                              <span className="font-bold">Correct:</span> {sa.correctAnswer}
                            </p>
                          )}
                          {sa.explanation && (
                            <p className="text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700 mt-1">
                              {sa.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <Button variant="outline" onClick={handleRetry} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" /> Try Same Passage Again
            </Button>
            <Button onClick={handleRestart} className="flex-1 bg-[#3E9E93] hover:bg-[#12897C] text-white">
              <BookOpen className="w-4 h-4 mr-2" /> Back to Library
            </Button>
            <Button variant="outline" onClick={() => navigate('/student/reading-assessment/history')} className="flex-1">
              <History className="w-4 h-4 mr-2" /> View My History
            </Button>
          </div>
        </div>
      )}

    </StudentLayout>
  );
}