# DCS Threshold Requirements Summary

**Date:** 8 May 2026  
**Purpose:** Document all DCS (Drill Completion Score) thresholds used across the platform

---

## Current Thresholds

### 1. Extra Drill Purchase (4th+ Drill)
**Threshold:** `75%`  
**Location:** Frontend - `src/features/student/components/StudentDashboardPage.tsx`  
**Variable:** `dcsThreshold` (from `dailyDrillState?.dcs_threshold ?? 75`)

**Requirements:**
- Daily DCS ≥ 75%
- 75 Momentum points
- Must have completed 3 standard drills today

**Purpose:** Prevents students from grinding low-quality sessions. Extra time must be earned with accuracy.

**Code Reference:**
```typescript
const dcsThreshold = dailyDrillState?.dcs_threshold ?? 75;
const canBuyExtra = dailyDCS >= dcsThreshold && momentumScore >= extraCost;
```

---

### 2. Internal Assessment (IA) Eligibility
**Threshold:** `40%`  
**Location:** Multiple files (frontend + backend)

**Requirements:**
- Average DCS ≥ 40% (across all completed drills)
- 6 drill sessions completed total
- Minimum 2 calendar days since first drill

**Purpose:** Ensures students have baseline competency before taking high-stakes assessments.

**Code References:**

**Frontend - Assessment.tsx:**
```typescript
// Line 610
"✗ Improve your DCS score to be eligible — need 40% or above."

// Line 662
"Need 40% — you're {40 - avg_dcs}% short. Complete drills to improve your score."
```

**Frontend - IAScheduleWidget.tsx:**
```typescript
// Line 92
{canStart ? "You're eligible — start your assessment" : `DCS ${status.avg_dcs}% — need 40% to start`}
```

**Documentation:**
- `docs/testcrack_flow_v3.html` - Line 554: "Average DCS ≥ 40% across priority sub-skills"
- `docs/testcrack_gap_report_v3.md` - Line 53: "Eligibility check (6 drills + 2 days + DCS ≥ 40%)"

---

## Comparison Table

| Feature | DCS Threshold | Additional Requirements | Purpose |
|---------|---------------|------------------------|---------|
| **Extra Drill Purchase** | **75%** | 75 momentum points | Quality gate for additional practice |
| **IA Eligibility** | **40%** | 6 drills + 2 days | Baseline competency for assessments |

---

## User Request

**Change:** Lower extra drill purchase threshold from **75% → 40%**

**Rationale:** Make extra drills more accessible to students who meet IA eligibility but haven't reached 75% accuracy yet.

**Impact:**
- More students can purchase extra drills
- Aligns extra drill threshold with IA eligibility threshold
- May increase drill volume but could reduce average quality

---

## Files to Update

To change extra drill threshold from 75% to 40%:

### Backend
1. `backend-study-mentor/src/controllers/drillController.ts` (or wherever `dcs_threshold` is set in daily drill state)
   - Update the threshold value returned in the API response

### Frontend
2. `src/features/student/components/StudentDashboardPage.tsx`
   - Line 483: Update fallback value `?? 75` to `?? 40`
   - Line 559: Update console log message

### Documentation
3. `docs/testcrack_flow_v3.html`
   - Line 521: Update "DCS ≥ 75%" to "DCS ≥ 40%"
   - Line 887: Update "75 pts + DCS ≥ 75%" to "75 pts + DCS ≥ 40%"

4. `docs/implementation-report-drill-lexigrid.md`
   - Line 29: Update "≥ 75% accuracy (DCS)"
   - Line 54: Update "DCS ≥ 75% for extra drill"
   - Line 140: Update "≥ 75%"
   - Line 232: Update `"dcs_threshold": 75` to `40`

---

**Status:** Ready for implementation  
**Last Updated:** 8 May 2026
