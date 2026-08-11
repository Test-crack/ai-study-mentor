import { CalendarClock, PlayCircle, Trophy, BookOpen, Compass } from "lucide-react";

/**
 * Shared display config for student notifications — one source of truth for
 * titles, copy, icons, colors and CTA routing, consumed by both the dashboard
 * banners (DailyNotices) and the topbar bell dropdown (NotificationBell).
 */

export type NotificationType =
  | 'IA_PENDING'
  | 'IA_IN_PROGRESS'
  | 'MOCK_PENDING'
  | 'MOCK_IN_PROGRESS'
  | 'IA_MISSED';

/** Flattened notification shape shared by CTAs and event payloads. */
export interface Notification {
  type: NotificationType;
  /** Present only for persisted events — used for API dismiss / read. */
  id?: string;
  created_at?: string;
  read_at?: string | null;
  ia_number?: number;
  ia_date?: string;
  session_id?: string;
  answers_saved?: number;
  window_closes_at?: string | null;
  month_year?: string;
  attempt_type?: string;
  momentum_deducted?: number;
}

export interface BannerConfig {
  bgColor: string;
  borderColor: string;
  iconBg: string;
  icon: JSX.Element;
  titleColor: string;
  bodyColor: string;
  title: (n: Notification) => string;
  body: (n: Notification) => string;
  ctaLabel?: string;
  ctaClass?: string;
  route?: string;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, BannerConfig> = {
  IA_PENDING: {
    bgColor:     "bg-white border-l-[3px] border-l-amber-500",
    borderColor: "border-brand-line",
    iconBg:      "bg-amber-500/12",
    icon:        <CalendarClock className="w-6 h-6 text-amber-600" />,
    titleColor:  "text-brand-text",
    bodyColor:   "text-brand-text-mute",
    title:  (n) => `Internal Assessment #${n.ia_number ?? ""} — Due Today`,
    body:   ()  => "Your Internal Assessment is scheduled for today. Complete it before the window closes.",
    ctaLabel: "Start Assessment",
    ctaClass: "bg-amber-600 hover:bg-amber-700 text-white",
    route: "/student/internal",
  },
  IA_IN_PROGRESS: {
    bgColor:     "bg-white border-l-[3px] border-l-amber-500",
    borderColor: "border-brand-line",
    iconBg:      "bg-amber-500/12",
    icon:        <PlayCircle className="w-6 h-6 text-amber-600" />,
    titleColor:  "text-brand-text",
    bodyColor:   "text-brand-text-mute",
    title:  (n) => `Internal Assessment #${n.ia_number ?? ""} — In Progress`,
    body:   (n) =>
      `You left mid-test with ${n.answers_saved ?? 0} answer${(n.answers_saved ?? 0) !== 1 ? "s" : ""} saved. Pick up where you left off.`,
    ctaLabel: "Continue Assessment",
    ctaClass: "bg-amber-600 hover:bg-amber-700 text-white",
    route: "/student/internal",
  },
  MOCK_PENDING: {
    bgColor:     "bg-white border-l-[3px] border-l-brand-teal-600",
    borderColor: "border-brand-line",
    iconBg:      "bg-brand-teal-100",
    icon:        <Trophy className="w-6 h-6 text-brand-teal-600" />,
    titleColor:  "text-brand-text",
    bodyColor:   "text-brand-text-mute",
    title:  (n) => `Monthly Mock Test${n.attempt_type ? ` — ${n.attempt_type}` : ""} Available`,
    body:   (n) => `Your mock test for ${n.month_year ?? "this month"} is ready. Take it to measure your full IELTS readiness.`,
    ctaLabel: "Start Mock Test",
    ctaClass: "bg-brand-teal-600 hover:bg-brand-teal-700 text-white",
    route: "/student/mock",
  },
  MOCK_IN_PROGRESS: {
    bgColor:     "bg-white border-l-[3px] border-l-amber-500",
    borderColor: "border-brand-line",
    iconBg:      "bg-amber-500/12",
    icon:        <BookOpen className="w-6 h-6 text-amber-600" />,
    titleColor:  "text-brand-text",
    bodyColor:   "text-brand-text-mute",
    title:  (n) => `Monthly Mock Test${n.attempt_type ? ` — ${n.attempt_type}` : ""} — Paused`,
    body:   (n) =>
      `You left your mock test incomplete with ${n.answers_saved ?? 0} answer${(n.answers_saved ?? 0) !== 1 ? "s" : ""} saved. Continue before the window closes.`,
    ctaLabel: "Continue Mock Test",
    ctaClass: "bg-amber-600 hover:bg-amber-700 text-white",
    route: "/student/mock",
  },
  // Reframed from punitive to a gentle, recoverable nudge — calm, low-pressure,
  // a "let's find your way back" moment rather than an alarm. Restyled onto
  // the same white-card + left-border-accent language as the rest of the
  // dashboard instead of the old full-gradient banner.
  IA_MISSED: {
    bgColor:     "bg-white border-l-[3px] border-l-brand-blue-500",
    borderColor: "border-brand-line",
    iconBg:      "bg-brand-blue-500/12",
    icon:        <Compass className="w-6 h-6 text-brand-blue-600" />,
    titleColor:  "text-brand-text",
    bodyColor:   "text-brand-text-mute",
    title:  ()  => "Let's find your way back on track",
    body:   (n) => {
      const date = n.ia_date
        ? new Date(n.ia_date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "recently";
      const pts = n.momentum_deducted ?? 20;
      return `No worries — it happens to everyone. Your assessment on ${date} slipped by, so your Momentum dipped by ${pts} pts for now. The good news: you'll earn it right back the moment you complete your next drill.`;
    },
    ctaLabel: "Get back on track",
    ctaClass: "bg-brand-blue-600 hover:bg-brand-blue-700 text-white",
    route: "/student/assessment-history",
  },
};

/** Flatten a persisted event row (id + payload) into the shared Notification shape. */
export function eventToNotification(e: {
  id: string;
  type: string;
  payload: Record<string, any>;
  created_at: string;
  read_at: string | null;
}): Notification {
  return {
    id:         e.id,
    type:       e.type as NotificationType,
    created_at: e.created_at,
    read_at:    e.read_at,
    ...e.payload,
  };
}
