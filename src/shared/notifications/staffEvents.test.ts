import { describe, it, expect } from "vitest";
import {
  describeEvent, isEventVisibleTo,
  type DropoutRiskPayload, type RiskDigestPayload,
} from "./staffEvents";

// These tests are the contract in
// docs/BACKEND_REQUEST_dropout_risk_notifications.md (Requests 4 and 5), pinned
// as executable checks. The backend producer does not exist yet, so this is the
// only thing standing between the doc and a renderer that silently prints
// "undefined" the day real events start arriving.
//
// Scope matters in every assertion below: the escalation ladder is
//   day 0 → instructor   (STUDENT_DROPOUT_RISK)
//   day N → admin+owner  (STUDENT_DROPOUT_ESCALATED)
// so asking for the wrong type in the wrong portal is expected to return null.

const FULL: DropoutRiskPayload = {
  student_user_id: "stu-1",
  student_name: "Arun Kumar",
  batches: [
    { batch_id: "b-1", batch_name: "Batch B", instructors: [{ user_id: "i-1", name: "Sarah Khan" }] },
  ],
  tier: "AT_RISK",
  reasons: ["No activity for 9 days", "Missed 3 internal assessments", "Band score declining"],
  days_inactive: 9,
  missed_ia_count: 3,
  daily_streak: 0,
  momentum_score: 40,
  current_band: 6.0,
  target_band: 7.5,
  exam_date: null,
};

// ─── Portal boundary ──────────────────────────────────────────────────────────

// The owner's bell is a retention signal, not an activity feed. These are the
// rules most likely to regress the next time someone adds an event type, so they
// are pinned per-scope rather than described only in a comment.
describe("portal boundary — the owner sees ONLY dropout risk", () => {
  it("never shows the owner a single missed assessment", () => {
    expect(isEventVisibleTo("STUDENT_IA_MISSED", "institute-owner")).toBe(false);
    expect(describeEvent("STUDENT_IA_MISSED", {
      student_name: "Arun Kumar", student_user_id: "stu-1", batch_id: "b-1", ia_number: 7,
    }, "institute-owner")).toBeNull();
  });

  it("never shows the owner per-student operational events", () => {
    for (const type of [
      "DIAGNOSTIC_COMPLETED", "MOCK_GRADED", "STUDENT_ONBOARDED",
      "IA_PENDING", "MOCK_PENDING", "IA_MISSED",
    ]) {
      expect(isEventVisibleTo(type, "institute-owner")).toBe(false);
      expect(describeEvent(type, { student_name: "Arun" }, "institute-owner")).toBeNull();
    }
  });

  it("does show the owner an escalated dropout risk", () => {
    expect(isEventVisibleTo("STUDENT_DROPOUT_ESCALATED", "institute-owner")).toBe(true);
  });

  it("does not hand the owner the tutor's day-0 first alert", () => {
    expect(isEventVisibleTo("STUDENT_DROPOUT_RISK", "institute-owner")).toBe(false);
    expect(describeEvent("STUDENT_DROPOUT_RISK", FULL, "institute-owner")).toBeNull();
  });

  it("keeps the instructor's existing per-miss alert working", () => {
    expect(isEventVisibleTo("STUDENT_IA_MISSED", "instructor")).toBe(true);
    expect(isEventVisibleTo("STUDENT_DROPOUT_RISK", "instructor")).toBe(true);
  });

  it("gives the admin escalations, not the day-0 alert", () => {
    expect(isEventVisibleTo("STUDENT_DROPOUT_ESCALATED", "institute-admin")).toBe(true);
    expect(isEventVisibleTo("STUDENT_DROPOUT_RISK", "institute-admin")).toBe(false);
  });

  it("does not leak the owner's aggregate digest to the other portals", () => {
    expect(isEventVisibleTo("INSTITUTE_RISK_DIGEST", "institute-owner")).toBe(true);
    expect(isEventVisibleTo("INSTITUTE_RISK_DIGEST", "instructor")).toBe(false);
    expect(isEventVisibleTo("INSTITUTE_RISK_DIGEST", "institute-admin")).toBe(false);
  });
});

// ─── Degenerate input ─────────────────────────────────────────────────────────

describe("describeEvent — unknown and empty input", () => {
  it("returns null for an unrecognised type so the row is skipped, not broken", () => {
    expect(describeEvent("SOME_FUTURE_EVENT", {}, "institute-admin")).toBeNull();
  });

  it("tolerates a null payload rather than throwing", () => {
    const view = describeEvent("STUDENT_DROPOUT_RISK", null, "instructor");
    expect(view).not.toBeNull();
    expect(view!.title).toBe("A student is at risk of dropping off");
  });
});

// ─── Day 0: the instructor's alert ────────────────────────────────────────────

describe("STUDENT_DROPOUT_RISK — the instructor's first alert", () => {
  it("names the student and states the tier and reasons", () => {
    const view = describeEvent("STUDENT_DROPOUT_RISK", FULL, "instructor")!;
    expect(view.title).toBe("Arun Kumar is at risk of dropping off");
    expect(view.body).toContain("At risk.");
    expect(view.body).toContain("No activity for 9 days");
    expect(view.body).toContain("Band 6.0");
    expect(view.body).toContain("target 7.5");
  });

  it("puts batch and tutor on the meta line — the whole point of the alert", () => {
    expect(describeEvent("STUDENT_DROPOUT_RISK", FULL, "instructor")!.meta)
      .toBe("Batch B · Tutor: Sarah Khan");
  });

  it("states extra batches instead of silently showing only the first", () => {
    const multi: DropoutRiskPayload = {
      ...FULL,
      batches: [
        FULL.batches![0],
        { batch_id: "b-2", batch_name: "Batch C", instructors: [{ user_id: "i-2", name: "Ravi" }] },
      ],
    };
    expect(describeEvent("STUDENT_DROPOUT_RISK", multi, "instructor")!.meta)
      .toBe("Batch B · Tutor: Sarah Khan · +1 more batch");
  });

  it("lists multiple tutors on one batch", () => {
    const twoTutors: DropoutRiskPayload = {
      ...FULL,
      batches: [{
        batch_id: "b-1", batch_name: "Batch B",
        instructors: [{ user_id: "i-1", name: "Sarah Khan" }, { user_id: "i-2", name: "Ravi Kumar" }],
      }],
    };
    expect(describeEvent("STUDENT_DROPOUT_RISK", twoTutors, "instructor")!.meta)
      .toBe("Batch B · Tutors: Sarah Khan, Ravi Kumar");
  });

  it("omits the meta line entirely when no batch is sent", () => {
    const { batches, ...noBatch } = FULL;
    expect(describeEvent("STUDENT_DROPOUT_RISK", noBatch, "instructor")!.meta).toBeUndefined();
  });

  it("reconstructs reasons from the raw counters when reasons[] is absent", () => {
    const { reasons, ...noReasons } = FULL;
    const body = describeEvent("STUDENT_DROPOUT_RISK", noReasons, "instructor")!.body;
    expect(body).toContain("inactive 9 days");
    expect(body).toContain("3 assessments missed");
    expect(body).toContain("streak broken");
  });

  it("singularises the reconstructed counters", () => {
    const body = describeEvent("STUDENT_DROPOUT_RISK", {
      student_name: "Z", days_inactive: 1, missed_ia_count: 1, daily_streak: 5,
    }, "instructor")!.body;
    expect(body).toContain("inactive 1 day");
    expect(body).toContain("1 assessment missed");
    expect(body).not.toContain("streak broken");
  });

  it("drops the band clause when no scores are sent", () => {
    const body = describeEvent("STUDENT_DROPOUT_RISK", {
      student_name: "Z", tier: "WATCH", reasons: ["Never drilled"],
    }, "instructor")!.body;
    expect(body).toBe("Watch. Never drilled");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("NaN");
  });

  it("falls back to AT_RISK styling for an unrecognised tier", () => {
    const view = describeEvent("STUDENT_DROPOUT_RISK", { ...FULL, tier: "NONSENSE" as any }, "instructor")!;
    expect(view.body).toContain("At risk.");
  });

  it("never claims a notified date on the tutor's OWN first alert", () => {
    const view = describeEvent(
      "STUDENT_DROPOUT_RISK",
      { ...FULL, instructor_notified_at: "2026-08-19" },
      "instructor"
    )!;
    expect(view.body).not.toContain("Tutor notified");
  });
});

// ─── Day N: the escalation ────────────────────────────────────────────────────

describe("STUDENT_DROPOUT_ESCALATED — admin and owner", () => {
  it("reads as an escalation, not a first alert", () => {
    const view = describeEvent("STUDENT_DROPOUT_ESCALATED", { ...FULL, tier: "CRITICAL" }, "institute-admin")!;
    expect(view.title).toBe("Arun Kumar still needs attention");
    expect(view.body).toContain("Critical — not resolved yet.");
  });

  it("states when the tutor was notified — the reason the escalation exists", () => {
    const view = describeEvent(
      "STUDENT_DROPOUT_ESCALATED",
      { ...FULL, instructor_notified_at: "2026-08-19" },
      "institute-owner"
    )!;
    expect(view.body).toContain("Tutor notified 19 Aug, unopened since.");
  });

  it("accepts a full ISO timestamp as well as a plain date", () => {
    const view = describeEvent(
      "STUDENT_DROPOUT_ESCALATED",
      { ...FULL, instructor_notified_at: "2026-08-19T04:30:00.000Z" },
      "institute-owner"
    )!;
    expect(view.body).toContain("Tutor notified 19 Aug, unopened since.");
  });

  it("omits the clause on an unparseable date rather than printing Invalid Date", () => {
    const view = describeEvent(
      "STUDENT_DROPOUT_ESCALATED",
      { ...FULL, instructor_notified_at: "not-a-date" },
      "institute-owner"
    )!;
    expect(view.body).not.toContain("Tutor notified");
    expect(view.body).not.toContain("Invalid Date");
  });

  it("carries student name, batch, tutor and notified date for the owner", () => {
    const view = describeEvent(
      "STUDENT_DROPOUT_ESCALATED",
      { ...FULL, tier: "CRITICAL", instructor_notified_at: "2026-08-19" },
      "institute-owner"
    )!;
    expect(view.title).toContain("Arun Kumar");
    expect(view.meta).toBe("Batch B · Tutor: Sarah Khan");
    expect(view.body).toContain("Tutor notified 19 Aug");
    expect(view.route).toBe("/institute-owner/students/stu-1/progress");
    expect(view.state).toEqual({ studentId: "stu-1" });
  });
});

// ─── Routing per portal ───────────────────────────────────────────────────────

describe("describeEvent — routing per portal", () => {
  it("deep-links the admin with router state, since that page reads location.state", () => {
    const view = describeEvent("STUDENT_DROPOUT_ESCALATED", FULL, "institute-admin")!;
    expect(view.route).toBe("/institute-admin/students/stu-1/progress");
    expect(view.state).toEqual({ studentId: "stu-1" });
  });

  it("deep-links the owner to its own portal route", () => {
    const view = describeEvent("STUDENT_DROPOUT_ESCALATED", FULL, "institute-owner")!;
    expect(view.route).toBe("/institute-owner/students/stu-1/progress");
    expect(view.state).toEqual({ studentId: "stu-1" });
  });

  it("uses the instructor's batch-scoped route", () => {
    const view = describeEvent("STUDENT_DROPOUT_RISK", FULL, "instructor")!;
    expect(view.route).toBe("/instructor/batches/b-1/students/stu-1/progress");
  });

  it("is unclickable for an instructor when no batch is present, rather than linking somewhere broken", () => {
    const { batches, ...noBatch } = FULL;
    expect(describeEvent("STUDENT_DROPOUT_RISK", noBatch, "instructor")!.route).toBeNull();
  });

  it("is unclickable when the student id is missing", () => {
    const { student_user_id, ...noId } = FULL;
    expect(describeEvent("STUDENT_DROPOUT_ESCALATED", noId, "institute-admin")!.route).toBeNull();
  });
});

// ─── Weekly aggregate ─────────────────────────────────────────────────────────

describe("INSTITUTE_RISK_DIGEST — owner only", () => {
  const digest: RiskDigestPayload = {
    period_start: "2026-08-16",
    period_end: "2026-08-22",
    flagged_total: 14,
    by_tier: { watch: 6, at_risk: 5, critical: 3 },
    recovered_count: 9,
    top_concentrations: [
      { batch_id: "b-1", batch_name: "Batch B", instructor_names: ["Sarah Khan"], flagged_count: 6 },
    ],
  };

  it("summarises counts, concentration and recovery", () => {
    const view = describeEvent("INSTITUTE_RISK_DIGEST", digest, "institute-owner")!;
    expect(view.title).toBe("14 students flagged — 16 Aug – 22 Aug");
    expect(view.body).toContain("3 critical · 5 at risk · 6 watch");
    expect(view.body).toContain("Most concentrated in Batch B (Sarah Khan) — 6.");
    expect(view.body).toContain("9 recovered after contact.");
  });

  it("states zero recoveries rather than hiding the clause", () => {
    const view = describeEvent("INSTITUTE_RISK_DIGEST", { ...digest, recovered_count: 0 }, "institute-owner")!;
    expect(view.body).toContain("0 recovered after contact.");
  });

  it("omits recovery entirely when the backend does not send the field", () => {
    const { recovered_count, ...noRecovery } = digest;
    expect(describeEvent("INSTITUTE_RISK_DIGEST", noRecovery, "institute-owner")!.body)
      .not.toContain("recovered");
  });

  it("singularises a single flagged student", () => {
    expect(describeEvent("INSTITUTE_RISK_DIGEST", { ...digest, flagged_total: 1 }, "institute-owner")!.title)
      .toBe("1 student flagged — 16 Aug – 22 Aug");
  });

  it("falls back to 'this week' with no period, and still renders with an empty payload", () => {
    const view = describeEvent("INSTITUTE_RISK_DIGEST", {}, "institute-owner")!;
    expect(view.title).toBe("0 students flagged — this week");
    expect(view.body).not.toContain("undefined");
  });

  it("routes to the student list — an aggregate has no single student to open", () => {
    expect(describeEvent("INSTITUTE_RISK_DIGEST", digest, "institute-owner")!.route)
      .toBe("/institute-owner/students");
  });
});

// ─── Already live ─────────────────────────────────────────────────────────────

describe("STUDENT_IA_MISSED — already shipped", () => {
  it("still renders for the instructor after the registry move", () => {
    const view = describeEvent("STUDENT_IA_MISSED", {
      student_name: "Arun Kumar", student_user_id: "stu-1",
      batch_id: "b-1", ia_number: 7, ia_date: "2026-08-19", momentum_deducted: 20,
    }, "instructor")!;
    expect(view.title).toBe("Arun Kumar missed an assessment");
    expect(view.body).toContain("IA #7");
    expect(view.body).toContain("19 Aug");
    expect(view.route).toBe("/instructor/batches/b-1/students/stu-1/progress");
  });

  it("still renders for the admin, whose bell already carried it", () => {
    const view = describeEvent("STUDENT_IA_MISSED", {
      student_name: "Arun Kumar", student_user_id: "stu-1", ia_number: 7, ia_date: "2026-08-19",
    }, "institute-admin")!;
    expect(view.title).toBe("Arun Kumar missed an assessment");
    expect(view.route).toBe("/institute-admin/students/stu-1/progress");
  });

  it("degrades to 'recently' and stays unclickable when the payload is thin", () => {
    const view = describeEvent("STUDENT_IA_MISSED", {}, "instructor")!;
    expect(view.title).toBe("A student missed an assessment");
    expect(view.body).toContain("recently");
    expect(view.route).toBeNull();
  });
});
