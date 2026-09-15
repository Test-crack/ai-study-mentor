// Exam-agnostic score pill. Renders a student's headline score in its own exam's scale
// (IELTS "7.5", SE "B1", OET a grade) with a colour from the universal fill-% ramp. Drop-in
// replacement for every hardcoded bandPill()/cefrPill() across the dashboards.
import { cn } from "@/shared/utils";
import { formatScore, scoreBadgeClass } from "./examScale";

const SIZES: Record<string, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export function ScorePill({
  examId,
  value,
  subScores,
  size = "md",
  className,
}: {
  examId?: string | null;
  value?: number | null;
  subScores?: Record<string, any> | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full border font-bold tabular-nums", SIZES[size], scoreBadgeClass(examId, value), className)}>
      {formatScore(examId, value, subScores)}
    </span>
  );
}
