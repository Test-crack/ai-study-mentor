import { useNavigate } from "react-router-dom";
import { Headphones, BookOpen, PenLine, Mic, Zap, BookA, Target, Library, RotateCcw } from "lucide-react";

const PRACTICE_CARDS = [
  { title: "Reading", icon: BookOpen, route: "/student/reading?mode=standalone", color: "text-violet-500", bg: "bg-violet-500/10" },
  { title: "Listening", icon: Headphones, route: "/student/listening?mode=standalone", color: "text-sky-500", bg: "bg-sky-500/10" },
  { title: "Writing", icon: PenLine, route: "/student/writing?mode=standalone", color: "text-amber-500", bg: "bg-amber-500/10" },
  { title: "Speaking", icon: Mic, route: "/student/speaking-assessment?mode=standalone", color: "text-rose-500", bg: "bg-rose-500/10" },
  { title: "Replay Drills", icon: RotateCcw, route: "/student/drill?mode=replay", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { title: "Speed Reading", icon: Zap, route: "/student/speed", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { title: "Trap History", icon: Target, route: "/student/trap-history", color: "text-red-500", bg: "bg-red-500/10" },
  { title: "LexiGrid", icon: BookA, route: "/student/lexigrid?mode=standalone", color: "text-teal-500", bg: "bg-teal-500/10" },
  { title: "Resources", icon: Library, route: "/student/resources", color: "text-blue-500", bg: "bg-blue-500/10" },
];

export default function OpenPracticeSection() {
  const navigate = useNavigate();

  return (
    <section className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          Open Practice
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Free exploration. Access any skill module or resource without restrictions.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {PRACTICE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => navigate(card.route)}
              className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${card.bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
                {card.title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}