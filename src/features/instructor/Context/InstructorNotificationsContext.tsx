import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { callBackend } from '@/features/auth/services/authClient';
import { useAuth } from '@/features/auth/hooks/useAuth';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// ─── TYPES ────────────────────────────────────────────────────────────────────

/** Persisted event from the user_notifications table (instructor bell). */
export interface InstructorEventNotification {
  id: string;
  type: 'STUDENT_IA_MISSED' | string;
  /** For STUDENT_IA_MISSED: student_id, student_user_id, student_name, batch_id, ia_number, ia_date, momentum_deducted */
  payload: Record<string, any>;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
}

interface InstructorNotificationsContextType {
  events: InstructorEventNotification[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const InstructorNotificationsContext = createContext<InstructorNotificationsContextType | undefined>(undefined);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

/**
 * Instructor-side twin of the student NotificationsProvider, backed by the
 * recipient-generic user_notifications table via /api/instructor/notifications.
 * Mounted at the app root; the fetch is gated on role === 'INSTRUCTOR' so no
 * other role ever calls the endpoint. Refetch on mount + window focus.
 */
export const InstructorNotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const isInstructor = profile?.role === 'INSTRUCTOR';

  const [events, setEvents] = useState<InstructorEventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!isInstructor || inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await callBackend(`${BACKEND}/api/instructor/notifications`);
      if (res?.success) {
        setEvents(res.events ?? []);
        setUnreadCount(res.unread_count ?? 0);
      }
    } catch {
      // Non-critical widget — keep whatever we have; next focus retries.
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [isInstructor]);

  useEffect(() => {
    if (!isInstructor) return;
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh, isInstructor]);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    setEvents(prev => prev.map(e => (e.read_at ? e : { ...e, read_at: new Date().toISOString() })));
    try {
      await callBackend(`${BACKEND}/api/instructor/notifications/read`, {
        method: 'POST',
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // Count reappears on next refresh — acceptable.
    }
  }, [unreadCount]);

  const markRead = useCallback(async (id: string) => {
    setEvents(prev => prev.map(e => (e.id === id && !e.read_at ? { ...e, read_at: new Date().toISOString() } : e)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await callBackend(`${BACKEND}/api/instructor/notifications/read`, {
        method: 'POST',
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      // Reconciled on next refresh.
    }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, dismissed_at: new Date().toISOString() } : e)));
    try {
      await callBackend(`${BACKEND}/api/instructor/notifications/${id}/dismiss`, { method: 'POST' });
    } catch {
      setEvents(prev => prev.map(e => (e.id === id ? { ...e, dismissed_at: null } : e)));
    }
  }, []);

  return (
    <InstructorNotificationsContext.Provider value={{ events, unreadCount, loading, markAllRead, markRead, dismiss, refresh }}>
      {children}
    </InstructorNotificationsContext.Provider>
  );
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const useInstructorNotifications = (): InstructorNotificationsContextType => {
  const ctx = useContext(InstructorNotificationsContext);
  if (!ctx) throw new Error('useInstructorNotifications must be used within an InstructorNotificationsProvider');
  return ctx;
};
