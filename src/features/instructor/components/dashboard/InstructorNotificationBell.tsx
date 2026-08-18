import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Inbox, UserX } from "lucide-react";
import {
  useInstructorNotifications,
  InstructorEventNotification,
} from "@/features/instructor/Context/InstructorNotificationsContext";

/** "2h ago" / "3d ago" style relative timestamp for the dropdown rows. */
function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Per-type curated display. Each entry renders one dropdown row and knows
 * where clicking it should take the instructor. New event types = one new
 * entry here, nothing else.
 */
const EVENT_DISPLAY: Record<string, {
  icon: JSX.Element;
  iconBg: string;
  title: (p: Record<string, any>) => string;
  body: (p: Record<string, any>) => string;
  route: (p: Record<string, any>) => string | null;
}> = {
  STUDENT_IA_MISSED: {
    icon:   <UserX className="w-4 h-4 text-rose-600" />,
    iconBg: "bg-rose-50",
    title:  (p) => `${p.student_name ?? "A student"} missed an assessment`,
    body:   (p) => {
      const date = p.ia_date
        ? new Date(p.ia_date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "recently";
      return `IA #${p.ia_number ?? "?"} scheduled for ${date} slipped by — their momentum dipped by ${p.momentum_deducted ?? 20} pts. A quick check-in could help.`;
    },
    // Deep-link into the student's full-progress page (batch-scoped route).
    route:  (p) => (p.batch_id && p.student_user_id
      ? `/instructor/batches/${p.batch_id}/students/${p.student_user_id}/progress`
      : null),
  },
};

/**
 * Instructor topbar bell: unread badge + dropdown over user_notifications.
 * Reading is explicit — clicking one row marks only that row read and
 * navigates to the student; "Mark all read" clears the badge.
 */
export const InstructorNotificationBell = () => {
  const navigate = useNavigate();
  const { events, unreadCount, markAllRead, markRead } = useInstructorNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleClick = (e: InstructorEventNotification) => {
    if (!e.read_at) markRead(e.id);
    setOpen(false);
    const display = EVENT_DISPLAY[e.type];
    const route = display?.route(e.payload);
    if (route) navigate(route);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative p-2 rounded-xl text-brand-text-mute hover:bg-brand-bg-alt transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white border border-brand-line rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-line flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-text">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-teal-600 hover:text-brand-teal-800 transition-colors"
              >
                Mark all read
              </button>
            ) : (
              events.length > 0 && <span className="text-xs text-brand-text-mute">{events.length} total</span>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {events.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-brand-text-mute">
                <Inbox className="w-8 h-8" />
                <p className="text-sm font-medium">You're all caught up</p>
              </div>
            ) : (
              events.map((e) => {
                const display = EVENT_DISPLAY[e.type];
                if (!display) return null;
                return (
                  <button
                    key={e.id}
                    onClick={() => handleClick(e)}
                    className="w-full text-left px-4 py-3 flex gap-3 hover:bg-brand-bg-alt transition-colors border-b border-brand-line last:border-0"
                  >
                    <div className={`${display.iconBg} p-2 rounded-xl shrink-0 self-start`}>
                      {display.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-brand-text truncate">
                          {display.title(e.payload)}
                        </p>
                        {!e.read_at && <span className="w-2 h-2 rounded-full bg-brand-teal-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-brand-text-mute mt-0.5 line-clamp-2">
                        {display.body(e.payload)}
                      </p>
                      <p className="text-[11px] text-brand-text-mute mt-1">
                        {timeAgo(e.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
