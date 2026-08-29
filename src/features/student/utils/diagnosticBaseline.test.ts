import { describe, it, expect } from "vitest";
import { baselineBySkill, type DiagnosticEntry } from "./diagnosticBaseline";

const entry = (
  skill: string,
  band_score: number,
  created_at: string
): DiagnosticEntry => ({ id: `${skill}-${created_at}`, skill, band_score, sub_scores: null, created_at });

describe("baselineBySkill", () => {
  it("is empty for no entries, so no growth chip renders", () => {
    expect(baselineBySkill([])).toEqual({});
  });

  it("keys upper-case so it matches either endpoint's casing", () => {
    expect(baselineBySkill([entry("Listening", 4.5, "2026-01-01")])).toEqual({
      LISTENING: 4.5,
    });
  });

  it("keeps the oldest entry when a skill appears more than once", () => {
    const map = baselineBySkill([
      entry("READING", 6.0, "2026-03-01"),
      entry("READING", 4.0, "2026-01-01"),
    ]);
    expect(map.READING).toBe(4.0);
  });

  it("skips entries with no band score rather than recording null", () => {
    const broken = { ...entry("WRITING", 0, "2026-01-01"), band_score: null };
    expect(baselineBySkill([broken as unknown as DiagnosticEntry])).toEqual({});
  });

  it("coerces string band scores the API may send", () => {
    const stringy = { ...entry("SPEAKING", 0, "2026-01-01"), band_score: "5.5" };
    expect(baselineBySkill([stringy as unknown as DiagnosticEntry])).toEqual({
      SPEAKING: 5.5,
    });
  });
});
