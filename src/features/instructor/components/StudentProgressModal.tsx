import React, { useState, useEffect } from 'react';
import {
  X,
  LineChart as LineChartIcon,
  Mic,
  Zap,
  Loader2,
  TrendingUp,
  Award,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { useToast } from '@/shared/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

interface BatchStudent {
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  profileImage: string | null;
}

interface StudentProgressModalProps {
  student: BatchStudent;
  onClose: () => void;
}

interface ReadingHistoryItem {
  id: string;
  difficulty: string;
  category: string;
  wordCount: number;
  readingTimeSeconds: number;
  actualWPM: number;
  weightedWPM: number;
  accuracy: number;
  retention: number;
  speedLearningScore: number;
  focusRatio: number;
  integrityScore: number;
  createdAt: string;
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

export default function StudentProgressModal({ student, onClose }: StudentProgressModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await callBackend(`${getBackendUrl()}/api/instructor/students/${student.userId}/reading-history`);
        setReadingHistory(res.data?.reverse() || []); // newest last for chronological charts
      } catch (err: any) {
        toast({ title: 'Failed to load progress', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [student.userId, toast]);

  // Overall reading analytics
  const totalAssessments = readingHistory.length;
  const avgWpm = totalAssessments ? Math.round(readingHistory.reduce((acc, curr) => acc + curr.weightedWPM, 0) / totalAssessments) : 0;
  const avgRetention = totalAssessments ? Math.round(readingHistory.reduce((acc, curr) => acc + curr.retention, 0) / totalAssessments) : 0;
  const avgAccuracy = totalAssessments ? Math.round(readingHistory.reduce((acc, curr) => acc + curr.accuracy, 0) / totalAssessments) : 0;

  // Chart data formatting
  const chartData = readingHistory.map((h, i) => ({
    name: `Test ${i + 1}`,
    Date: formatDate(h.createdAt),
    WPM: Math.round(h.weightedWPM),
    Retention: Math.round(h.retention),
    Accuracy: Math.round(h.accuracy)
  }));

  // --- Static Mocks for Voice Lab and Speed Reading ---
  const voiceLabData = [
    { name: 'Mon', Pitch: 70, Fluency: 65, Resonance: 60 },
    { name: 'Tue', Pitch: 72, Fluency: 70, Resonance: 65 },
    { name: 'Wed', Pitch: 75, Fluency: 78, Resonance: 68 },
    { name: 'Thu', Pitch: 80, Fluency: 82, Resonance: 74 },
    { name: 'Fri', Pitch: 85, Fluency: 85, Resonance: 80 },
  ];

  const speedReadingData = [
    { name: 'W1', Speed: 250, Comprehension: 80 },
    { name: 'W2', Speed: 320, Comprehension: 75 },
    { name: 'W3', Speed: 400, Comprehension: 82 },
    { name: 'W4', Speed: 480, Comprehension: 88 },
    { name: 'W5', Speed: 550, Comprehension: 85 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#15141B] w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-[#26252D] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6   border-slate-100 dark:border-[#26252D] bg-slate-50/50 dark:bg-[#0A0A0B]/50">
          <div className="flex items-center gap-4">
            {student.profileImage ? (
              <img src={student.profileImage} alt="" className="w-14 h-14 rounded-xl object-cover ring-4 ring-white dark:ring-[#1E1D27] shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-indigo-500/20 shadow-lg">
                {student.name?.[0]?.toUpperCase() || student.email[0].toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {student.name || 'Student Progress'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {student.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Analyzing student records...</p>
            </div>
          ) : (
            <Tabs defaultValue="ielts" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 dark:bg-[#1E1D27] p-1 rounded-xl">
                <TabsTrigger value="ielts" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#2A2935] data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 font-semibold py-2.5 transition-all">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="w-4 h-4" />
                    IELTS Reading
                  </div>
                </TabsTrigger>
                <TabsTrigger value="voice" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#2A2935] data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 font-semibold py-2.5 transition-all">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voice Lab <span className="text-[9px] uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded ml-1">Mock</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="speed" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#2A2935] data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400 font-semibold py-2.5 transition-all">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Speed Reading <span className="text-[9px] uppercase tracking-wider bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 px-1.5 py-0.5 rounded ml-1">Mock</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              {/* IELTS Reading (Dynamic Data) */}
              <TabsContent value="ielts" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {totalAssessments === 0 ? (
                  <div className="text-center py-16 bg-slate-50 dark:bg-[#0A0A0B] rounded-2xl border border-slate-100 dark:border-[#26252D] border-dashed">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-[#1E1D27] rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Reading History</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">This student has not completed any IELTS reading assessments yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-[#1E1D27] border border-slate-100 dark:border-[#26252D] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"><LineChartIcon className="w-5 h-5 text-indigo-500" /></div>
                          <span className="text-sm font-semibold tracking-wide uppercase">Tests Taken</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{totalAssessments}</div>
                      </div>
                      <div className="bg-white dark:bg-[#1E1D27] border border-slate-100 dark:border-[#26252D] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500" />
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2 relative z-10">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"><Zap className="w-5 h-5 text-emerald-500" /></div>
                          <span className="text-sm font-semibold tracking-wide uppercase">Avg WPM</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white relative z-10">{avgWpm}</div>
                      </div>
                      <div className="bg-white dark:bg-[#1E1D27] border border-slate-100 dark:border-[#26252D] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-500" /></div>
                          <span className="text-sm font-semibold tracking-wide uppercase">Avg Retention</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{avgRetention}%</div>
                      </div>
                      <div className="bg-white dark:bg-[#1E1D27] border border-slate-100 dark:border-[#26252D] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg"><Award className="w-5 h-5 text-amber-500" /></div>
                          <span className="text-sm font-semibold tracking-wide uppercase">Avg Accuracy</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{avgAccuracy}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <div className="bg-white dark:bg-[#1E1D27] border border-slate-200 dark:border-[#26252D] rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Reading Speed Progress (WPM)</h3>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#fff', fontWeight: 600 }}
                              />
                              <Area type="monotone" dataKey="WPM" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#1E1D27] border border-slate-200 dark:border-[#26252D] rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Comprehension Metrics (%)</h3>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              />
                              <Line type="monotone" dataKey="Retention" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                              <Line type="monotone" dataKey="Accuracy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4 relative z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Retention</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Accuracy</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Voice Lab (Static Data) */}
              <TabsContent value="voice" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Premium Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl border border-purple-500/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/30 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shrink-0">
                    <Mic className="w-10 h-10 text-purple-200" />
                  </div>
                  <div className="relative z-10 flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      Beta Feature
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Voice Lab Analytics</h3>
                    <p className="text-purple-200 max-w-xl text-sm leading-relaxed">
                      AI-powered acoustic and phonetic analysis tracking. This is a preview of the dynamic voice records integration, analyzing prosody, resonance, and articulation metrics.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-5 rounded-2xl shadow-lg border border-purple-400/30 text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
                    <h4 className="text-xs font-semibold text-purple-100 tracking-wide uppercase mb-1 relative z-10">Speaking Score</h4>
                    <div className="flex items-baseline gap-2 relative z-10">
                      <div className="text-4xl font-black">78</div>
                      <div className="text-sm font-medium text-purple-200">/ 100</div>
                    </div>
                    <div className="w-full bg-black/20 h-1.5 rounded-full mt-4 relative z-10">
                      <div className="bg-white h-1.5 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1E1D27] border border-slate-100 dark:border-[#26252D] p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-indigo-50 dark:from-indigo-900/10 to-transparent" />
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase mb-1">Fluency Rate</h4>
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">82%</div>
                    <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-medium mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +5% this week
                    </p>
                  </div>

                  <div className="bg-white dark:bg-[#1E1D27] border border-slate-100 dark:border-[#26252D] p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-emerald-50 dark:from-emerald-900/10 to-transparent" />
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase mb-1">Pacing</h4>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">145</div>
                    <p className="text-xs text-slate-400 font-medium mt-2">Words / Minute</p>
                  </div>

                  <div className="bg-white dark:bg-[#1E1D27] border border-slate-100 dark:border-[#26252D] p-5 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-rose-50 dark:from-rose-900/10 to-transparent" />
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase mb-1">Pauses</h4>
                    <div className="text-3xl font-black text-rose-600 dark:text-rose-400">1.2s</div>
                    <p className="text-xs text-slate-400 font-medium mt-2">Avg filler pause</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E1D27] border border-slate-200 dark:border-[#26252D] rounded-2xl p-6 shadow-sm mt-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Acoustic Trajectory</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" /><span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Fluency</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" /><span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Pitch</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /><span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Resonance</span></div>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={voiceLabData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVoice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                        <RechartsTooltip  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.25)' }} />
                        <Area type="monotone" dataKey="Fluency" stroke="#8b5cf6" strokeWidth={4} fill="url(#colorVoice)" activeDot={{ r: 8, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="Pitch" stroke="#ec4899" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="Resonance" stroke="#10b981" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              {/* Speed Reading (Static Data) */}
              <TabsContent value="speed" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Premium Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-rose-900 to-orange-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl border border-rose-500/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/30 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/30 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shrink-0">
                    <Zap className="w-10 h-10 text-rose-200" />
                  </div>
                  <div className="relative z-10 flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-bold uppercase tracking-wider mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      Coming Soon
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Cognitive Velocity Tracking</h3>
                    <p className="text-rose-200 max-w-xl text-sm leading-relaxed">
                      Advanced neurological reading patterns, fixation tracking, and saccadic jump analysis. Dynamic integration will sync this view with student Speed Reading modules.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Fixation Duration', value: '210ms', color: 'rose', trend: '-15ms' },
                    { label: 'Regression Rate', value: '12%', color: 'orange', trend: '-2%' },
                    { label: 'Saccadic Jump', value: '8 chars', color: 'amber', trend: '+1.5 chars' },
                    { label: 'Visual Span', value: 'Medium', color: 'pink', trend: 'Improving' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-[#1E1D27] border border-slate-100 dark:border-[#26252D] p-5 rounded-2xl shadow-sm hover:border-rose-500/30 transition-colors">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{s.label}</h4>
                      <div className={`text-2xl font-black text-${s.color}-600 dark:text-${s.color}-400 mb-2`}>{s.value}</div>
                      <div className="inline-flex py-0.5 px-2 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        {s.trend}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#1E1D27] border border-slate-200 dark:border-[#26252D] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                       Velocity Curve Pattern
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={speedReadingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSpeedFast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                          <Area type="monotone" dataKey="Speed" stroke="#f43f5e" strokeWidth={4} fill="url(#colorSpeedFast)" activeDot={{ r: 8, strokeWidth: 0, fill: '#f43f5e' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-[#1E1D27] border border-slate-200 dark:border-[#26252D] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                       Comprehension Integrity Over Time
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={speedReadingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }} />
                          <Line type="monotone" dataKey="Comprehension" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
