// src/shared/components/notifications/StaffNotificationBell.tsx
//
// Topbar bell for the institute-admin and institute-owner portals, over the
// recipient-generic user_notifications endpoints. Generalised from the former
// AdminNotificationBell, which was hardcoded to /api/institute-admin — the owner
// portal had no bell at all (its decorative one was commented out) and no routes
// mounted.
//
// Read semantics match the student and instructor bells: clicking one row marks
// only that row read and navigates; "Mark all read" clears the badge.
//
// Event copy lives in shared/notifications/staffEvents, not here, so all three
// portals word the same event identically.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Inbox } from 'lucide-react';
import { describeEvent, type StaffScope } from '@/shared/notifications/staffEvents';
import {
  fetchStaffNotifications,
  markStaffNotificationsRead,
  type StaffNotificationEvent,
} from '@/shared/services/staffNotifications';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const StaffNotificationBell = ({ scope }: { scope: StaffScope }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<StaffNotificationEvent[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetchStaffNotifications(scope);
      if (res?.success) {
        setEvents(res.events ?? []);
        // res.unread_count is deliberately NOT used for the badge — see `visible`.
      }
    } catch {
      // Deliberately silent. This is a non-critical topbar widget, and the owner
      // route is not mounted yet (BACKEND_REQUEST Request 2) so it 404s today.
      // An empty bell is the correct degraded state; a toast on every page load
      // would be worse. Retried on next window focus.
    } finally {
      inFlight.current = false;
    }
  }, [scope]);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Rows this portal can actually render. Types outside its allow-list, and any
  // unrecognised type, describe to null and are dropped here — so the "all
  // caught up" empty state stays truthful instead of showing a header over zero
  // rendered rows.
  const visible = events
    .map(e => ({ event: e, view: describeEvent(e.type, e.payload, scope) }))
    .filter((r): r is { event: StaffNotificationEvent; view: NonNullable<typeof r.view> } => r.view !== null);

  // The badge counts VISIBLE unread rows, not the server's unread_count.
  // The server counts every unread row for this user, including types this
  // portal filters out — so trusting it would show "3" above a dropdown reading
  // "You're all caught up". The badge must describe what the dropdown contains.
  const unreadCount = visible.filter(r => !r.event.read_at).length;

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setEvents(prev => prev.map(e => (e.read_at ? e : { ...e, read_at: new Date().toISOString() })));
    try { await markStaffNotificationsRead(scope, { all: true }); } catch { /* reconciles on refresh */ }
  };

  const markOneRead = async (id: string) => {
    setEvents(prev => prev.map(e => (e.id === id && !e.read_at ? { ...e, read_at: new Date().toISOString() } : e)));
    try { await markStaffNotificationsRead(scope, { ids: [id] }); } catch { /* reconciles on refresh */ }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-brand-text-mute hover:text-brand-teal-600 hover:bg-brand-bg-alt transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
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
          <div className="px-4 py-3 border-b border-brand-line flex items-center justify-between gap-2">
            <h3 className="font-manrope text-sm font-bold text-brand-text">Notifications</h3>
            {unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-teal-600 hover:text-brand-teal-800 transition-colors shrink-0"
              >
                Mark all read
              </button>
            ) : (
              visible.length > 0 && <span className="text-xs text-brand-text-mute shrink-0">{visible.length} total</span>
            )}
          </div>

          <div className="max-h-[60vh] sm:max-h-[26rem] overflow-y-auto overscroll-contain">
            {visible.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-brand-text-mute">
                <Inbox className="w-8 h-8" />
                <p className="text-sm font-medium">You're all caught up</p>
              </div>
            ) : (
              visible.map(({ event, view }) => {
                const unread = !event.read_at;
                const clickable = view.route !== null;
                return (
                  <button
                    key={event.id}
                    disabled={!clickable && !unread}
                    onClick={() => {
                      if (unread) markOneRead(event.id);
                      setOpen(false);
                      // Some rows have nothing to open — an aggregate digest, or a
                      // payload missing the id its portal's route needs. Marking
                      // read still works; navigation is simply skipped.
                      if (view.route) navigate(view.route, { state: view.state });
                    }}
                    className={`w-full min-h-[40px] text-left px-4 py-3 flex gap-3 transition-colors border-b border-brand-line last:border-0 ${
                      clickable || unread ? 'hover:bg-brand-bg-alt' : 'cursor-default'
                    }`}
                  >
                    <div className={`${view.iconBg} p-2 rounded-xl shrink-0 self-start`}>
                      {view.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-brand-text truncate">{view.title}</p>
                        {unread && <span className="w-2 h-2 rounded-full bg-brand-teal-500 shrink-0" />}
                      </div>
                      {view.meta && (
                        <p className="text-[11px] font-semibold text-brand-teal-700 mt-0.5 truncate">{view.meta}</p>
                      )}
                      <p className="text-xs text-brand-text-mute mt-0.5 line-clamp-2">{view.body}</p>
                      <p className="font-jetbrains text-[10px] text-brand-text-mute mt-1 uppercase tracking-wide">
                        {timeAgo(event.created_at)}
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
