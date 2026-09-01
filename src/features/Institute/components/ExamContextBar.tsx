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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';

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
        // Silent: this endpoint doesn't exist on every backend deploy yet, and
        // the fallback below (unscoped data) is a deliberate, working default —
        // not an error the user needs to see.
        const res = await callBackend(`${getBackendUrl()}/api/${base}/my-exams`, undefined, { silent: true });
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
    // Radix Select, not a native <select>: a native select's popup is drawn by the
    // browser at the width of its longest option and ignores CSS, so on a phone
    // "Spoken English (CEFR-aligned)" opened a panel wider than the viewport.
    // Radix renders the panel in a portal with collision detection, so it stays
    // on screen, and its width is ours to cap.
    //
    // min-w-0 + shrink keeps the closed trigger from pushing the rest of the
    // topbar off-screen.
    <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-brand-line bg-brand-bg-alt px-2 sm:px-3 py-1.5 min-w-0 shrink">
      {/* The "Exam" caption is the first thing to go — the trigger's own value
          already says what this control is. */}
      <span className="font-jetbrains text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-mute hidden sm:inline shrink-0">Exam</span>
      <Select value={current ?? ''} onValueChange={onChange}>
        <SelectTrigger
          aria-label="Selected exam"
          className="h-auto w-auto border-0 bg-transparent p-0 gap-1 text-xs sm:text-sm font-semibold text-brand-text shadow-none ring-offset-0 focus:ring-0 focus:ring-offset-0 min-w-0 max-w-[9.5rem] sm:max-w-[13rem]"
        >
          <SelectValue placeholder="Select exam" />
        </SelectTrigger>
        {/*
          max-w: cap to the viewport (minus page gutters) so a long label wraps
          inside the panel instead of running off the edge.

          The viewport override undoes shadcn's popper-mode
          `h-[var(--radix-select-trigger-height)]` on the inner viewport. That
          sizes the option list to the TRIGGER's height, which is fine for the
          default h-10 triggers used elsewhere but would crush the list to a
          single scrolling row against this bar's compact trigger. Scoped here
          rather than in ui/select.tsx so the other usages are untouched.
        */}
        <SelectContent
          // This control sits at the right end of the topbar, so anchor the panel
          // to the trigger's right edge; left-aligned (the default) pushed it off
          // the screen at 320px. collisionPadding keeps a gutter so it can never
          // sit flush against the edge.
          align="end"
          collisionPadding={12}
          className="max-w-[calc(100vw-2rem)] sm:max-w-sm [&_[data-radix-select-viewport]]:h-auto"
        >
          {exams.map((e) => (
            <SelectItem key={e.exam_id} value={e.exam_id} className="text-xs sm:text-sm">
              <span className="block whitespace-normal break-words">{e.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default ExamContextBar;
