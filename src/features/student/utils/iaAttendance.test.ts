import { describe, it, expect } from "vitest";
import {
  getMissStreak,
  getMissedCount,
  getAttendancePct,
  getCarryForwardSubSkills,
  observedPacePerWeek,
  getMissStreakDates,
  formatDateList,
  type IAHistoryEntry,
} from "./iaAttendance";

const ia = (
  n: number,
  date: string,
  status: "COMPLETED" | "MISSED",
  carry: { skill: string; sub_skill: string }[] = []
): IAHistoryEntry => ({
  id: `ia-${n}`,
  ia_number: n,
  ia_date: date,
  status,
  time_submitted_at: status === "COMPLETED" ? date : null,
  momentum_awarded: status === "COMPLETED" ? 10 : null,
  carry_forward_subskills: carry,
});

describe("getMissStreak", () => {
  it("is 0 for an empty history, so a loading dashboard never flashes catch-up", () => {
    expect(getMissStreak([])).toBe(0);
  });

  it("counts only the current run, not the lifetime total", () => {
    // 2 old misses, then recovery. Lifetime total is 2 but the student is back.
    const h = [
      ia(1, "2026-01-01", "MISSED"),
      ia(2, "2026-01-08", "MISSED"),
      ia(3, "2026-01-15", "COMPLETED"),
    ];
    expect(getMissStreak(h)).toBe(0);
    expect(getMissedCount(h)).toBe(2);
  });

  it("counts the current run regardless of array order", () => {
    const h = [
      ia(3, "2026-01-15", "MISSED"),
      ia(1, "2026-01-01", "COMPLETED"),
      ia(2, "2026-01-08", "MISSED"),
    ];
    expect(getMissStreak(h)).toBe(2);
  });

  it("crosses the >= 2 gate that switches on the catch-up UI", () => {
    const h = [
      ia(1, "2026-01-01", "COMPLETED"),
      ia(2, "2026-01-08", "MISSED"),
    ];
    expect(getMissStreak(h)).toBe(1);
    expect(getMissStreak([...h, ia(3, "2026-01-15", "MISSED")])).toBe(2);
  });
});

describe("getAttendancePct", () => {
  it("is 0 rather than NaN on an empty history", () => {
    expect(getAttendancePct([])).toBe(0);
  });

  it("rounds to a whole percent", () => {
    const h = [
      ia(1, "2026-01-01", "COMPLETED"),
      ia(2, "2026-01-08", "COMPLETED"),
      ia(3, "2026-01-15", "MISSED"),
    ];
    expect(getAttendancePct(h)).toBe(67);
  });
});

describe("getCarryForwardSubSkills", () => {
  it("returns sub-skills from the current miss run only", () => {
    const h = [
      ia(1, "2026-01-01", "MISSED", [{ skill: "Writing", sub_skill: "Task Response" }]),
      ia(2, "2026-01-08", "COMPLETED"),
      ia(3, "2026-01-15", "MISSED", [{ skill: "Writing", sub_skill: "Coherence" }]),
    ];
    expect(getCarryForwardSubSkills(h)).toEqual(["Coherence"]);
  });

  it("de-duplicates across the run, most recent first", () => {
    const h = [
      ia(1, "2026-01-08", "MISSED", [{ skill: "Speaking", sub_skill: "Word Stress" }]),
      ia(2, "2026-01-15", "MISSED", [
        { skill: "Writing", sub_skill: "Coherence" },
        { skill: "Speaking", sub_skill: "Word Stress" },
      ]),
    ];
    expect(getCarryForwardSubSkills(h)).toEqual(["Coherence", "Word Stress"]);
  });

  it("survives a missing carry_forward_subskills field", () => {
    const broken = { ...ia(1, "2026-01-01", "MISSED"), carry_forward_subskills: undefined };
    expect(getCarryForwardSubSkills([broken as unknown as IAHistoryEntry])).toEqual([]);
  });
});

describe("observedPacePerWeek", () => {
  it("is null with fewer than two points — no slope to claim", () => {
    expect(observedPacePerWeek([])).toBeNull();
    expect(observedPacePerWeek([{ date: "2026-01-01", band: 5 }])).toBeNull();
  });

  it("is null when the points span under a week", () => {
    expect(
      observedPacePerWeek([
        { date: "2026-01-01", band: 5.0 },
        { date: "2026-01-03", band: 6.0 },
      ])
    ).toBeNull();
  });

  it("returns band movement per week", () => {
    const pace = observedPacePerWeek([
      { date: "2026-01-01", band: 5.0 },
      { date: "2026-01-29", band: 6.0 },
    ]);
    expect(pace).toBeCloseTo(0.25, 5);
  });

  it("can be negative — a stalled student is not flattered", () => {
    const pace = observedPacePerWeek([
      { date: "2026-01-01", band: 6.0 },
      { date: "2026-01-29", band: 5.5 },
    ]);
    expect(pace).toBeLessThan(0);
  });
});

describe("getMissStreakDates", () => {
  it("is empty when nothing is missed", () => {
    expect(getMissStreakDates([ia(1, "2026-08-12", "COMPLETED")])).toEqual([]);
  });

  it("returns the current run oldest-first, formatted for prose", () => {
    const h = [
      ia(1, "2026-08-12", "MISSED"),
      ia(2, "2026-08-15", "MISSED"),
      ia(3, "2026-08-18", "MISSED"),
    ];
    expect(getMissStreakDates(h)).toEqual(["12 Aug", "15 Aug", "18 Aug"]);
  });

  it("stops at the last completed assessment", () => {
    const h = [
      ia(1, "2026-08-01", "MISSED"),
      ia(2, "2026-08-08", "COMPLETED"),
      ia(3, "2026-08-15", "MISSED"),
    ];
    expect(getMissStreakDates(h)).toEqual(["15 Aug"]);
  });

  it("drops unparseable dates rather than rendering 'Invalid Date'", () => {
    const h = [ia(1, "not-a-date", "MISSED"), ia(2, "2026-08-18", "MISSED")];
    expect(getMissStreakDates(h)).toEqual(["18 Aug"]);
  });
});

describe("formatDateList", () => {
  it("handles none, one, two and many", () => {
    expect(formatDateList([])).toBe("");
    expect(formatDateList(["12 Aug"])).toBe("12 Aug");
    expect(formatDateList(["12 Aug", "15 Aug"])).toBe("12 Aug and 15 Aug");
    expect(formatDateList(["12 Aug", "15 Aug", "18 Aug"])).toBe(
      "12 Aug, 15 Aug and 18 Aug"
    );
  });
});
