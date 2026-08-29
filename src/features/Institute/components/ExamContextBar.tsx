// Owner/Admin exam-context selector (Track A · A1c).
// Fetches the institute's accessible exams (GET /api/institute-{owner,admin}/my-exams),
// sets the global selected-exam (which the API client sends as X-Exam-Id), and rescopes
// every page on switch. Hidden when the institute has a single exam — but the selection
// is still set so data is correctly scoped to that one exam.
import { useEffect, useState } from 'react';
import { callBackend } from '@/features/auth/services/authClient';
import { getBackendUrl } from '@/shared/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getSelectedExamId, setSelectedExamId } from '@/shared/state/examContext';

interface ExamOpt { exam_id: string; label: string; }

export function ExamContextBar() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<ExamOpt[]>([]);
  const [current, setCurrent] = useState<string | null>(getSelectedExamId());

  const base = profile?.role === 'INSTITUTE_OWNER' ? 'institute-owner' : 'institute-admin';

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await callBackend(`${getBackendUrl()}/api/${base}/my-exams`);
        const list: ExamOpt[] = res?.data ?? [];
        if (!alive) return;
        setExams(list);
        // Default to the first accessible exam if nothing is selected yet, so the
        // X-Exam-Id header is always sent and data is scoped (even single-exam institutes).
        if (!getSelectedExamId() && list.length) {
          setSelectedExamId(list[0].exam_id);
          setCurrent(list[0].exam_id);
        }
      } catch {
        /* leave empty — pages fall back to unscoped (all-exam) until this resolves */
      }
    })();
    return () => { alive = false; };
  }, [base]);

  if (exams.length <= 1) return null; // single exam → no switcher (selection still set above)

  const onChange = (id: string) => {
    setSelectedExamId(id);
    setCurrent(id);
    window.location.reload(); // rescope every page's data under the newly selected exam
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-line bg-brand-bg-alt px-3 py-1.5">
      <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute">Exam</span>
      <select
        value={current ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-semibold text-brand-text focus:outline-none"
        aria-label="Selected exam"
      >
        {exams.map((e) => (
          <option key={e.exam_id} value={e.exam_id}>{e.label}</option>
        ))}
      </select>
    </div>
  );
}

export default ExamContextBar;
