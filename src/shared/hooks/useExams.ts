import { useEffect, useState } from 'react';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { EXAM_TYPES, EXAM_LABELS, EXAM_AVAILABILITY } from '@/shared/constants/examTypes';

/**
 * The exam list for pickers/badges, sourced from the backend registry (GET /api/exams)
 * so the UI can't drift from the seeded config. Falls back to the interim local
 * constants if the request fails, so the UI always renders. A new exam added to the
 * registry appears here automatically — no frontend change (Track A · A0).
 */
export interface ExamOption {
  id: string;
  label: string;
  availability: 'live' | 'soon';
}

const FALLBACK: ExamOption[] = EXAM_TYPES.map((id) => ({
  id,
  label: EXAM_LABELS[id],
  availability: EXAM_AVAILABILITY[id],
}));

export function useExams() {
  const [exams, setExams] = useState<ExamOption[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await callBackend(`${getBackendUrl()}/api/exams`);
        const list: ExamOption[] = (res?.data ?? []).map((e: any) => ({
          id: e.exam_id,
          label: e.naming?.public_display_name ?? e.naming?.short_code ?? e.exam_id,
          availability: e.status === 'live' ? 'live' : 'soon',
        }));
        if (alive && list.length) setExams(list);
      } catch {
        /* keep the fallback — the UI still works offline / on error */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const labelOf = (id: string) =>
    exams.find((e) => e.id === id)?.label ?? (EXAM_LABELS as Record<string, string>)[id] ?? id;

  return { exams, labelOf, loading };
}
