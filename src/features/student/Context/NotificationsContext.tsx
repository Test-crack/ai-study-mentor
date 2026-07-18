import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { callBackend } from '@/features/auth/services/authClient';
import { useAuth } from '@/features/auth/hooks/useAuth';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// ─── TYPES ────────────────────────────────────────────────────────────────────

/** Live call-to-action — derived by the backend from IA/Mock session state, never persisted. */
export interface CtaNotification {
  type: 'IA_PENDING' | 'IA_IN_PROGRESS' | 'MOCK_PENDING' | 'MOCK_IN_PROGRESS';
  ia_number?: number;
  ia_date?: string;
  session_id?: string;
  answers_saved?: number;
  window_closes_at?: string | null;
  month_year?: string;
  attempt_type?: string;
}

/** Persisted event from the student_notifications table (bell history + dashboard banners). */
export interface EventNotification {
  id: string;
  type: 'IA_MISSED' | string;
  payload: Record<string, any>; // ia_number, ia_date, momentum_deducted, ...
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
}

interface NotificationsContextType {
  cta: CtaNotification[];
  events: EventNotification[];
  unreadCount: number;
  loading: boolean;
  /** Stamp read_at on everything unread (explicit "Mark all read" button). */
  markAllRead: () => Promise<void>;
  /** Stamp read_at on a single event (clicked in the bell dropdown). */
  markRead: (id: string) => Promise<void>;
  /** Permanently hide one event from the dashboard (stays in bell history). */
  dismiss: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

/**
 * Single fetch of GET /api/student/notifications shared by the topbar bell and
 * the dashboard DailyNotices — one request, one source of truth, no drift.
 * Refetches on mount and on window focus; no polling loop.
 *
 * Mounted at the app root (next to MomentumProvider) because many student
 * pages render StudentTopbar outside StudentLayout. The fetch is gated on
 * role === 'STUDENT' so other roles never hit the student-only endpoint.
 */
export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const isStudent = profile?.role === 'STUDENT';

  const [cta, setCta] = useState<CtaNotification[]>([]);
  const [events, setEvents] = useState<EventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!isStudent || inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await callBackend(`${BACKEND}/api/student/notifications`);
      if (res?.success) {
        setCta(res.cta ?? []);
        setEvents(res.events ?? []);
        setUnreadCount(res.unread_count ?? 0);
      }
    } catch {
      // Non-critical widget — keep whatever we have; next focus retries.
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent) return;
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh, isStudent]);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    // Optimistic: clear the badge immediately, reconcile in the background.
    setUnreadCount(0);
    setEvents(prev => prev.map(e => (e.read_at ? e : { ...e, read_at: new Date().toISOString() })));
    try {
      await callBackend(`${BACKEND}/api/student/notifications/read`, {
        method: 'POST',
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // If it failed the count reappears on next refresh — acceptable.
    }
  }, [unreadCount]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic: dot disappears, badge decrements immediately.
    setEvents(prev => prev.map(e => (e.id === id && !e.read_at ? { ...e, read_at: new Date().toISOString() } : e)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await callBackend(`${BACKEND}/api/student/notifications/read`, {
        method: 'POST',
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      // Reconciled on next refresh — acceptable.
    }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    // Optimistic: banner disappears instantly.
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, dismissed_at: new Date().toISOString() } : e)));
    try {
      await callBackend(`${BACKEND}/api/student/notifications/${id}/dismiss`, { method: 'POST' });
    } catch {
      // Roll back so the student can retry.
      setEvents(prev => prev.map(e => (e.id === id ? { ...e, dismissed_at: null } : e)));
    }
  }, []);

  return (
    <NotificationsContext.Provider value={{ cta, events, unreadCount, loading, markAllRead, markRead, dismiss, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const useNotifications = (): NotificationsContextType => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
};
