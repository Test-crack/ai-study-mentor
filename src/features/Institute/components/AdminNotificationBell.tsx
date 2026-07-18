// src/features/Institute/components/AdminNotificationBell.tsx
// Topbar bell for the admin portal, backed by the recipient-generic
// user_notifications endpoints mounted on /api/institute-admin. Replaces the
// old decorative red dot. Read semantics match the student bell: clicking one
// item marks that item read; "Mark all read" clears the rest.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Inbox, UserX } from "lucide-react";
import {
  AdminNotificationEvent,
  fetchAdminNotifications,
  markAdminNotificationsRead,
} from "../services/instituteAdminService";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Per-type display config — extend as new admin-facing events land. */
function renderEvent(e: AdminNotificationEvent): { title: string; body: string; route: string } | null {
  switch (e.type) {
    case "STUDENT_IA_MISSED": {
      const name = e.payload.student_name ?? "A student";
      const date = e.payload.ia_date
        ? new Date(e.payload.ia_date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "recently";
      return {
        title: `${name} missed an assessment`,
        body: `Internal Assessment #${e.payload.ia_number ?? ""} on ${date} was missed. Their momentum dipped by ${e.payload.momentum_deducted ?? 20} pts.`,
        route: "/institute-admin/students",
      };
    }
    default:
      return null; // unknown types are skipped rather than rendered broken
  }
}

export const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminNotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetchAdminNotifications();
      if (res?.success) {
        setEvents(res.events ?? []);
        setUnreadCount(res.unread_count ?? 0);
      }
    } catch {
      // non-critical widget — retried on next focus
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setEvents(prev => prev.map(e => (e.read_at ? e : { ...e, read_at: new Date().toISOString() })));
    try { await markAdminNotificationsRead({ all: true }); } catch { /* reconciles on refresh */ }
  };

  const markOneRead = async (id: string) => {
    setEvents(prev => prev.map(e => (e.id === id && !e.read_at ? { ...e, read_at: new Date().toISOString() } : e)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await markAdminNotificationsRead({ ids: [id] }); } catch { /* reconciles on refresh */ }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/[0.04] rounded-full transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#0D0D14]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white dark:bg-[#131318] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
              >
                Mark all read
              </button>
            ) : (
              events.length > 0 && <span className="text-xs text-slate-400">{events.length} total</span>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {events.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                <Inbox className="w-8 h-8" />
                <p className="text-sm font-medium">You're all caught up</p>
              </div>
            ) : (
              events.map((e) => {
                const view = renderEvent(e);
                if (!view) return null;
                const unread = !e.read_at;
                return (
                  <button
                    key={e.id}
                    onClick={() => {
                      if (unread) markOneRead(e.id);
                      setOpen(false);
                      navigate(view.route);
                    }}
                    className="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors border-b border-slate-50 dark:border-white/[0.04] last:border-0"
                  >
                    <div className="bg-rose-50 dark:bg-rose-500/10 p-2 rounded-xl shrink-0 self-start">
                      <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{view.title}</p>
                        {unread && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{view.body}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(e.created_at)}</p>
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
