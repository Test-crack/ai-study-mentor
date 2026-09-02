import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Inbox } from "lucide-react";
import {
  useInstructorNotifications,
  InstructorEventNotification,
} from "@/features/instructor/Context/InstructorNotificationsContext";
import { describeEvent } from "@/shared/notifications/staffEvents";

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

// Event copy, icons and route targets now come from
// shared/notifications/staffEvents. This bell previously carried its own
// EVENT_DISPLAY map while the admin bell carried a separate `renderEvent`
// switch, so the same event could read differently depending on the portal and
// adding a type meant editing both. The shared registry is scope-aware, so this
// bell keeps its instructor-specific batch-scoped deep links.
const SCOPE = "instructor" as const;

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

  // Rows this portal can render. Unknown types describe to null and are dropped,
  // so the "all caught up" state stays truthful rather than showing a header
  // above zero rendered rows.
  const visible = events
    .map((event) => ({ event, view: describeEvent(event.type, event.payload, SCOPE) }))
    .filter((r): r is { event: InstructorEventNotification; view: NonNullable<typeof r.view> } => r.view !== null);

  const handleClick = (e: InstructorEventNotification, route: string | null, state?: Record<string, unknown>) => {
    if (!e.read_at) markRead(e.id);
    setOpen(false);
    if (route) navigate(route, { state });
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
        <div /* Mobile: viewport-anchored. `absolute right-0` anchored the panel to the
   bell, which sits ~60px inside the right edge (avatar beside it), so a
   ~358px panel spilled off the LEFT of a 390px screen and the header was
   clipped. Insets are resolved against the topbar, which is w-full and
   sticky top-0 (its backdrop-blur makes it the containing block for
   fixed children) — so left/right-3 land on the viewport edges and
   top-16 clears the h-16 bar. max-w is a belt-and-braces cap in case
   that containing block ever changes. Unchanged from sm: up. */
        className="fixed left-3 right-3 top-16 w-auto max-w-[calc(100vw-1.5rem)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(24rem,calc(100vw-2rem))] sm:max-w-none bg-white border border-brand-line rounded-2xl shadow-xl z-50 overflow-hidden">
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
              visible.length > 0 && <span className="text-xs text-brand-text-mute">{visible.length} total</span>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-brand-text-mute">
                <Inbox className="w-8 h-8" />
                <p className="text-sm font-medium">You're all caught up</p>
              </div>
            ) : (
              visible.map(({ event, view }) => (
                <button
                  key={event.id}
                  onClick={() => handleClick(event, view.route, view.state)}
                  className="w-full text-left px-4 py-3 flex gap-3 hover:bg-brand-bg-alt transition-colors border-b border-brand-line last:border-0"
                >
                  <div className={`${view.iconBg} p-2 rounded-xl shrink-0 self-start`}>
                    {view.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand-text truncate">{view.title}</p>
                      {!event.read_at && <span className="w-2 h-2 rounded-full bg-brand-teal-500 shrink-0" />}
                    </div>
                    {view.meta && (
                      <p className="text-[11px] font-semibold text-brand-teal-700 mt-0.5 truncate">{view.meta}</p>
                    )}
                    <p className="text-xs text-brand-text-mute mt-0.5 line-clamp-2">{view.body}</p>
                    <p className="text-[11px] text-brand-text-mute mt-1">{timeAgo(event.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
