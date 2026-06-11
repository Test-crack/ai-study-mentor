import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentSidebar } from './dashboard/StudentSidebar';
import { StudentTopbar } from './dashboard/StudentTopbar';
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

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const StatBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-2xl px-5 py-4 border border-slate-200 dark:border-slate-800 shadow-sm min-w-[100px]">
    <span className={`text-2xl font-black ${color}`}>{value}</span>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</span>
  </div>
);

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ReadingPractice() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Layout
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // View state machine
  const [view, setView] = useState<ViewState>('library');

  // Library state
  const [passages, setPassages] = useState<SpeedReadingReportSummary[]>([]);
  const [loadingPassages, setLoadingPassages] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Reading state
  const [selectedPassage, setSelectedPassage] = useState<SpeedReadingReport | null>(null);
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Timer
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results state
  const [results, setResults] = useState<ReadingPracticeResult | null>(null);

  // â”€â”€â”€ Load passages on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ Timer Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    return () => stopTimer(); // cleanup on unmount
  }, [stopTimer]);

  // â”€â”€â”€ Derived values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const categories = ['All', ...Array.from(new Set(passages.map(p => p.category)))];

  const filteredPassages = activeCategory === 'All'
    ? passages
    : passages.filter(p => p.category === activeCategory);

  // â”€â”€â”€ Event Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      toast({
        title: 'Incomplete',
        description: 'Please answer all questions before submitting.',
        variant: 'destructive',
      });
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
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption,
        })),
      });
      setResults(evaluation);
      setView('results');
    } catch {
      toast({ title: 'Error', description: 'Submission failed. Please try again.', variant: 'destructive' });
      startTimer(); // resume timer on failure
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

  // â”€â”€â”€ Render: Loading Overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loadingPassage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#7B61FF]/10 flex items-center justify-center animate-pulse">
          <BookOpen className="w-8 h-8 text-[#7B61FF]" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Loading passage...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300">
      <StudentSidebar
        activeTab="reading"
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'} flex flex-col min-h-screen`}>
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {/* VIEW 1: PASSAGE LIBRARY */}
          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {view === 'library' && (
            <div className="space-y-6">

              {/* Banner */}
              <div className="bg-gradient-to-br from-[#7B61FF] to-[#5B41DF] rounded-2xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
                      IELTS Reading Practice <Sparkles className="h-6 w-6 text-yellow-300" fill="currentColor" />
                    </h1>
                    <p className="text-indigo-100 max-w-2xl text-base leading-relaxed">
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

              {/* Category Filters */}
              {!loadingPassages && categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                        activeCategory === cat
                          ? 'bg-[#7B61FF] text-white shadow-md shadow-[#7B61FF]/25'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-[#7B61FF]/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Passage Grid */}
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
                      className="group border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md hover:border-[#7B61FF] dark:hover:border-[#7B61FF] transition-all cursor-pointer flex flex-col h-52"
                    >
                      <CardHeader className="pb-3 flex-none">
                        <div className="flex justify-between items-start gap-3">
                          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#7B61FF] dark:group-hover:text-[#9b86ff] transition-colors line-clamp-2 leading-snug">
                            {passage.title}
                          </CardTitle>
                          <Badge className="bg-indigo-50 text-[#7B61FF] hover:bg-indigo-100 dark:bg-[#7B61FF]/20 dark:text-[#9b86ff] flex-shrink-0 text-xs">
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
                          <span className="text-xs text-[#7B61FF] dark:text-[#9b86ff] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
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

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {/* VIEW 2: READING + Q&A INTERFACE */}
          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {view === 'reading' && selectedPassage && (
            <div className="flex flex-col h-full flex-1 min-h-[calc(100vh-140px)]">

              {/* Header bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                <Button
                  variant="ghost"
                  onClick={handleRestart}
                  className="text-slate-600 dark:text-slate-400 -ml-2 w-fit"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
                </Button>

                <div className="flex items-center gap-3">
                  {/* Timer pill */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm">
                    <Clock className="w-4 h-4 text-[#7B61FF]" />
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">
                      {formatTime(elapsed)}
                    </span>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-[#7B61FF] hover:bg-[#6a50e5] text-white shadow-sm rounded-full"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Submit Answers</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Split Content */}
              <div className="flex flex-col lg:flex-row gap-5 flex-grow min-h-0">

                {/* LEFT: Passage */}
                <div className="w-full lg:w-[55%] flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 flex-shrink-0">
                    <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[#7B61FF] dark:text-[#9b86ff] mb-2">
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
                        <Badge className="bg-indigo-50 text-[#7B61FF] dark:bg-[#7B61FF]/20 dark:text-[#9b86ff] text-xs">
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

                  {/* Tips */}
                  <Card className="border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/10 flex-shrink-0 mb-4">
                    <CardContent className="p-4 flex gap-3">
                      <AlertTriangle className="h-4 w-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                      <ul className="text-xs text-indigo-700 dark:text-indigo-400/80 space-y-1 list-disc list-inside">
                        <li>Read the questions first to know what details to look for.</li>
                        <li>Skim the passage once, then read key sections in depth.</li>
                        <li>Your reading time is tracked â€” it contributes to your WPM score.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT: Questions */}
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
                            <span className="text-[#7B61FF] font-black mr-1.5">Q{qi + 1}.</span>
                            {q.stem}
                          </h4>
                          <div className="space-y-2">
                            {q.options.map((opt, oi) => {
                              const isSelected = answers[q.id] === opt;
                              const label = String.fromCharCode(65 + oi); // A, B, C, D
                              return (
                                <div
                                  key={oi}
                                  onClick={() => handleOptionSelect(q.id, opt)}
                                  className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                                    isSelected
                                      ? 'border-[#7B61FF] bg-indigo-50 dark:border-[#7B61FF] dark:bg-[#7B61FF]/10'
                                      : 'border-slate-200 bg-white hover:border-[#7B61FF]/40 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#7B61FF]/40'
                                  }`}
                                >
                                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-black transition-all ${
                                    isSelected
                                      ? 'border-[#7B61FF] bg-[#7B61FF] text-white'
                                      : 'border-slate-300 dark:border-slate-600 text-slate-400'
                                  }`}>
                                    {label}
                                  </div>
                                  <span className={`text-sm ${isSelected ? 'text-indigo-900 font-semibold dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
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
                  // No questions â€” just submit to record time
                  <div className="w-full lg:w-[45%] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center gap-4">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                    <p className="text-slate-500 text-sm">No comprehension questions for this passage. Submit to record your reading time and WPM.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {/* VIEW 3: RESULTS */}
          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {view === 'results' && results && selectedPassage && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Hero result card */}
              <div className="bg-gradient-to-br from-[#7B61FF] to-[#5B41DF] rounded-3xl p-8 text-white text-center relative overflow-hidden shadow-xl shadow-[#7B61FF]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 border-2 border-white/20">
                    <Trophy className="w-10 h-10 text-yellow-300" />
                  </div>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">Your Grade</p>
                  <div className={`text-7xl font-black mb-3 ${results.grade === 'F' ? 'text-rose-300' : 'text-white'}`}>
                    {results.grade}
                  </div>
                  <p className="text-indigo-100 max-w-sm mx-auto text-sm leading-relaxed">
                    {results.feedback?.[0] ?? 'Great effort! Keep practicing to improve.'}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-3 justify-center">
                <StatBadge label="WPM" value={Math.round(results.wpm)} color="text-[#7B61FF]" />
                <StatBadge label="Retention" value={`${Math.round(results.retentionScore)}%`} color={getScoreColor(results.retentionScore)} />
                <StatBadge label="Efficiency" value={`${Math.round(results.efficiencyScore)}%`} color={getScoreColor(results.efficiencyScore)} />
                <StatBadge label="Correct" value={`${results.correct}/${results.total}`} color="text-emerald-500" />
                <StatBadge label="Read Time" value={formatTime(results.readingTimeSeconds)} color="text-slate-600 dark:text-slate-300" />
                <StatBadge label="Speed" value={results.speedCategory} color="text-blue-500" />
              </div>

              {/* Feedback tips */}
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
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] mt-2 flex-shrink-0" />
                        <p className="text-sm text-slate-700 dark:text-slate-300">{tip}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Next session WPM hint */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                <Target className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  <span className="font-bold">Next session target:</span> {results.idealWpmSuggestion} WPM
                </p>
              </div>

              {/* Answer review */}
              {results.scoredAnswers && results.scoredAnswers.length > 0 && (
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#7B61FF]" /> Answer Review
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
                              <span className="text-[#7B61FF] mr-1">Q{i + 1}.</span>
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

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pb-8">
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Try Same Passage Again
                </Button>
                <Button
                  onClick={handleRestart}
                  className="flex-1 bg-[#7B61FF] hover:bg-[#6a50e5] text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" /> Back to Library
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/student/reading-assessment/history')}
                  className="flex-1"
                >
                  <History className="w-4 h-4 mr-2" /> View My History
                </Button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}