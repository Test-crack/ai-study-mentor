import { describe, it, expect } from 'vitest';
import {
  skillBandsForSitting,
  buildBandArc,
  buildRadar,
  buildPerformanceTable,
  buildTrajectory,
} from './reportData';

const sc = (skill: string, band: number) => ({ skill, band });

describe('skillBandsForSitting', () => {
  it('averages sub-skill bands within a skill', () => {
    expect(skillBandsForSitting([sc('WRITING', 5.0), sc('WRITING', 6.0)])).toEqual({
      Writing: 5.5,
    });
  });

  it('never mixes skills together', () => {
    const out = skillBandsForSitting([sc('Listening', 7.0), sc('Speaking', 4.0)]);
    expect(out).toEqual({ Listening: 7, Speaking: 4 });
  });

  it('accepts any casing the endpoints use', () => {
    expect(skillBandsForSitting([sc('listening', 6.5)])).toEqual({ Listening: 6.5 });
  });

  it('treats a 0 band as unscored, not as a zero band', () => {
    // An unattempted section would otherwise drag the skill average down.
    expect(skillBandsForSitting([sc('Reading', 0), sc('Reading', 6.0)])).toEqual({
      Reading: 6,
    });
  });

  it('ignores unknown skills rather than inventing a row', () => {
    expect(skillBandsForSitting([sc('GRAMMAR', 7)])).toEqual({});
  });
});

describe('buildBandArc', () => {
  it('is empty with no sittings — no fabricated baseline', () => {
    expect(buildBandArc([])).toEqual([]);
  });

  it('orders oldest first regardless of input order', () => {
    const arc = buildBandArc([
      { date: '2026-03-24', scores: [sc('Listening', 6.5)] },
      { date: '2026-03-10', scores: [sc('Listening', 6.0)] },
    ]);
    expect(arc.map((p) => p.Listening)).toEqual([6, 6.5]);
  });

  it('leaves a skill null when that sitting did not measure it', () => {
    // Carrying the previous value forward would imply a measurement that never
    // happened.
    const arc = buildBandArc([{ date: '2026-03-10', scores: [sc('Reading', 6)] }]);
    expect(arc[0].Reading).toBe(6);
    expect(arc[0].Speaking).toBeNull();
  });

  it('drops sittings with no usable score', () => {
    const arc = buildBandArc([
      { date: '2026-03-10', scores: [] },
      { date: '2026-03-12', scores: [sc('Writing', 5)] },
    ]);
    expect(arc).toHaveLength(1);
  });

  it('drops unparseable dates', () => {
    expect(buildBandArc([{ date: 'nope', scores: [sc('Writing', 5)] }])).toEqual([]);
  });
});

describe('buildRadar', () => {
  it('omits skills with no score instead of plotting zero', () => {
    const rows = buildRadar([{ skill: 'Listening', band_score: 6.5 }], 7.5);
    expect(rows).toEqual([{ skill: 'Listening', current: 6.5, target: 7.5 }]);
  });

  it('coerces string bands from the API', () => {
    expect(buildRadar([{ skill: 'Reading', band_score: '6.0' }], 7)[0].current).toBe(6);
  });

  it('skips a null band', () => {
    expect(buildRadar([{ skill: 'Writing', band_score: null }], 7)).toEqual([]);
  });
});

describe('buildPerformanceTable', () => {
  const comp = [
    { skill: 'Listening', band_score: 6.5 },
    { skill: 'Reading', band_score: 6.0 },
    { skill: 'Writing', band_score: 5.5 },
  ];

  it('always returns all four skills, marking unscored ones', () => {
    const rows = buildPerformanceTable(comp, 7.5, []);
    expect(rows).toHaveLength(4);
    const speaking = rows.find((r) => r.skill === 'Speaking')!;
    expect(speaking.current).toBeNull();
    expect(speaking.status).toBe('Not scored');
    expect(speaking.gap).toBeNull();
  });

  it('delta is null with fewer than two sittings, not a flattering +0.5', () => {
    const rows = buildPerformanceTable(comp, 7.5, [
      { date: '2026-03-10', scores: [sc('Listening', 6.0)] },
    ]);
    expect(rows.find((r) => r.skill === 'Listening')!.delta).toBeNull();
  });

  it('delta compares the two most recent sittings and can be negative', () => {
    const rows = buildPerformanceTable(comp, 7.5, [
      { date: '2026-03-10', scores: [sc('Listening', 6.5)] },
      { date: '2026-03-20', scores: [sc('Listening', 6.0)] },
    ]);
    expect(rows.find((r) => r.skill === 'Listening')!.delta).toBe(-0.5);
  });

  it('counts sessions per skill, not per sitting', () => {
    const rows = buildPerformanceTable(comp, 7.5, [
      { date: '2026-03-10', scores: [sc('Listening', 6), sc('Reading', 5)] },
      { date: '2026-03-20', scores: [sc('Listening', 6.5)] },
    ]);
    expect(rows.find((r) => r.skill === 'Listening')!.sessions).toBe(2);
    expect(rows.find((r) => r.skill === 'Reading')!.sessions).toBe(1);
  });

  it('escalates status as the gap widens', () => {
    const rows = buildPerformanceTable(
      [
        { skill: 'Listening', band_score: 7.0 },
        { skill: 'Reading', band_score: 5.5 },
        { skill: 'Writing', band_score: 4.0 },
      ],
      7.5,
      []
    );
    expect(rows.find((r) => r.skill === 'Listening')!.status).toBe('On Track');
    expect(rows.find((r) => r.skill === 'Reading')!.status).toBe('At Risk');
    expect(rows.find((r) => r.skill === 'Writing')!.status).toBe('Critical');
  });
});

describe('buildTrajectory', () => {
  it('is empty without an exam date — no invented horizon', () => {
    expect(buildTrajectory(6, 7.5, null, 0.125, '2026-03-24')).toEqual([]);
  });

  it('is empty when the exam date has passed', () => {
    expect(buildTrajectory(6, 7.5, '2026-01-01', 0.125, '2026-03-24')).toEqual([]);
  });

  it('starts at the current band and rises with pace', () => {
    const t = buildTrajectory(5.5, 7.5, '2026-06-15', 0.125, '2026-03-24');
    expect(t[0].projected).toBe(5.5);
    expect(t[t.length - 1].projected).toBeGreaterThan(5.5);
  });

  it('stays flat at zero pace rather than projecting a rise', () => {
    const t = buildTrajectory(5.5, 7.5, '2026-06-15', 0, '2026-03-24');
    expect(t.every((p) => p.projected === 5.5)).toBe(true);
  });

  it('never dips below the current band', () => {
    const t = buildTrajectory(6, 7.5, '2026-06-15', -0.5, '2026-03-24');
    expect(t.every((p) => p.projected >= 6)).toBe(true);
  });

  it('caps at the top of the band scale', () => {
    const t = buildTrajectory(8.5, 9, '2027-06-15', 0.5, '2026-03-24');
    expect(Math.max(...t.map((p) => p.projected))).toBe(9);
  });
});
