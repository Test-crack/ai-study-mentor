import React, { useState, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface AudioDrillProps {
  prompt: { id: number; text: string };
  onComplete: () => void;
}

export default function AudioResponseDrill({ prompt, onComplete }: AudioDrillProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isProcessing, setIsProcessing] = useState(false);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRecording) {
      handleStopRecording();
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  // Reset timer when prompt changes
  useEffect(() => {
    setTimeLeft(60);
    setIsProcessing(false);
  }, [prompt]);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    // Simulate AI processing time
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in">
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-full border border-slate-100 dark:border-slate-700">
        <p className="text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed">"{prompt.text}"</p>
      </div>

      <div className="flex flex-col items-center justify-center space-y-6">
        {!isRecording && !isProcessing ? (
          <button onClick={handleStartRecording} className="relative group flex flex-col items-center justify-center w-32 h-32 rounded-full bg-rose-500 text-white shadow-lg hover:scale-105 transition-all">
            <div className="absolute inset-0 rounded-full bg-rose-400 opacity-30 group-hover:animate-ping" />
            <Mic className="w-10 h-10 mb-2" />
            <span className="font-bold text-xs tracking-wider">TAP TO SPEAK</span>
          </button>
        ) : isProcessing ? (
          <div className="flex flex-col items-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <span className="font-medium">Evaluating pronunciation...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in zoom-in">
            <div className="text-4xl font-mono font-black text-rose-500 mb-6 flex items-center gap-3 bg-rose-50 dark:bg-rose-500/10 px-6 py-2 rounded-2xl">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
            <button onClick={handleStopRecording} className="flex items-center px-8 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-bold transition-all hover:scale-105">
              <Square className="w-5 h-5 mr-2 fill-current" /> Stop & Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}