import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ParagraphDrillProps {
  prompt:     { id: number; text: string };
  onComplete: () => void;
}

export default function ParagraphRepairDrill({ prompt, onComplete }: ParagraphDrillProps) {
  const [answer, setAnswer] = useState("");

  // Clear answer when the parent advances to the next prompt
  useEffect(() => {
    setAnswer("");
  }, [prompt.id]);

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in">

      {/* Prompt */}
      <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-200 dark:border-amber-800/50">
        <p className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2">
          Repair Task
        </p>
        <p className="text-slate-800 dark:text-slate-200 font-medium">
          {prompt.text}
          <br /><br />
          <span className="text-slate-500">
            "The graph illustrates the global consumption of fast food.
            ___ it shows a steady increase over the last decade.
            ___ there was a slight dip in 2020."
          </span>
        </p>
      </div>

      {/* Input */}
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder="Type your repaired paragraph here..."
        className="w-full h-40 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-transparent focus:border-amber-500 dark:focus:border-amber-500 outline-none resize-none transition-colors"
      />

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={answer.trim().length === 0}
          className="flex items-center px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit Repair <Send className="w-4 h-4 ml-2" />
        </button>
      </div>

    </div>
  );
}