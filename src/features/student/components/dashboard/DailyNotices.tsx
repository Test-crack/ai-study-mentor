import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, PlayCircle, Trophy, BookOpen, Compass, X } from "lucide-react";
import { callBackend } from "@/features/auth/services/authClient";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

type NotificationType = 'IA_PENDING' | 'IA_IN_PROGRESS' | 'MOCK_PENDING' | 'MOCK_IN_PROGRESS' | 'IA_MISSED';

interface Notification {
  type: NotificationType;
  ia_number?: number;
  ia_date?: string;
  session_id?: string;
  answers_saved?: number;
  window_closes_at?: string | null;
  month_year?: string;
  attempt_type?: string;
  momentum_deducted?: number;
}

interface BannerConfig {
  bgColor: string;
  borderColor: string;
  iconBg: string;
  icon: JSX.Element;
  titleColor: string;
  bodyColor: string;
  title: (n: Notification) => string;
  body: (n: Notification) => string;
  ctaLabel?: string;
  ctaClass?: string;
  route?: string;
}

const CONFIG: Record<NotificationType, BannerConfig> = {
  IA_PENDING: {
    bgColor:     "bg-amber-50 dark:bg-amber-500/10",
    borderColor: "border-amber-200 dark:border-amber-500/30",
    iconBg:      "bg-amber-100 dark:bg-amber-500/20",
    icon:        <CalendarClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    titleColor:  "text-amber-900 dark:text-amber-300",
    bodyColor:   "text-amber-700/80 dark:text-amber-400/80",
    title:  (n) => `Internal Assessment #${n.ia_number ?? ""} — Due Today`,
    body:   ()  => "Your Internal Assessment is scheduled for today. Complete it before the window closes.",
    ctaLabel: "Start Assessment",
    ctaClass: "bg-amber-600 hover:bg-amber-700 text-white",
    route: "/student/internal",
  },
  IA_IN_PROGRESS: {
    bgColor:     "bg-amber-50 dark:bg-amber-500/10",
    borderColor: "border-amber-200 dark:border-amber-500/30",
    iconBg:      "bg-amber-100 dark:bg-amber-500/20",
    icon:        <PlayCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    titleColor:  "text-amber-900 dark:text-amber-300",
    bodyColor:   "text-amber-700/80 dark:text-amber-400/80",
    title:  (n) => `Internal Assessment #${n.ia_number ?? ""} — In Progress`,
    body:   (n) =>
      `You left mid-test with ${n.answers_saved ?? 0} answer${(n.answers_saved ?? 0) !== 1 ? "s" : ""} saved. Pick up where you left off.`,
    ctaLabel: "Continue Assessment",
    ctaClass: "bg-amber-600 hover:bg-amber-700 text-white",
    route: "/student/internal",
  },
  MOCK_PENDING: {
    bgColor:     "bg-emerald-50 dark:bg-emerald-500/10",
    borderColor: "border-emerald-200 dark:border-emerald-500/30",
    iconBg:      "bg-emerald-100 dark:bg-emerald-500/20",
    icon:        <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    titleColor:  "text-emerald-900 dark:text-emerald-300",
    bodyColor:   "text-emerald-700/80 dark:text-emerald-400/80",
    title:  (n) => `Monthly Mock Test${n.attempt_type ? ` — ${n.attempt_type}` : ""} Available`,
    body:   (n) => `Your mock test for ${n.month_year ?? "this month"} is ready. Take it to measure your full IELTS readiness.`,
    ctaLabel: "Start Mock Test",
    ctaClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    route: "/student/mock",
  },
  MOCK_IN_PROGRESS: {
    bgColor:     "bg-amber-50 dark:bg-amber-500/10",
    borderColor: "border-amber-200 dark:border-amber-500/30",
    iconBg:      "bg-amber-100 dark:bg-amber-500/20",
    icon:        <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    titleColor:  "text-amber-900 dark:text-amber-300",
    bodyColor:   "text-amber-700/80 dark:text-amber-400/80",
    title:  (n) => `Monthly Mock Test${n.attempt_type ? ` — ${n.attempt_type}` : ""} — Paused`,
    body:   (n) =>
      `You left your mock test incomplete with ${n.answers_saved ?? 0} answer${(n.answers_saved ?? 0) !== 1 ? "s" : ""} saved. Continue before the window closes.`,
    ctaLabel: "Continue Mock Test",
    ctaClass: "bg-amber-600 hover:bg-amber-700 text-white",
    route: "/student/mock",
  },
  // Reframed from punitive to a gentle, recoverable nudge.
  // Light-blue gradient with white text — calm, low-pressure, and clearly a
  // "let's find your way back" moment rather than an alarm.
  IA_MISSED: {
    bgColor:     "bg-gradient-to-r from-sky-800 to-indigo-600 dark:from-sky-800 dark:to-indigo-600",
    borderColor: "border-sky-300/40 dark:border-sky-400/30",
    iconBg:      "bg-white/20",
    icon:        <Compass className="w-6 h-6 text-white" />,
    titleColor:  "text-white",
    bodyColor:   "text-white/90",
    title:  ()  => "Let's find your way back on track",
    body:   (n) => {
      const date = n.ia_date
        ? new Date(n.ia_date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "recently";
      const pts = n.momentum_deducted ?? 20;
      return `No worries — it happens to everyone. Your assessment on ${date} slipped by, so your Momentum dipped by ${pts} pts for now. The good news: you'll earn it right back the moment you complete your next drill.`;
    },
    ctaLabel: "Get back on track",
    ctaClass: "bg-white hover:bg-white/90 text-blue-600",
    route: "/student/assessment-history",
  },
};

const LOCKED_SUPPRESSED_TYPES: NotificationType[] = ['IA_MISSED', 'MOCK_PENDING', 'MOCK_IN_PROGRESS'];

function NotificationBanner({ notification, isLocked }: { notification: Notification; isLocked: boolean }) {
  const navigate = useNavigate();
  const cfg = CONFIG[notification.type];

  // Build a stable key for this specific notification
  const dismissKey = `dismissed-${notification.type}-${notification.ia_number ?? ''}-${notification.ia_date ?? ''}`;

  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(dismissKey) === 'true'
  );

  if (dismissed) return null;

  const showCta = cfg.ctaLabel && cfg.route &&
    !(isLocked && LOCKED_SUPPRESSED_TYPES.includes(notification.type));

  const handleDismiss = () => {
    sessionStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };

  return (
    <div
      className={`${cfg.bgColor} border ${cfg.borderColor} rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4`}
    >
      <div className={`${cfg.iconBg} p-3 rounded-2xl shrink-0 self-start sm:self-auto`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`${cfg.titleColor} font-bold text-base leading-tight`}>
          {cfg.title(notification)}
        </h3>
        <p className={`${cfg.bodyColor} text-sm mt-1 leading-relaxed`}>
          {cfg.body(notification)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
        {showCta && (
          <button
            onClick={() => navigate(cfg.route!)}
            className={`${cfg.ctaClass} font-bold text-sm py-2.5 px-5 rounded-xl transition-colors shadow-sm whitespace-nowrap`}
          >
            {cfg.ctaLabel} →
          </button>
        )}
        <button
          onClick={handleDismiss}
          className={`p-2 rounded-xl ${cfg.bodyColor} opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const DailyNotices = ({ isLocked = false }: { isLocked?: boolean }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend(`${BACKEND}/api/student/pending-notifications`);
        if (!cancelled && res?.success) {
          setNotifications(res.notifications ?? []);
        }
      } catch {
        // non-critical widget — silently hide on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-6 shadow-sm animate-pulse h-24" />
    );
  }

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-4">
      {notifications.map((n, idx) => (
        <NotificationBanner key={`${n.type}-${idx}`} notification={n} isLocked={isLocked} />
      ))}
    </div>
  );
};