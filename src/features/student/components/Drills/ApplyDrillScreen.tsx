// src/features/student/drills/ApplyDrillScreen.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StudentSidebar } from '../dashboard/StudentSidebar';
import { StudentTopbar } from '../dashboard/StudentTopbar';
import { Mic, Square, Loader2, Send, Flame, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useMomentum } from "@/features/student/Context/MomentumContext";
import { callBackend } from '@/features/auth/services/authClient';

export default function ApplyDrillScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const skill = searchParams.get('skill') || 'Speaking';
  const subSkill = searchParams.get('sub_skill') || 'Pronunciation';
  const initialScore = parseInt(searchParams.get('score') || '0', 10);
  const sessionId = searchParams.get('session_id') || null;

  const { streak, syncMomentum } = useMomentum();

  const drillType = skill.toLowerCase() === 'writing' ? 'paragraph_repair' : 'audio_response';
  const timeLimit = drillType === 'audio_response' ? 120 : 180; // 2 mins audio, 3 mins text

  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  useEffect(() => {
    let interval: any;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRecording) {
      void handleSubmit();
    }
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, timeLeft]);

  const handleSubmit = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    try {
      // The apply reward is tied to a specific drill session. Without a session id
      // there is nothing to credit — skip the call rather than hitting the removed
      // legacy /apply-complete faucet (which awarded +30 with no idempotency).
      if (!sessionId) {
        console.warn('[ApplyDrill] No session id — skipping apply reward.');
      } else {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        const res = await callBackend(`${backendUrl}/api/drills/session/${sessionId}/apply-done`, { method: 'POST' });
        if (res.success && res.momentum_score !== undefined) {
          syncMomentum(res.momentum_score);
        }
      }
    } catch (err) {
      console.error('[ApplyDrill] Failed to persist apply reward:', err);
    } finally {
      setIsProcessing(false);
      setIsComplete(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-brand-bg transition-colors duration-500">
      <StudentSidebar activeTab="dashboard" isCollapsed={true} toggleCollapse={() => {}} />
      <div className="transition-all duration-300 lg:pl-20 flex flex-col min-h-screen">
        <StudentTopbar onUpgradeClick={() => {}} />

        <main className="flex-1 p-6 max-w-3xl mx-auto w-full animate-in fade-in mt-10">
          {!isComplete ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-teal-tint">
              <div className="text-center mb-8">
                <span className="bg-brand-teal-wash text-brand-teal-700 font-bold px-4 py-1.5 rounded-full text-sm tracking-wide uppercase">
                  Final Step
                </span>
                <h1 className="font-manrope text-2xl font-black text-brand-text mt-6">
                  Apply what you just learned: <span className="text-brand-teal-600">{subSkill}</span>
                </h1>
                <p className="text-brand-text-mute mt-2">One single prompt. Show us what you absorbed from the video.</p>
              </div>

              {/* Text Drill Type */}
              {drillType === 'paragraph_repair' && (
                <div className="space-y-6">
                  <div className="bg-brand-bg-alt p-5 rounded-2xl border border-brand-line">
                     <p className="font-medium text-brand-text">
                       "Write a short paragraph summarizing the video you just watched, focusing specifically on improving your {subSkill}."
                     </p>
                  </div>
                  <div className="relative">
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Start typing your response here..."
                      className="w-full h-48 p-4 rounded-2xl border border-brand-line bg-transparent focus:border-brand-teal-500 focus:ring-2 focus:ring-brand-teal-500/20 outline-none resize-none transition-all text-brand-text"
                      onFocus={() => { if (!isRecording) setIsRecording(true) }}
                    />
                    <div className="absolute bottom-4 right-4 text-brand-text-mute font-mono text-sm tabular-nums">
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleSubmit} disabled={textAnswer.length < 10} className="flex items-center px-6 py-3 bg-brand-teal-700 text-white font-bold rounded-xl hover:bg-brand-teal-600 disabled:opacity-50 transition-colors shadow-sm">
                      Submit Apply Drill <Send className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Audio Drill Type */}
              {drillType === 'audio_response' && (
                <div className="flex flex-col items-center space-y-8">
                  <div className="p-6 bg-brand-bg-alt rounded-2xl w-full text-center border border-brand-line">
                    <p className="text-lg font-medium text-brand-text">
                      "Speak for up to two minutes on how you plan to use the {subSkill} techniques shown in the video during your actual exam."
                    </p>
                  </div>

                  {isProcessing ? (
                     <div className="flex flex-col items-center text-brand-text-mute space-y-3 py-10">
                       <Loader2 className="w-8 h-8 animate-spin text-brand-teal-500" />
                       <span className="font-medium">Finalizing session...</span>
                     </div>
                  ) : !isRecording ? (
                    <button onClick={() => setIsRecording(true)} className="relative group flex flex-col items-center justify-center w-32 h-32 rounded-full bg-brand-teal-700 text-white shadow-sm hover:scale-105 transition-all">
                      <div className="absolute inset-0 rounded-full bg-brand-teal-400 opacity-30 group-hover:animate-ping" />
                      <Mic className="w-10 h-10 mb-2" />
                      <span className="font-bold text-xs tracking-wider">START</span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center animate-in zoom-in">
                      <div className="text-4xl font-mono font-black text-brand-teal-600 mb-6 flex items-center gap-3 tabular-nums">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        {formatTime(timeLeft)}
                      </div>
                      <button onClick={handleSubmit} className="flex items-center px-8 py-3 rounded-xl bg-brand-ink text-white hover:bg-brand-ink-nav font-bold transition-all">
                        <Square className="w-5 h-5 mr-2 fill-current" /> Stop & Submit
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Final Summary Completion Card
            <div className="bg-gradient-to-br from-brand-teal-600 to-brand-blue-600 p-1 rounded-3xl shadow-sm animate-in zoom-in duration-500">
              <div className="bg-white rounded-[22px] p-8 md:p-12 text-center">
                <div className="h-20 w-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-100/50">
                  <CheckCircle2 className="w-11 h-11 text-emerald-500" />
                </div>
                <h2 className="font-manrope text-3xl font-black text-brand-text mb-4">Full Session Complete!</h2>

                <div className="inline-flex flex-wrap justify-center gap-3 mb-8">
                   <div className="flex items-center gap-2 bg-brand-bg-alt px-4 py-2 rounded-xl border border-brand-line">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500"/>
                      <span className="font-bold text-brand-text tabular-nums">+{initialScore + 25 + 30} pts total</span>
                   </div>
                   <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                      <Flame className="w-5 h-5 text-orange-500 fill-orange-500"/>
                      <span className="font-bold text-orange-700">Streak: Day {streak}</span>
                   </div>
                </div>

                <p className="text-brand-text-mute mb-8 font-medium">Excellent work today. You've completed your targeted drills, absorbed a lesson, and proved your knowledge. See you tomorrow!</p>

                <button
                  onClick={() => navigate('/student/dashboard', { state: { drillCompleted: true } })}
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-brand-teal-700 hover:bg-brand-teal-600 text-white px-8 py-4 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-sm"
                >
                  Back to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}