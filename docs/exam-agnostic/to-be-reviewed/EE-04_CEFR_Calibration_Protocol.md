# CEFR Calibration Protocol

**Purpose:** replace the borrowed, provisional CEFR thresholds with cut scores we set ourselves and can defend.
**Status of the current thresholds:** `PROVISIONAL_UNCALIBRATED`. They are Pearson's published GSE→CEFR boundaries converted to a percent scale. That is a reasonable starting point and an indefensible endpoint — it borrows a vendor's alignment claim rather than making our own.

---

## 1 · Why 30 samples is not a calibration

The spec proposes calibrating against ~30 examiner-rated vivas. That is a feasibility pilot. The reason is arithmetic, not pedantry.

- Six levels require **five cut scores**, and precision depends on sample density *near each cut*, not on total N. Thirty samples is roughly six per boundary.
- A 6×6 confusion matrix has **36 cells**. Thirty samples cannot populate it.
- At n=30 with six categories, the 95% confidence interval on weighted kappa is roughly **±0.2** — wide enough that you could not distinguish an excellent automated rater from a poor one.
- Published linking studies that used ~20–30 stimuli (CaMLA: 21 judged clips for three cuts; LTTC BESTEP: 20 recordings) paired them with **10–14 expert panellists over multiple rounds** — the reliability came from the panel, not the sample. BESTEP still ended with zero A1 samples and two C1, and had to **drop its claims at the extremes**.

Run 30 if 30 is the budget. Call it a pilot, publish it as provisional, and name the sample size as the limitation. Calling it a calibration is the kind of overclaim the whole product thesis exists to avoid.

---

## 2 · The programme

Structured on the Council of Europe's *Manual for Relating Language Examinations to the CEFR* (2009), which is the reference any reviewer will hold this against.

### Stage 1 — Familiarisation *(≈1 week, near-zero cost)*

Minimum three hours per participant, and **everyone who touches scoring does it, engineers included**. Descriptor-sorting exercises, reconstructing the CEFR qualitative tables from cut-up descriptors, then rating the Council of Europe's illustrative spoken samples — which are already benchmarked and free.

Output: a signed familiarisation record per participant.

### Stage 2 — Specification *(≈1 week)*

Qualitative content analysis of the viva against CEFR categories, using the Manual's Forms A1–A24 and the ALTE *CEFR Grid for Speaking Tests*. Produces a content-based linking argument — necessary, not sufficient.

**Note on our six subskills:** Range, Accuracy, Fluency, Interaction, Coherence and Phonology come from the CEFR Companion Volume (2020), **Appendix 3** — not Table 3. The main Table 3 in both the 2001 CEFR and the Companion Volume carries five criteria; Phonology is the sixth column added only in Appendix 3. Cite it correctly or be corrected.

These are **level-descriptive bands, not a scoring rubric.** Using them as rubric dimensions is legitimate, but each dimension then needs validating separately — per-dimension agreement, not just overall.

### Stage 3 — Standardisation and benchmarking *(3–4 weeks — the main cost)*

Train raters on the CoE illustrative samples until judgements converge, then benchmark **our own** performances.

| Parameter | Target |
|---|---|
| Local benchmark set | **60–90 performances**, 10–15 per level |
| Boundary density | ≥10 borderline cases per cut, deliberately over-sampled |
| Raters per performance | **≥2 independent trained raters** |
| Adjudication | third rater on any disagreement >1 level |
| Report first | **human–human agreement** — it is the ceiling, and the denominator for the degradation criterion |

If a level cannot be populated — likely at A1 and C2 — **restrict the claim range explicitly** rather than extrapolating.

### Stage 4 — Standard setting *(2 weeks)*

| Parameter | Target |
|---|---|
| Panellists | **10–15** (ETS RM-15-11 gives 10–15 as the acceptable range) |
| Rounds | **2–3**, with normative feedback and discussion between rounds |
| Methods | **Two**, with different judgement tasks |

Recommended pair for an automated speaking rater:

1. **Modified bookmark** — order the audio by machine score and have panellists place bookmarks at level boundaries. This is precisely how the CaMLA Speaking Test was linked, and it is the best single fit for our case.
2. **Contrasting groups** — classify candidates who already hold an external certificate at a known level, and find the score that minimises misclassification. Cheap, and it uses evidence we do not have to generate.

Report the **standard error of the cut score** and compare it to the test's SEM. A useful decision rule: the standard error of judgement should be below half the test SEM.

> Angoff and its variants are a poor fit — they are built for dichotomous items, not extended speech. Only Extended Angoff is usable, and only if the rater emits per-criterion rubric scores.

### Stage 5 — Validation *(2 weeks, then ongoing)*

Held-out set, **never used in any fitting**:

| Parameter | Target |
|---|---|
| Size | **200–300 double-rated performances**, ≥30 per level |
| Report | QWK, linear weighted kappa, exact and adjacent agreement %, Spearman's ρ, SMD, full 6×6 confusion matrix, SEM near each cut, decision consistency |

**Acceptance criteria** — the Williamson, Xi & Breyer (2012) framework that ETS applies operationally:

| Metric | Threshold |
|---|---|
| Quadratic weighted kappa (machine vs human) | **≥ 0.70** |
| Correlation (machine vs human) | **≥ 0.70** |
| Standardised mean difference | **\|SMD\| ≤ 0.15** |
| Degradation vs human–human agreement | **≤ 0.10** |

SMD matters as much as kappa: it catches systematic leniency or severity that correlation hides entirely.

**Never report quadratic weighted kappa alone.** It is under active criticism and it misbehaves in exactly our situation: it changes materially depending on how two human raters are combined, it suffers the kappa paradox (99.8% agreement has produced a QWK of 0.488), and on a six-category scale with most students clustered at A2–B2, agreement concentrated near the diagonal *depresses* it. Report the full set or the number will be argued with.

**Calibrating means threshold-fitting only.** Cut scores are what this study moves. If the underlying scorer changes, the study is invalidated and re-runs.

---

## 3 · Cost and sequencing

| Stage | Duration | Main cost |
|---|---|---|
| 1 Familiarisation | 1 week | internal time |
| 2 Specification | 1 week | internal time |
| 3 Benchmarking | 3–4 weeks | **60–90 performances × 2 rater-hours** — the dominant cost |
| 4 Standard setting | 2 weeks | 10–15 panellists × 2–3 rounds |
| 5 Validation | 2 weeks | **200–300 double-rated performances** |
| **Total** | **9–11 weeks** | Stages 3 and 5 carry ~90% of the spend |

**Sequencing against the product.** Stages 1–2 can run now, in parallel with the build — they need no data. Stage 3 needs viva sessions to exist, so it starts after Spoken English ships. Stages 4–5 follow.

That gives a real launch answer: **ship with provisional thresholds, labelled provisional, and complete the study in the first quarter of operation.** The `PROVISIONAL_UNCALIBRATED` flag and the `provisional: true` field on results exist so that promise is enforced by the code rather than remembered.

**Cheap accelerator:** every viva sat before Stage 3 is potential benchmark material *if* consent and retention allow it. Get the consent wording right at launch and Stage 3 starts with a corpus instead of a recruitment problem. Getting it wrong means re-collecting.

---

## 4 · What we may claim, and what we may not

The Council of Europe states plainly: *"it is not the role of the Council of Europe to verify and validate the quality of the link between language examinations and the CEFR's proficiency levels."*

**There is no CEFR certification, accreditation, or seal.** Anyone claiming one is describing something that does not exist.

| ✅ Defensible with published evidence | ❌ Not defensible |
|---|---|
| "aligned to the CEFR" / "CEFR-referenced" | "CEFR certified" / "CEFR accredited" |
| "estimated CEFR level" / "indicative CEFR level" | "official CEFR level" |
| "benchmarked against CEFR descriptors" | "recognised by the Council of Europe" |
| "for guidance and placement; not a substitute for an accredited certificate" | any implication of immigration or admissions eligibility |

Wording that survives scrutiny once the study is done:

> *"This assessment provides an estimated CEFR level, produced by an automated rater calibrated against human expert ratings using a linking procedure based on the Council of Europe's Manual for Relating Language Examinations to the CEFR (2009). It is not an accredited language certificate; the Council of Europe does not accredit CEFR alignment claims."*

Then **publish the linking report.** Recommendation CM/Rec(2008)7 is blunt about why: *"unsupported and uncorroborated claims can too easily lead to all claims being discredited."* An unpublished alignment claim is worth roughly nothing, and a published one is a genuine competitive asset — most competitors assert alignment and publish nothing.

---

## 5 · What changes in config when the study completes

One block, no code:

```json
"cefr_6": {
  "thresholds_min_pct": { ...new cut scores... },
  "_threshold_provenance": "Local standard setting, <date>. Modified bookmark + contrasting groups, N panellists, N rounds. Validation: QWK x.xx, SMD x.xx, n=NNN held out.",
  "_calibration_status": "CALIBRATED"
}
```

Then bump `config_version`. Because every result records the version it was scored under, historical scores stay interpretable and comparisons across the boundary are labelled rather than silently wrong.

**This is only true if `record_config_version` ships before the first CEFR result is stored.** It is the cheapest item on the whole board and the only one that cannot be added retrospectively.

---

## Sources

- [CoE — Manual for Relating Language Examinations to the CEFR (2009)](https://rm.coe.int/1680667a2d)
- [CoE — Reference Supplement, Section B: Standard Setting](https://rm.coe.int/090000168092ac9c)
- [CoE — Responsibility of member states](https://www.coe.int/en/web/common-european-framework-reference-languages/responsability-of-member-states)
- [CEFR Companion Volume (2020)](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4)
- [Williamson, Xi & Breyer (2012) — A Framework for Evaluation and Use of Automated Scoring](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1745-3992.2011.00223.x)
- [ETS — Automated Scoring of Spontaneous Speech (SpeechRater)](https://files.eric.ed.gov/fulltext/EJ1111325.pdf)
- [ETS RM-15-11 — panel size and standard error guidance](https://www.ets.org/s/ppa/pdf/RM-15-11.pdf)
- [CaMLA Speaking Test — CEFR linking via modified bookmark](https://michiganassessment.org/wp-content/uploads/2020/02/20.02.pdf.Res_.LinkingtheCommonEuropeanFrameworkofReferenceandtheCaMLASpeakingTest.pdf)
- [LTTC — Relating the BESTEP Speaking Test to the CEFR](https://www.lttc.ntu.edu.tw/files/20241004113505388.pdf)
- [Pearson — GSE alignment to other scales](https://www.pearson.com/content/dam/one-dot-com/one-dot-com/english/TeacherResources/GSE/GSE-Alignment-other-scales.pdf)
- [EDM 2023 — Evaluating QWK as the standard metric](https://files.eric.ed.gov/fulltext/ED630859.pdf)
- [EALTA/ECML — Aligning Language Education with the CEFR: A Handbook (2022)](https://ealta.eu/documents/resources/CEFR%20alignment%20handbook.pdf)
- [Cambridge English — Using the CEFR: Principles of Good Practice](https://www.cambridgeenglish.org/Images/126011-using-cefr-principles-of-good-practice.pdf)
