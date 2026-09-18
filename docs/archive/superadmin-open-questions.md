# Super Admin Portal — Open Questions

_To finalize before/while doing Phases 4–5. Each item lists our **current assumption** — just confirm or correct. Anything unanswered stays on the current behavior._

---

## 1. Subscriptions & Billing
_(the `institute_exam_subscriptions` table exists but pricing is deferred — `PricingConfig.tsx` is still empty)_

1. **Pricing model** — per-seat (per student), flat per-institute, or per-exam? _Assumption: undecided → no pricing logic yet._
2. **Plan tiers** — do we need TRIAL / STARTER / PRO, and what does each include? _Assumption: only `billing_status` (TRIAL/ACTIVE/CANCELLED) for now; no `plan_tier`._
3. **Trial length** — is **30 days per exam** correct? What happens at expiry — auto-cancel, grace period, or just notify? _Assumption: 30 days, no automatic action yet._
4. **TRIAL → ACTIVE** — who flips it: a payment event (Razorpay?) or the super admin manually? _Assumption: super admin sets it manually._
5. **Payment integration** — is Razorpay/invoicing in scope for the portal, or handled offline for now? _Assumption: offline / out of scope this round._
6. **MRR / ARR metrics** on the dashboards — real numbers needed, or leave as placeholders until pricing exists? _Assumption: placeholders for now._

## 2. Access & Enforcement
_(the key Phase 4–5 dependency)_

7. **Does `billing_status` gate anything yet?** i.e., when an exam is CANCELLED, do students immediately lose access, keep read-only, or nothing changes yet? _Assumption: record-only now; enforcement comes in Phase 4–5 via `canAccessEnrollment`._
8. **Does an institute's exam list gate student features?** e.g., can a student only take exams the institute subscribes to? _Assumption: not enforced yet — subscription is just a record._
9. **Deactivating an institute** — should it immediately block all its users' logins, or keep data visible/read-only? _Assumption: read-access change, no data deletion (Hard Rule #5)._

## 3. Institute & Owner Management

10. **One owner per institute, or multiple?** _Assumption: one owner per institute._
11. **Owner changes** — do we need "change owner" / "resend owner invite" / "transfer ownership"? _Assumption: not yet; re-invite only if asked._
12. **Logo** — real file upload, or keep the URL/text field? _Assumption: URL/text for now._
13. **First super admin** — how is it created (seed script / manual DB)? Any UI to add more super admins? _Assumption: manual, no UI._

## 4. Exam Selection

14. **Sellable exams today** — confirm: IELTS (live), Spoken English (live), and OET/GRE/TOEFL/PTE marked "soon". Correct? _Assumption: IELTS + Spoken sellable; rest hidden as "soon"._
15. **Adding an exam mid-life** — should its trial restart fresh (new 30 days) each time it's re-enabled? _Assumption: yes, fresh trial on (re)enable._

## 5. Other Portal Pages (currently stubs — real or placeholder?)

16. **Support Tickets** (`SupportTicket.tsx`) — real feature or placeholder? _Assumption: placeholder._
17. **Platform Analytics** (`PlatformAnalytics.tsx`) — wire to real data now or later? _Assumption: later._
18. **Question Bank Manager** — its exam list is out of date (`GMAT`, `SPOKEN_ENGLISH`) and doesn't match the real `ExamType` enum. OK to align it to the shared list in a follow-up? _Assumption: yes, follow-up._
19. **All Users** — any actions needed beyond viewing (edit role, deactivate user)? _Assumption: view-only for now._

---

### Priority for tomorrow
The only answers that **block Phases 4–5** are **§2 (Access & Enforcement)** — everything else can ship on the current assumptions and be refined later. If you can answer 7, 8, and 9, we're clear to start.
