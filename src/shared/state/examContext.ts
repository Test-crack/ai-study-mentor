// Owner/Admin selected-exam context (Track A · A1c).
//
// A module-level value the API client (authClient.callBackend) reads to attach the
// `X-Exam-Id` header on every request. The backend only honors it on owner/admin routes
// (attachExamContext); everywhere else it's ignored, so global attachment is safe.
// Persisted to localStorage so a refresh keeps the selection. The React provider
// (SelectedExamProvider) is the setter; this module is the read-point for non-React code.
const KEY = 'ts_selected_exam';

let selectedExamId: string | null = (() => {
  try { return localStorage.getItem(KEY); } catch { return null; }
})();

export function getSelectedExamId(): string | null {
  return selectedExamId;
}

export function setSelectedExamId(id: string | null): void {
  selectedExamId = id;
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch { /* ignore storage errors */ }
}
