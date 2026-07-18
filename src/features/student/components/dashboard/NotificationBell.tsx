import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Inbox } from "lucide-react";
import { useNotifications } from "@/features/student/Context/NotificationsContext";
import {
  NOTIFICATION_CONFIG,
  NotificationType,
  eventToNotification,
} from "./notificationConfig";

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
 * Topbar notification bell: unread badge + dropdown.
 * Reading is explicit: clicking one notification marks only that one read;
 * the header's "Mark all read" clears everything. CTAs (today's IA / this
 * month's mock) are pinned on top; persisted events follow newest-first.
 */
export const NotificationBell = () => {
  const navigate = useNavigate();
  const { cta, events, unreadCount, markAllRead, markRead } = useNotifications();
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

  const handleToggle = () => setOpen((prev) => !prev);

  const items = [
    ...cta.map((n) => ({ n: n as any, isCta: true, unread: false })),
    ...events.map((e) => ({
      n: eventToNotification(e),
      isCta: false,
      unread: !e.read_at,
    })),
  ];

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                Mark all read
              </button>
            ) : (
              items.length > 0 && <span className="text-xs text-slate-400">{items.length} total</span>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                <Inbox className="w-8 h-8" />
                <p className="text-sm font-medium">You're all caught up</p>
              </div>
            ) : (
              items.map((item, idx) => {
                const cfg = NOTIFICATION_CONFIG[item.n.type as NotificationType];
                if (!cfg) return null;
                return (
                  <button
                    key={item.n.id ?? `cta-${idx}`}
                    onClick={() => {
                      if (item.unread && item.n.id) markRead(item.n.id);
                      setOpen(false);
                      if (cfg.route) navigate(cfg.route);
                    }}
                    className="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                  >
                    <div className={`${cfg.iconBg} ${item.n.type === 'IA_MISSED' ? 'bg-sky-100 dark:bg-sky-500/20' : ''} p-2 rounded-xl shrink-0 self-start [&>svg]:w-4 [&>svg]:h-4 ${item.n.type === 'IA_MISSED' ? '[&>svg]:text-sky-600 dark:[&>svg]:text-sky-400' : ''}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {cfg.title(item.n)}
                        </p>
                        {item.unread && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                        {item.isCta && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                            Action
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {cfg.body(item.n)}
                      </p>
                      {!item.isCta && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          {timeAgo(item.n.created_at)}
                        </p>
                      )}
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
