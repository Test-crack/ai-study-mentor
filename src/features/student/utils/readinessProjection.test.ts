import { describe, it, expect } from 'vitest';
import {
  resolvePace,
  projectBand,
  toDisplayBand,
  BASE_PACE_PER_WEEK,
} from './readinessProjection';

describe('resolvePace', () => {
  it('falls back to the assumed pace when there is no observed slope', () => {
    // null means "not enough data to claim a slope" — NOT "no progress".
    expect(resolvePace(null, 1.0)).toEqual({
      pace: BASE_PACE_PER_WEEK,
      source: 'assumed',
    });
  });

  it('applies the consistency factor only to the assumed pace', () => {
    expect(resolvePace(null, 0.6).pace).toBeCloseTo(BASE_PACE_PER_WEEK * 0.6, 6);
  });

  it('uses the observed slope as-is, without re-applying consistency', () => {
    // A student who misses sessions already has a flatter real slope; applying
    // the factor again would penalise the same behaviour twice.
    expect(resolvePace(0.3, 0.6)).toEqual({ pace: 0.3, source: 'observed' });
  });

  it('floors a negative observed slope at zero — never projects a decline', () => {
    expect(resolvePace(-0.4, 1.0)).toEqual({ pace: 0, source: 'observed' });
  });

  it('treats a zero slope as observed, not missing', () => {
    expect(resolvePace(0, 1.0)).toEqual({ pace: 0, source: 'observed' });
  });
});

describe('projectBand', () => {
  it('projects forward at the given pace', () => {
    expect(projectBand(5.0, 0.125, 8)).toBeCloseTo(6.0, 6);
  });

  it('never projects below the current band', () => {
    // The floor that makes honest pace safe to ship.
    expect(projectBand(6.0, 0, 12)).toBe(6.0);
  });

  it('returns the current band when the exam date has passed', () => {
    expect(projectBand(6.5, 0.125, 0)).toBe(6.5);
    expect(projectBand(6.5, 0.125, -4)).toBe(6.5);
  });

  it('caps at the top of the band scale', () => {
    expect(projectBand(8.5, 0.5, 20)).toBe(9.0);
  });

  it('a stalled student projects flat rather than down', () => {
    const { pace } = resolvePace(-0.5, 1.0);
    expect(projectBand(5.5, pace, 10)).toBe(5.5);
  });

  it('a fast improver projects above the assumed pace', () => {
    const assumed = projectBand(5.0, resolvePace(null, 1.0).pace, 8);
    const fast = projectBand(5.0, resolvePace(0.3, 1.0).pace, 8);
    expect(fast).toBeGreaterThan(assumed);
  });

  it('two students at the same band with different histories now differ', () => {
    // The whole point of the change — this assertion would have failed before.
    const stalled = projectBand(5.0, resolvePace(0, 1.0).pace, 12);
    const improving = projectBand(5.0, resolvePace(0.2, 1.0).pace, 12);
    expect(stalled).not.toBe(improving);
  });
});

describe('toDisplayBand', () => {
  it('rounds to half bands', () => {
    expect(toDisplayBand(6.24)).toBe(6.0);
    expect(toDisplayBand(6.26)).toBe(6.5);
    expect(toDisplayBand(6.75)).toBe(7.0);
  });
});
