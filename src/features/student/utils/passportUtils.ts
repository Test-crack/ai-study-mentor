/**
 * passportUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Skill Passport — Weekly Rotation System
 *
 * Each week the student has 5 slots to stamp:
 *   Speaking    → stamped by DrillScreen (any drill session complete)
 *   Vocabulary  → stamped by LexiGrid (all 5 words solved)
 *   Writing     → stamped by IeltsWriting (one task submitted)
 *   Reading     → stamped by ReadingPractice OR SpeedReading (one session)
 *   Listening   → stamped by ListeningPractice (one section submitted)
 *
 * Completing all 5 in a calendar week → +150 Momentum
 * 3 consecutive fully-completed weeks → additional +200 streak bonus
 *
 * Resets every Monday (ISO week boundary).
 * Passport is purely additive — it never blocks the drill cycle.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type PassportSlot = 'speaking' | 'vocabulary' | 'writing' | 'reading' | 'listening';

export interface SkillPassport {
  /** ISO week string — e.g. "2026-W19" */
  weekKey: string;
  slots: Record<PassportSlot, boolean>;
  /** Has the +150 bonus been awarded this week? */
  bonusClaimed: boolean;
  /** ISO week strings of the last N fully-completed weeks (for streak tracking) */
  completedWeeks: string[];
  /** Has the 3-week streak +200 bonus been awarded for the current streak? */
  streakBonusClaimed: boolean;
}

const LS_KEY = 'skill_passport';

// ─── ISO Week helper ──────────────────────────────────────────────────────────

/**
 * Returns an ISO week key like "2026-W19" for the current date.
 * Weeks start on Monday per ISO 8601.
 */
export function getCurrentWeekKey(): string {
  const now = new Date();
  // Copy date so we don't mutate
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  // Set to nearest Thursday (ISO week is defined by Thursday)
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─── Read / write ─────────────────────────────────────────────────────────────

export function readPassport(): SkillPassport {
  const weekKey = getCurrentWeekKey();
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed: SkillPassport = JSON.parse(stored);
      // If same week return as-is
      if (parsed.weekKey === weekKey) return parsed;
      // Week rolled over — preserve completed weeks history, reset slots
      const completedWeeks = parsed.slots
        ? allSlotsComplete(parsed.slots)
          ? [...(parsed.completedWeeks ?? []), parsed.weekKey].slice(-4)
          : (parsed.completedWeeks ?? [])
        : (parsed.completedWeeks ?? []);
      return freshPassport(weekKey, completedWeeks, parsed.streakBonusClaimed);
    }
  } catch { /* ignore */ }
  return freshPassport(weekKey, [], false);
}

export function writePassport(passport: SkillPassport): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(passport));
  } catch { /* ignore */ }
}

// ─── Core stamp function ──────────────────────────────────────────────────────

/**
 * Stamps a slot in the current week's passport.
 * Returns the updated passport so the caller can check bonus conditions.
 * Does NOT fire momentum — caller is responsible for awarding points
 * after checking `bonusJustUnlocked` and `streakBonusJustUnlocked`.
 */
export interface StampResult {
  passport:               SkillPassport;
  /** True if this stamp completed all 5 slots for the first time */
  bonusJustUnlocked:      boolean;
  /** True if this completion triggered the 3-week streak bonus */
  streakBonusJustUnlocked: boolean;
}

export function stampPassportSlot(slot: PassportSlot): StampResult {
  const passport = readPassport();

  // Already stamped — no-op
  if (passport.slots[slot]) {
    return { passport, bonusJustUnlocked: false, streakBonusJustUnlocked: false };
  }

  const updated: SkillPassport = {
    ...passport,
    slots: { ...passport.slots, [slot]: true },
  };

  let bonusJustUnlocked      = false;
  let streakBonusJustUnlocked = false;

  // Check if all 5 slots are now complete
  if (allSlotsComplete(updated.slots) && !updated.bonusClaimed) {
    updated.bonusClaimed   = true;
    bonusJustUnlocked      = true;

    // Record this week as completed and check 3-week streak
    const completedWeeks = [...(updated.completedWeeks ?? []), updated.weekKey].slice(-4);
    updated.completedWeeks = completedWeeks;

    if (!updated.streakBonusClaimed && completedWeeks.length >= 3) {
      // Verify the last 3 are consecutive ISO weeks
      if (areConsecutiveWeeks(completedWeeks.slice(-3))) {
        updated.streakBonusClaimed = true;
        streakBonusJustUnlocked    = true;
      }
    }
  }

  writePassport(updated);
  return { passport: updated, bonusJustUnlocked, streakBonusJustUnlocked };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_SLOTS: PassportSlot[] = ['speaking', 'vocabulary', 'writing', 'reading', 'listening'];

export function allSlotsComplete(slots: Record<PassportSlot, boolean>): boolean {
  return ALL_SLOTS.every(s => slots[s]);
}

export function completedSlotCount(slots: Record<PassportSlot, boolean>): number {
  return ALL_SLOTS.filter(s => slots[s]).length;
}

function freshPassport(
  weekKey: string,
  completedWeeks: string[],
  streakBonusClaimed: boolean
): SkillPassport {
  return {
    weekKey,
    slots: { speaking: false, vocabulary: false, writing: false, reading: false, listening: false },
    bonusClaimed: false,
    completedWeeks,
    streakBonusClaimed,
  };
}

/**
 * Checks whether 3 week-key strings represent 3 consecutive ISO weeks.
 * e.g. ["2026-W17", "2026-W18", "2026-W19"] → true
 */
function areConsecutiveWeeks(weeks: string[]): boolean {
  if (weeks.length < 3) return false;
  for (let i = 1; i < weeks.length; i++) {
    const [prevYear, prevWeek] = weeks[i - 1].split('-W').map(Number);
    const [currYear, currWeek] = weeks[i].split('-W').map(Number);
    const prevTotal = prevYear * 53 + prevWeek;
    const currTotal = currYear * 53 + currWeek;
    if (currTotal - prevTotal !== 1) return false;
  }
  return true;
}

// ─── Momentum constants (imported by callers) ─────────────────────────────────
export const PASSPORT_BONUS_PTS        = 150;
export const PASSPORT_STREAK_BONUS_PTS = 200;