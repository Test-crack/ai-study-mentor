'use strict';
/**
 * Exam Engine — executable reference implementation (v2).
 *
 * Purpose: every number published in EE-02_Test_Vectors is COMPUTED by this file,
 * not asserted by hand. v1's test vectors contained at least two arithmetic errors
 * that survived review precisely because nobody executed them.
 *
 * This is a specification artefact, not production code. Port the maths, not the style.
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────── numeric helpers

/**
 * Round half UP to a step. NOT banker's rounding.
 * The epsilon defends against binary float representation (12.499999999 for 12.5).
 */
function roundHalfUpToStep(value, step) {
  return Math.round(value / step + 1e-9) * step;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Kill float dust: 6.800000000000001 -> 6.8 */
function tidy(v, dp = 6) {
  return Number(v.toFixed(dp));
}

// ────────────────────────────────────────────────────── ordinal scale helpers

function orderedLevels(scale) {
  return Object.entries(scale.thresholds_min_pct).sort((a, b) => a[1] - b[1]);
}

/** Highest level whose minimum threshold is <= pct. Thresholds are INCLUSIVE. */
function pctToLevel(pct, scale) {
  const ordered = orderedLevels(scale);
  let level = ordered[0][0];
  for (const [name, min] of ordered) if (pct >= min) level = name;
  return level;
}

/** Progress through the current level's band, 0..1. Upper bound for the top level is 100. */
function withinLevelProgress(pct, level, scale) {
  const ordered = orderedLevels(scale);
  const i = ordered.findIndex(([n]) => n === level);
  const lo = ordered[i][1];
  const hi = i + 1 < ordered.length ? ordered[i + 1][1] : 100;
  return tidy(clamp((pct - lo) / (hi - lo), 0, 1));
}

function nextLevel(level, scale) {
  const ordered = orderedLevels(scale);
  const i = ordered.findIndex(([n]) => n === level);
  return i + 1 < ordered.length ? ordered[i + 1][0] : null;
}

function levelIndex(level, scale) {
  return scale.levels.indexOf(level);
}

// ───────────────────────────────────────────────────────── scoring strategies

/**
 * band_mean (IELTS): mean of assessed component bands, rounded half-up to step,
 * then clamped to report_floor for DISPLAY.
 *
 * Returns both the clamped reported value and the unclamped raw value. The raw value
 * is what improvement-since-baseline is computed on — see EE-00 §3.4.
 */
function bandMean(componentScores, scale) {
  const vals = Object.values(componentScores);
  if (!vals.length) throw new Error('band_mean: no components in overall');
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const rounded = tidy(roundHalfUpToStep(mean, scale.step));
  const reported = tidy(clamp(rounded, scale.report_floor ?? scale.min, scale.max));
  return {
    kind: 'band',
    continuous_mean: tidy(mean),
    value_raw: rounded,
    value: reported,
    label: reported.toFixed(1),
    clamped: reported !== rounded,
  };
}

/**
 * cefr_hybrid (Spoken English): average the subskill percents, map the average to a
 * level, and ALWAYS return the full per-subskill profile alongside the headline.
 */
function cefrHybrid(subskillPercents, scale) {
  const entries = Object.entries(subskillPercents);
  if (!entries.length) throw new Error('cefr_hybrid: no subskills');
  const avg = tidy(entries.reduce((a, [, v]) => a + v, 0) / entries.length);
  const level = pctToLevel(avg, scale);
  return {
    kind: 'cefr_level',
    average_pct: avg,
    value: level,
    label: scale.labels[level],
    within_level_progress: withinLevelProgress(avg, level, scale),
    profile: entries.map(([id, pct]) => {
      const lv = pctToLevel(pct, scale);
      return {
        id,
        percent: pct,
        value: lv,
        label: scale.labels[lv],
        within_level_progress: withinLevelProgress(pct, lv, scale),
      };
    }),
  };
}

// ───────────────────────────────────────────────────────── progression layer

/**
 * Momentum for a NUMERIC scale.
 *
 * The v1 design set current_rung = floor(continuous mean) while the headline was the
 * half-up rounded value, so at s=5.90 it reported "band 6.0" and "80% of the way to 6.0"
 * simultaneously — and tripped its own invariant.
 *
 * Correct model: the momentum bar spans the ROUNDING INTERVAL of the current headline.
 * Band 6.0 covers continuous means [5.75, 6.25). The bar fills across that interval, and
 * hitting 100% is exactly the moment the headline would round up to the next band.
 */
function numericMomentum(continuousMean, headline, scale) {
  const step = scale.step;
  const lo = headline - step / 2;
  const atCap = headline >= scale.max;
  return {
    basis: 'rounding_interval',
    interval: [tidy(lo), tidy(lo + step)],
    next_rung: atCap ? null : tidy(headline + step),
    progress_to_next: atCap ? null : tidy(clamp((continuousMean - lo) / step, 0, 1)),
  };
}

/** Momentum for an ORDINAL scale. At the cap there is no next rung — null, never 1.0. */
function ordinalMomentum(avgPct, level, scale) {
  const next = nextLevel(level, scale);
  return {
    basis: 'within_level',
    next_rung: next,
    next_rung_label: next ? scale.labels[next] : null,
    progress_to_next: next ? withinLevelProgress(avgPct, level, scale) : null,
    within_level_progress: withinLevelProgress(avgPct, level, scale),
  };
}

function trend(values, window) {
  const w = values.slice(-window);
  if (w.length < 2) return 'flat';
  const first = w[0];
  const last = w[w.length - 1];
  if (last > first) return 'up';
  if (last < first) return 'down';
  return 'flat';
}

// ────────────────────────────────────────────────────────── result envelope

function buildEnvelope({ examId, strategy, overall, momentum, baseline, history, trendWindow }) {
  const env = {
    exam_id: examId,
    strategy,
    overall: {
      kind: overall.kind,
      value: overall.value,
      label: overall.label,
    },
    progression: {
      baseline: baseline ? { value: baseline.value, label: baseline.label, style: 'challenge' } : null,
      // headline MUST equal overall.value. This is the guarded field.
      headline: { value: overall.value, label: overall.label },
      // momentum is ALLOWED to differ from the headline. It is a separate display.
      momentum,
      recent_trend: history ? trend(history, trendWindow ?? 3) : null,
    },
  };

  // The invariant, corrected: it guards `headline`, not `momentum`.
  if (env.progression.headline.value !== env.overall.value) {
    throw new Error(
      `INVARIANT VIOLATION: progression.headline (${env.progression.headline.value}) !== overall (${env.overall.value})`
    );
  }
  return env;
}

// ───────────────────────────────────────────────────────── config validation

function validateConfig(cfg) {
  const errors = [];
  const warnings = [];

  // ---- scales
  for (const [id, s] of Object.entries(cfg.scales)) {
    if (id.startsWith('_')) continue;

    if (s.kind === 'ordinal') {
      const vals = Object.values(s.thresholds_min_pct);
      const asc = vals.every((v, i) => i === 0 || v > vals[i - 1]);
      if (!asc) errors.push(`scale ${id}: thresholds_min_pct must be strictly ascending`);
      if (vals[0] !== 0) errors.push(`scale ${id}: lowest threshold must be 0`);
      if (vals.some((v) => v < 0 || v > 100)) errors.push(`scale ${id}: thresholds must be within 0..100`);
      const declared = new Set(s.levels);
      for (const k of Object.keys(s.thresholds_min_pct)) {
        if (!declared.has(k)) errors.push(`scale ${id}: threshold '${k}' is not a declared level`);
      }
      for (const k of s.levels) {
        if (!(k in s.labels)) errors.push(`scale ${id}: level '${k}' has no label`);
      }
      if (s._calibration_status === 'PROVISIONAL_UNCALIBRATED') {
        warnings.push(`scale ${id}: thresholds are PROVISIONAL_UNCALIBRATED — results must carry a provisional notice`);
      }
    }

    if (s.kind === 'numeric') {
      if (s.report_floor != null && (s.report_floor < s.min || s.report_floor > s.max)) {
        errors.push(`scale ${id}: report_floor ${s.report_floor} outside [${s.min}, ${s.max}]`);
      }
      if (s.step > 0) {
        const span = (s.max - s.min) / s.step;
        if (Math.abs(span - Math.round(span)) > 1e-9) {
          errors.push(`scale ${id}: step ${s.step} does not divide the scale evenly`);
        }
      }
      if (s.grade_bands) {
        // Bands must tile the scale AT THE SCALE STEP, not at 1.
        const sorted = [...s.grade_bands].sort((a, b) => a.min - b.min);
        if (sorted[0].min !== s.min) errors.push(`scale ${id}: lowest grade band must start at ${s.min}`);
        if (sorted[sorted.length - 1].max !== s.max) errors.push(`scale ${id}: highest grade band must end at ${s.max}`);
        for (let i = 1; i < sorted.length; i++) {
          const gap = sorted[i].min - sorted[i - 1].max;
          if (Math.abs(gap - s.step) > 1e-9) {
            errors.push(
              `scale ${id}: grade bands ${sorted[i - 1].grade}/${sorted[i].grade} do not tile at step ${s.step} (gap ${gap})`
            );
          }
        }
      }
    }
  }

  // ---- exams
  const KNOWN_STRATEGIES = new Set(['band_mean', 'cefr_hybrid']);
  const KNOWN_MODES = new Set(['aggregate', 'per_component']);

  for (const [id, ex] of Object.entries(cfg.exams)) {
    const cids = new Set(ex.components.map((c) => c.id));
    const assessed = new Set(ex.components.filter((c) => c.assessed).map((c) => c.id));

    if (!KNOWN_MODES.has(ex.overall.mode)) errors.push(`${id}: unknown overall.mode '${ex.overall.mode}'`);

    if (ex.overall.mode === 'aggregate') {
      if (!KNOWN_STRATEGIES.has(ex.overall.strategy)) {
        errors.push(`${id}: unknown scoring strategy '${ex.overall.strategy}'`);
      }
      if (!ex.overall.components.length) errors.push(`${id}: overall.mode=aggregate but no components listed`);
      for (const c of ex.overall.components) {
        if (!cids.has(c)) errors.push(`${id}: overall.components references unknown component '${c}'`);
        else if (!assessed.has(c)) errors.push(`${id}: overall.components includes '${c}' which is assessed:false`);
      }
    }

    if (ex.overall.mode === 'per_component' && ex.overall.components.length) {
      errors.push(`${id}: overall.mode=per_component must not list components`);
    }

    for (const c of ex.components) {
      if (c.assessed && !c.scale) errors.push(`${id}.${c.id}: assessed component has no scale`);
      if (c.scale && !(c.scale in cfg.scales)) errors.push(`${id}.${c.id}: unknown scale '${c.scale}'`);
      if (!c.assessed && c.weight !== 0) warnings.push(`${id}.${c.id}: assessed:false but weight ${c.weight}`);

      const r = c.remediation;
      if (r) {
        if (r.level === 'subskill' && !(c.subskills || []).length) {
          errors.push(`${id}.${c.id}: remediation.level='subskill' but the component declares no subskills`);
        }
        if (r.level === 'item_tag' && !(c.item_tags || []).length) {
          errors.push(`${id}.${c.id}: remediation.level='item_tag' but the component declares no item_tags`);
        }
        if (r.trigger?.kind === 'below_level') {
          const sc = cfg.scales[c.scale];
          if (!sc || sc.kind !== 'ordinal') {
            errors.push(`${id}.${c.id}: trigger 'below_level' requires an ordinal scale`);
          } else if (!sc.levels.includes(r.trigger.value)) {
            errors.push(`${id}.${c.id}: trigger level '${r.trigger.value}' not in scale ${c.scale}`);
          }
        }
        if (!(r.content_refs || []).length && !(r.drill_tags || []).length) {
          warnings.push(`${id}.${c.id}: remediation declared but has no content_refs or drill_tags — it will surface nothing`);
        }
      }

      if (c.variant_scoped && !ex.variants) {
        errors.push(`${id}.${c.id}: variant_scoped:true but the exam declares no variants`);
      }
    }

    if (ex.variants) {
      for (const c of ex.variants.applies_to_components) {
        if (!cids.has(c)) errors.push(`${id}: variants.applies_to_components references unknown component '${c}'`);
      }
      const optIds = ex.variants.options.map((o) => o.id);
      if (!optIds.includes(ex.variants.default)) {
        errors.push(`${id}: variants.default '${ex.variants.default}' is not one of the declared options`);
      }
    }

    // Legal gate — mechanical, so it cannot be forgotten at launch.
    if (ex.status === 'live') {
      const L = ex.legal;
      if (!L.disclaimer_short || !L.disclaimer_full) errors.push(`${id}: live exam missing disclaimer text`);
      if (L.may_use_mark_in_product_name === false) {
        const mark = (ex.naming.short_code || '').toUpperCase();
        const name = (ex.naming.public_display_name || '').toUpperCase();
        if (mark && name.includes(mark)) {
          warnings.push(
            `${id}: may_use_mark_in_product_name=false but public_display_name contains '${mark}' — counsel must sign this off`
          );
        }
      }
      if ((L._status || '').startsWith('BLOCKED')) errors.push(`${id}: status 'live' but legal is ${L._status}`);
    }

    if (ex.target?.kind === 'per_component' && ex.target.per_component_default) {
      for (const c of Object.keys(ex.target.per_component_default)) {
        if (!cids.has(c)) errors.push(`${id}: target.per_component_default references unknown component '${c}'`);
      }
    }
  }

  return { errors, warnings };
}

module.exports = {
  roundHalfUpToStep, clamp, tidy,
  pctToLevel, withinLevelProgress, nextLevel, levelIndex,
  bandMean, cefrHybrid,
  numericMomentum, ordinalMomentum, trend,
  buildEnvelope, validateConfig,
  loadConfig: () => JSON.parse(fs.readFileSync(path.join(__dirname, 'exam-engine-config.v2.json'), 'utf8')),
};
