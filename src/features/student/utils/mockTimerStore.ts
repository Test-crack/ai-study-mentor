// filepath: src/features/student/utils/mockTimerStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// Mock Timer Store — swappable persistence seam.
//
// TODAY: localStorage-backed, wall-clock timestamps → survives refresh/tab-close.
// LATER: replace the body of each method with callBackend(...) to the real API.
//        The component never changes — it only calls this module's interface.
//
// TIMER MODEL (both section and window are the SAME shape now — a fixed deadline):
//   Section: startSection() stamps endsAt = now + duration ONCE (idempotent).
//            It NEVER pauses. remaining = endsAt - now. Runs against wall-clock
//            whether the student is present, away, or logged out.
//   Window:  24h fixed deadline, also never pauses.
// A section only begins when the component explicitly calls startSection() on a
// button click — never automatically, never on render/resume.
// ─────────────────────────────────────────────────────────────────────────────

export type MockSkill = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';

// ── Per-course duration config ────────────────────────────────────────────────
// Durations in SECONDS. Keyed for future per-course variation: when courses ship,
// add course-specific tables and resolve them in getSectionDurations(courseId).
const DEFAULT_SECTION_DURATIONS: Record<string, number> = {
  LISTENING: 30 * 60,  // 30 min
  READING:   60 * 60,  // 60 min
  WRITING:   60 * 60,  // 60 min
  SPEAKING:  15 * 60,  // 15 min
};

// Future: { 'ielts-academic': {...}, 'pte': {...}, 'toefl': {...} }
const COURSE_SECTION_DURATIONS: Record<string, Record<string, number>> = {
  // 'pte-academic': { LISTENING: 45*60, READING: 32*60, WRITING: 60*60, SPEAKING: 20*60 },
};

/**
 * Returns the per-skill duration table (in seconds) for a given course.
 * The single place to change when per-course timing lands.
 */
export function getSectionDurations(courseId?: string | null): Record<string, number> {
  if (courseId && COURSE_SECTION_DURATIONS[courseId]) {
    return COURSE_SECTION_DURATIONS[courseId];
  }
  return DEFAULT_SECTION_DURATIONS;
}

export function getSectionDurationSec(skill: string, courseId?: string | null): number {
  const table = getSectionDurations(courseId);
  return table[skill.toUpperCase()] ?? 30 * 60;
}

// ── 24h window ────────────────────────────────────────────────────────────────
export const MOCK_WINDOW_MS = 24 * 60 * 60 * 1000; // whole mock must finish within 24h

// ── Persisted shape ───────────────────────────────────────────────────────────
interface SectionTimerState {
  endsAt: number | null; // epoch ms when this section's timer expires; null = not started
}

interface MockTimerState {
  sessionId:       string;
  windowClosesAt:  number;                            // epoch ms — 24h deadline
  sections:        Record<string, SectionTimerState>; // keyed by skill
}

const KEY_PREFIX = 'tc_mock_timer_';
const keyFor = (sessionId: string) => `${KEY_PREFIX}${sessionId}`;

// ── Internal read/write (the ONLY localStorage touch points) ──────────────────
function readRaw(sessionId: string): MockTimerState | null {
  try {
    const raw = localStorage.getItem(keyFor(sessionId));
    return raw ? (JSON.parse(raw) as MockTimerState) : null;
  } catch {
    return null;
  }
}

function writeRaw(state: MockTimerState): void {
  try {
    localStorage.setItem(keyFor(state.sessionId), JSON.stringify(state));
  } catch (e) {
    console.warn('[mockTimerStore] persist failed:', e);
  }
}

// ── Public interface ──────────────────────────────────────────────────────────

/**
 * Fetch (or lazily create) the timer state for a session.
 * `windowClosesAtFromServer` — pass the backend's window_closes_at when available;
 * otherwise a 24h window is opened from now on first call.
 */
export function getState(sessionId: string, windowClosesAtFromServer?: number): MockTimerState {
  let state = readRaw(sessionId);
  if (!state) {
    state = {
      sessionId,
      windowClosesAt: windowClosesAtFromServer ?? Date.now() + MOCK_WINDOW_MS,
      sections: {},
    };
    writeRaw(state);
  } else if (windowClosesAtFromServer && state.windowClosesAt !== windowClosesAtFromServer) {
    // Server is authoritative once it provides the value.
    state.windowClosesAt = windowClosesAtFromServer;
    writeRaw(state);
  }
  return state;
}

function ensureSection(state: MockTimerState, skill: string): SectionTimerState {
  const k = skill.toUpperCase();
  if (!state.sections[k]) state.sections[k] = { endsAt: null };
  return state.sections[k];
}

/**
 * Start a section's fixed countdown. Called ONLY on an explicit button click.
 * Idempotent: if the section already has an endsAt (e.g. student refreshed or
 * came back), it does NOT reset — the original deadline stands. This is what
 * makes the timer "never pause": the deadline is fixed at first start.
 */
export function startSection(sessionId: string, skill: string, durationSec: number): void {
  const state = getState(sessionId);
  const sec = ensureSection(state, skill);
  if (sec.endsAt === null) {
    sec.endsAt = Date.now() + durationSec * 1000;
    writeRaw(state);
  }
}

/** Has this section's timer been started yet? */
export function isSectionStarted(sessionId: string, skill: string): boolean {
  const state = getState(sessionId);
  return ensureSection(state, skill).endsAt !== null;
}

/**
 * Remaining SECONDS for a section, floored at 0.
 * If the section hasn't been started, returns the full duration (display only —
 * the countdown hasn't begun). Once started, it's a pure wall-clock countdown.
 */
export function getSectionRemainingSec(
  sessionId: string,
  skill: string,
  durationSec: number
): number {
  const state = getState(sessionId);
  const sec = ensureSection(state, skill);
  if (sec.endsAt === null) return durationSec; // not started yet
  const remainingMs = sec.endsAt - Date.now();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

/** True once a STARTED section's deadline has passed. Unstarted sections are not expired. */
export function isSectionExpired(sessionId: string, skill: string): boolean {
  const state = getState(sessionId);
  const sec = ensureSection(state, skill);
  if (sec.endsAt === null) return false;
  return Date.now() >= sec.endsAt;
}

/**
 * Explicit override — the future-backend seam. When the real API reports an
 * authoritative endsAt for a section, call this to sync it in.
 */
export function setSectionEndsAt(sessionId: string, skill: string, endsAtEpochMs: number): void {
  const state = getState(sessionId);
  const sec = ensureSection(state, skill);
  sec.endsAt = endsAtEpochMs;
  writeRaw(state);
}

// ── 24h window helpers ────────────────────────────────────────────────────────
export function getWindowClosesAt(sessionId: string): number {
  return getState(sessionId).windowClosesAt;
}

export function getWindowRemainingMs(sessionId: string): number {
  return Math.max(0, getWindowClosesAt(sessionId) - Date.now());
}

export function isWindowExpired(sessionId: string): boolean {
  return getWindowRemainingMs(sessionId) <= 0;
}

/** Wipe on submit / abandon. */
export function clearState(sessionId: string): void {
  try {
    localStorage.removeItem(keyFor(sessionId));
  } catch { /**/ }
}