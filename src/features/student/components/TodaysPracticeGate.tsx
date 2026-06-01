import { CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TodaysPracticeGate({
  skillLabel,
  skillRoute,
  isCompleted,
  onSkip,
}: {
  skillLabel: string;
  skillRoute: string;
  isCompleted: boolean;
  onSkip: () => void;
}) {
  const navigate = useNavigate();

  if (isCompleted) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between mb-6 shadow-sm transition-all duration-500">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          <p className="text-emerald-800 dark:text-emerald-300 font-bold">
            Today's {skillLabel} Practice Complete!
          </p>
        </div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Drills Unlocked
        </p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-3xl p-6 mb-6 shadow-sm relative overflow-hidden transition-all duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px]" />
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3" /> Gate Locked
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-1">
            {skillLabel} Practice Required
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Complete this targeted {skillLabel.toLowerCase()} session to unlock your daily drills.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={onSkip}
            className="text-xs font-semibold text-slate-50
            
          >
            Skip Gate (−20 pts)
          </button>
          <button
            onClick={() => navigate(skillRoute)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            Start Practice <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}