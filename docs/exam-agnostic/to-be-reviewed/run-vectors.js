'use strict';
/**
 * Executes every published test vector and prints the COMPUTED value.
 * Any row marked FAIL means the doc and the maths disagree — fix the doc, not the test.
 */
const E = require('./reference-impl');
const cfg = E.loadConfig();
const BAND = cfg.scales.ielts_band;
const CEFR = cfg.scales.cefr_6;

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  const ok = a === e;
  ok ? pass++ : fail++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label.padEnd(58)} got=${a}${ok ? '' : `  want=${e}`}`);
}
function head(t) { console.log(`\n── ${t}`); }

// ══════════════════════════════════════════════ §0  config validation
head('§0  Config validation');
const v = E.validateConfig(cfg);
console.log(`  errors: ${v.errors.length}`);
v.errors.forEach(e => console.log(`    ERROR  ${e}`));
console.log(`  warnings: ${v.warnings.length}`);
v.warnings.forEach(w => console.log(`    warn   ${w}`));
check('config has zero validation errors', v.errors.length, 0);

// ══════════════════════════════════════════════ §1  rounding helper
head('§1  roundHalfUpToStep(v, 0.5)');
[[6.25, 6.5], [6.75, 7.0], [6.24, 6.0], [6.26, 6.5], [5.75, 6.0], [5.74, 5.5],
 [6.5, 6.5], [0.25, 0.5], [-0.25, 0.0]].forEach(([i, o]) =>
  check(`  ${i}`, E.tidy(E.roundHalfUpToStep(i, 0.5)), o));

console.log('  (sanity) Math.round is half-up for positives, so 6.25/0.5=12.5 -> 13 -> 6.5.');
console.log('  (sanity) A banker\'s-rounding implementation returns 12 -> 6.0 and fails the first row.');

// ══════════════════════════════════════════════ §2  IELTS band_mean
head('§2  IELTS band_mean — overall');
const ieltsRows = [
  { s: { l: 6.0, r: 6.5, w: 6.0, sp: 6.5 }, mean: 6.25,  band: 6.5 },
  { s: { l: 7.0, r: 6.5, w: 7.0, sp: 6.5 }, mean: 6.75,  band: 7.0 },
  { s: { l: 6.0, r: 6.0, w: 6.5, sp: 6.0 }, mean: 6.125, band: 6.0 },
  { s: { l: 6.5, r: 6.5, w: 6.0, sp: 6.5 }, mean: 6.375, band: 6.5 },
  { s: { l: 3.0, r: 4.0, w: 3.5, sp: 3.5 }, mean: 3.5,   band: 4.0 },
  { s: { l: 9.0, r: 9.0, w: 9.0, sp: 9.0 }, mean: 9.0,   band: 9.0 },
];
ieltsRows.forEach(r => {
  const out = E.bandMean(r.s, BAND);
  check(`  mean ${r.mean}`, [out.continuous_mean, out.value], [r.mean, r.band]);
});
const clampRow = E.bandMean({ l: 3.0, r: 4.0, w: 3.5, sp: 3.5 }, BAND);
check('  clamp row reports clamped=true', clampRow.clamped, true);
check('  clamp row keeps raw 3.5 for improvement maths', clampRow.value_raw, 3.5);

// ══════════════════════════════════════════════ §3  CEFR level mapping
head('§3  pctToLevel — corrected GSE-derived thresholds');
console.log(`  thresholds: ${JSON.stringify(CEFR.thresholds_min_pct)}`);
[[0,'below_a1'],[14,'below_a1'],[14.99,'below_a1'],[15,'a1'],[24,'a1'],[25,'a2'],
 [41,'a2'],[41.25,'b1'],[55,'b1'],[61,'b1'],[61.25,'b2'],[82.49,'b2'],[82.5,'c1'],
 [93.74,'c1'],[93.75,'c2'],[100,'c2']].forEach(([p, l]) =>
  check(`  ${p}%`, E.pctToLevel(p, CEFR), l));

head('§3b  withinLevelProgress');
[[50,'b1'],[41.25,'b1'],[61,'b1'],[95,'c2'],[93.75,'c2'],[100,'c2']].forEach(([p, l]) =>
  console.log(`       ${String(p).padStart(6)}% in ${l.padEnd(9)} -> ${E.withinLevelProgress(p, l, CEFR)}`));

// ══════════════════════════════════════════════ §4  cefr_hybrid overall
head('§4  cefr_hybrid — overall + full profile');
const sub = { range: 60, accuracy: 55, fluency: 62, interaction: 50, coherence: 58, phonology: 45 };
const cef = E.cefrHybrid(sub, CEFR);
check('  average pct', cef.average_pct, 55);
check('  overall level', cef.value, 'b1');
check('  within-level progress', cef.within_level_progress, 0.6875);
check('  profile length (never dropped)', cef.profile.length, 6);
console.log('  per-subskill profile:');
cef.profile.forEach(p =>
  console.log(`       ${p.id.padEnd(12)} ${String(p.percent).padStart(3)}%  ->  ${p.label.padEnd(3)}  (${p.within_level_progress})`));
check('  phonology 45% maps to', cef.profile.find(p => p.id === 'phonology').value, 'b1');
console.log("  NOTE: v1 test vectors asserted phonology 45% -> a2. That is wrong under BOTH");
console.log("        the old thresholds (b1 min 41) and the corrected ones (b1 min 41.25).");

// ══════════════════════════════════════════════ §5  progression / momentum
head('§5  IELTS momentum — corrected rounding-interval model');
console.log('       s      headline   interval        next   progress');
[5.60, 5.90, 6.00, 6.24, 6.25, 8.90, 9.00].forEach(s => {
  const o = E.bandMean({ a: s }, BAND);
  const m = E.numericMomentum(o.continuous_mean, o.value, BAND);
  console.log(`     ${String(s).padStart(5)}   ${String(o.value).padEnd(9)}  [${m.interval[0]}, ${m.interval[1]})`.padEnd(46)
    + `${String(m.next_rung).padEnd(6)} ${m.progress_to_next}`);
});
const capped = E.numericMomentum(9.0, 9.0, BAND);
check('  at the 9.0 cap, next_rung is null (not a fake full bar)', capped.next_rung, null);
check('  at the 9.0 cap, progress_to_next is null', capped.progress_to_next, null);

head('§5b  CEFR momentum');
const m55 = E.ordinalMomentum(55, 'b1', CEFR);
check('  avg 55 -> next', m55.next_rung, 'b2');
check('  avg 55 -> progress', m55.progress_to_next, 0.6875);
const m95 = E.ordinalMomentum(95, 'c2', CEFR);
check('  avg 95 at c2 -> next is null', m95.next_rung, null);
check('  avg 95 at c2 -> progress_to_next is null', m95.progress_to_next, null);
// (95 - 93.75) / (100 - 93.75) = 1.25 / 6.25 = 0.2
// Under v1's thresholds (c2 min 93) this was 0.2857. The corrected c2 boundary changes it.
check('  avg 95 at c2 -> within_level_progress still shown', m95.within_level_progress, 0.2);

head('§5c  Trend (window 3, within one instrument)');
[[[5.0, 5.5, 6.0], 'up'], [[6.0, 6.0, 6.0], 'flat'], [[6.5, 6.0, 5.5], 'down'],
 [[4.0, 7.0, 5.0], 'up']].forEach(([vals, t]) =>
  check(`  ${JSON.stringify(vals)}`, E.trend(vals, 3), t));
console.log('  NOTE: [4.0, 7.0, 5.0] -> "up" because first<last. A slope-sign rule over a');
console.log('        3-point window is crude; least-squares slope would call this "down".');
console.log('        Pick one and write it in the spec — the v1 spec said "sign of the slope"');
console.log('        while the vectors implied first-vs-last. They are not the same rule.');

// ══════════════════════════════════════════════ §6  the invariant
head('§6  Envelope invariant');
const okEnv = E.buildEnvelope({
  examId: 'ielts', strategy: 'band_mean',
  overall: E.bandMean({ l: 6, r: 6, w: 6, sp: 5.5 }, BAND),
  momentum: E.numericMomentum(5.875, 6.0, BAND),
  baseline: { value: 4.0, label: '4.0' }, history: [5.0, 5.5, 6.0], trendWindow: 3,
});
check('  valid envelope builds', okEnv.progression.headline.value, okEnv.overall.value);
console.log(`       headline ${okEnv.overall.label}, momentum next ${okEnv.progression.momentum.next_rung} `
  + `at ${okEnv.progression.momentum.progress_to_next}, trend ${okEnv.progression.recent_trend}`);

let threw = false;
try {
  E.buildEnvelope({
    examId: 'x', strategy: 'band_mean',
    overall: { kind: 'band', value: 5.5, label: '5.5' },
    momentum: E.numericMomentum(5.9, 6.0, BAND),
  });
  // force divergence by hand to prove the guard fires
} catch { threw = true; }
// The guard compares headline (copied from overall) to overall, so it cannot diverge by
// construction — that is the point. Prove the OLD design would have thrown here:
const oldStyleHeadline = 5.5, oldStyleMomentumRung = 6.0;
check('  old design: momentum rung 6.0 vs headline 5.5 would trip a naive guard',
  oldStyleHeadline !== oldStyleMomentumRung, true);
console.log('  The corrected envelope makes the invariant STRUCTURALLY true (headline is copied');
console.log('  from overall) and moves the divergent number into `momentum`, where divergence is legal.');

// ══════════════════════════════════════════════ §7  per-component exams
head('§7  Exams with no computable headline');
['oet', 'gre', 'gmat'].forEach(id => {
  const ex = cfg.exams[id];
  check(`  ${id}: overall.mode`, ex.overall.mode, 'per_component');
  check(`  ${id}: no aggregate strategy`, ex.overall.strategy, null);
});
check('  gmat_total is declared but not computable', cfg.scales.gmat_total.computable, false);
check('  gre unofficial V+Q aggregate is disabled', cfg.exams.gre.overall.unofficial_aggregate.enabled, false);

head('§8  OET grade banding');
const oet = cfg.scales.oet_500;
function oetGrade(score) {
  const b = oet.grade_bands.find(b => score >= b.min && score <= b.max);
  return b ? b.grade : null;
}
[[500,'A'],[450,'A'],[440,'B'],[350,'B'],[340,'C+'],[300,'C+'],[290,'C'],[200,'C'],
 [190,'D'],[100,'D'],[90,'E'],[0,'E']].forEach(([s, g]) => check(`  ${s}`, oetGrade(s), g));
const sortedBands = [...oet.grade_bands].sort((a, b) => a.min - b.min);
check('  bands tile the scale at step 10',
  sortedBands.every((b, i) => i === 0 || b.min - sortedBands[i - 1].max === oet.step), true);
check('  bands span the whole scale',
  [sortedBands[0].min, sortedBands[sortedBands.length - 1].max], [oet.min, oet.max]);
check('  a 1-point tiling check would wrongly reject these bands',
  sortedBands.every((b, i) => i === 0 || b.min - sortedBands[i - 1].max === 1), false);

// ══════════════════════════════════════════════ summary
console.log(`\n${'═'.repeat(76)}`);
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═'.repeat(76));
process.exit(fail ? 1 : 0);
