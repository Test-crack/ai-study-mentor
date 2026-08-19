// scripts/check-score-formatters.ts
//
// Regression guard for the band_score → ExamConfig migration (FE-1).
//
// Asserts that the new formatters render EXACTLY what the old inline
// `.toFixed(1)` call sites rendered, for IELTS. That equivalence is the
// acceptance criterion for the whole sweep: if this script is clean, the
// migration is invisible to an IELTS user.
//
// Run:  npx vite-node scripts/check-score-formatters.ts
//
// Uses a relative import on purpose — examRegistry has no runtime imports, so
// this runs without needing Vite's `@/` alias resolution.

import { EXAM_REGISTRY, cefrFromScore } from '../src/shared/config/examRegistry';

const IELTS = EXAM_REGISTRY.IELTS;
const SPOKEN = EXAM_REGISTRY.SPOKEN;
const OET = EXAM_REGISTRY.OET;

let failures = 0;
const check = (name: string, actual: string, expected: string) => {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(34)} expected=${expected.padEnd(6)} actual=${actual}`,
  );
};

// ─── 1. IELTS skill scores must match the old `x != null ? x.toFixed(1) : "—"` ──
// This is the pattern at the sites migrated so far. Quarter-values are the ones
// that matter: banding them to 0.5 would inflate displayed skill scores.

console.log('\n── IELTS skill score ≡ old inline .toFixed(1) ──');
const skillCases: Array<number | null | undefined> = [
  null, undefined, 0, 4, 5.5, 6, 6.25, 6.3, 6.5, 6.75, 7, 8.5, 9,
];
for (const v of skillCases) {
  const oldBehaviour = v !== null && v !== undefined ? v.toFixed(1) : '—';
  check(`skill(${String(v)})`, IELTS.formatSkillScore(v).display, oldBehaviour);
}

// ─── 2. IELTS overall IS banded to 0.5 — intentionally different ───────────────
// TC-04 §3: overall() is the mean rounded to 0.5. Only the overall band bands.

console.log('\n── IELTS overall band (rounds to 0.5 by design) ──');
check('overall(6.25)', IELTS.formatOverall(6.25).display, '6.5');
check('overall(6.4)', IELTS.formatOverall(6.4).display, '6.5');
check('overall(6.75)', IELTS.formatOverall(6.75).display, '7.0');
check('overall(6.5)', IELTS.formatOverall(6.5).display, '6.5');
check('overall(null)', IELTS.formatOverall(null).display, '—');
check('overall label', IELTS.formatOverall(null).label, 'Band');

// ─── 3. CEFR thresholding (TC-03 D1) ──────────────────────────────────────────
// ⚠️ These expectations encode the PROVISIONAL threshold table in
// examRegistry.ts. They are our assumption, not a published mapping — see the
// note in §"Review this" of the handover. Change the table, change these.

console.log('\n── SPOKEN / CEFR banded thresholds (PROVISIONAL) ──');
check('cefr(1.0)', cefrFromScore(1), 'A1');
check('cefr(3.0)', cefrFromScore(3), 'A2');
check('cefr(4.5)', cefrFromScore(4.5), 'B1');
check('cefr(6.0)', cefrFromScore(6), 'B2');
check('cefr(7.5)', cefrFromScore(7.5), 'C1');
check('cefr(8.5)', cefrFromScore(8.5), 'C2');
check('spoken label', SPOKEN.formatOverall(null).label, 'CEFR Level');
// An explicit level from the API must win over our own thresholding.
check(
  'sub_scores.cefr_level overrides',
  SPOKEN.formatOverall(4, { cefr_level: 'C1' }).display,
  'C1',
);
check(
  'bad sub_scores falls back',
  SPOKEN.formatOverall(6, { cefr_level: 'NOPE' }).display,
  'B2',
);

// ─── 4. OET grades (TC-03 §7 Q11 — Grade B ≈ 350) ─────────────────────────────

console.log('\n── OET weakest-skill grade ──');
check('oet(460)', OET.formatOverall(460).display, 'A');
check('oet(350)', OET.formatOverall(350).display, 'B');
check('oet(349)', OET.formatOverall(349).display, 'C+');
check('oet label', OET.formatOverall(null).label, 'Grade');

// ─── 5. No exam name is ever hand-typeable (TC-03 §5.1) ───────────────────────

console.log('\n── legal display strings present ──');
for (const cfg of [IELTS, SPOKEN, OET]) {
  check(
    `${cfg.examType} has legalDisplayName`,
    String(cfg.legalDisplayName.length > 0),
    'true',
  );
  check(`${cfg.examType} has trademarkOwner`, String(cfg.trademarkOwner.length > 0), 'true');
}

console.log(`\n${failures === 0 ? '✓ ALL CLEAN' : `✗ ${failures} FAILURE(S)`}\n`);
process.exit(failures === 0 ? 0 : 1);
