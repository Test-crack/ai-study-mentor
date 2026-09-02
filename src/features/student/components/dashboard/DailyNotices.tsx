import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/features/student/Context/NotificationsContext";
import {
  NOTIFICATION_CONFIG,
  Notification,
  NotificationType,
  eventToNotification,
} from "./notificationConfig";

/** Dashboard banners are capped so notifications never swallow the page. */
const MAX_BANNERS = 3;

const LOCKED_SUPPRESSED_TYPES: NotificationType[] = ['IA_MISSED', 'MOCK_PENDING', 'MOCK_IN_PROGRESS'];

function NotificationBanner({
  notification,
  isLocked,
  onDismiss,
}: {
  notification: Notification;
  isLocked: boolean;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();
  const cfg = NOTIFICATION_CONFIG[notification.type];

  const showCta = cfg.ctaLabel && cfg.route &&
    !(isLocked && LOCKED_SUPPRESSED_TYPES.includes(notification.type));

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
          onClick={onDismiss}
          className={`p-2 rounded-xl ${cfg.bodyColor} opacity-60 hover:opacity-100 hover:bg-black/5 transition-all`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Dashboard notification banners, fed by the shared NotificationsContext
 * (same fetch as the topbar bell — no duplicate requests).
 *
 * Display rules:
 *  - Live CTAs (today's IA / this month's mock) come first — they are the
 *    student's actual next action.
 * - Persisted events (missed IAs…) follow, skipping anything the student
 * already dismissed (dismissals are server-side, cross-device).
 * - Hard cap of MAX_BANNERS; the overflow lives in the topbar bell.
 *
 * Dismissal: events dismiss via the API (permanent, stays in bell history);
 * CTAs have no DB row, so they dismiss per-session via sessionStorage — they
 * are transient by nature and will resolve or expire on their own.
 */
export const DailyNotices = ({
 isLocked = false,
 suppressIaMissed = false,
}: {
 isLocked?: boolean;
 /**
  * Hide per-IA missed notices from the dashboard. Set when the catch-up banner
  * is showing, because that banner already names every missed date in one
  * block — four banners saying the same thing is noise.
  *
  * These are only hidden from the dashboard, never lost: the bell keeps the
  * full per-IA history, including the exact momentum figure for each miss,
  * which this summary deliberately does not restate.
  */
 suppressIaMissed?: boolean;
}) => {
 const { cta, events, loading, dismiss } = useNotifications();

 // Session-scoped dismissals for CTAs only (no DB identity to dismiss against).
 // sessionStorage is the source of truth (CTAs arrive async, after mount);
 // this state exists purely to trigger a re-render on dismiss.
 const [dismissedCtas, setDismissedCtas] = useState<Set<string>>(new Set());

 if (loading) {
 return (
 <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm animate-pulse h-24" />
 );
 }

 const ctaKey = (n: Notification) =>
 `dismissed-${n.type}-${n.ia_number ??''}-${n.ia_date ?? n.month_year ??''}`;

 const visibleCtas = (cta as Notification[]).filter(
 (n) => !dismissedCtas.has(ctaKey(n)) && sessionStorage.getItem(ctaKey(n)) !=='true'
 );
 const allEvents = events
 .filter((e) => !e.dismissed_at)
 .map(eventToNotification);

 const suppressed = suppressIaMissed
 ? allEvents.filter((n) => n.type === 'IA_MISSED')
 : [];
 const visibleEvents = allEvents.filter((n) => !suppressed.includes(n));

 const all = [...visibleCtas, ...visibleEvents];
 const shown = all.slice(0, MAX_BANNERS);
 // Suppressed notices still count toward the bell pointer — they are hidden
 // from the dashboard, not discarded, and the student needs to know where the
 // per-miss detail went.
 const overflow = all.length - shown.length + suppressed.length;

 if (shown.length === 0 && overflow === 0) return null;

 return (
 <div className="space-y-4">
 {shown.map((n, idx) => (
 <NotificationBanner
 key={n.id ?? `${n.type}-${idx}`}
 notification={n}
 isLocked={isLocked}
 onDismiss={() => {
 if (n.id) {
 dismiss(n.id); // persisted event → API, cross-device
 } else {
 const key = ctaKey(n);
 sessionStorage.setItem(key,'true');
 setDismissedCtas((prev) => new Set(prev).add(key));
 }
 }}
 />
 ))}
 {overflow > 0 && (
 <p className="flex items-center gap-1.5 text-xs text-brand-text-mute px-2">
 <Bell className="w-3.5 h-3.5" />
 {overflow} more notification{overflow !== 1 ?'s':''} in the bell at the top right.
        </p>
      )}
    </div>
  );
};
