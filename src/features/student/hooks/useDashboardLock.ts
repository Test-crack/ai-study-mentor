/**
 * useDashboardLock
 *
 * Fetches the student's daily drill state and returns whether the platform
 * is currently locked. Used by student pages that render a sidebar so every
 * page shows the same locked/unlocked state as the dashboard.
 *
 * Returns `true` (locked) while loading — prevents a flash of an unlocked
 * sidebar before the API responds.
 */

import { useState, useEffect } from 'react';
import { callBackend } from '@/features/auth/services/authClient';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export function useDashboardLock(): boolean {
  const [isLocked, setIsLocked] = useState(true);   // default locked until confirmed

  useEffect(() => {
    let cancelled = false;
    callBackend(`${BACKEND}/api/student/daily-drill-state`)
      .then((res) => {
        if (!cancelled) {
          setIsLocked(!res?.dashboard_unlocked);
        }
      })
      .catch(() => {
        // On error stay locked — safe default
      });
    return () => { cancelled = true; };
  }, []);

  return isLocked;
}
