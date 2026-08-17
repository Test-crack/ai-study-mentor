import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ChevronRight, Zap, CheckCircle2 } from "lucide-react";
import { callBackend } from "@/features/auth/services/authClient";

interface IASlot {
  number:         number;
  date:           string;       // YYYY-MM-DD
  date_formatted: string;       // "Wed, 7 May"
  days_away:      number;
}

interface IAStatusSlim {
  has_schedule:      boolean;
  prerequisites_met: boolean;
  is_ia_day:         boolean;
  dcs_eligible:      boolean;
  avg_dcs:           number;
  upcoming_ias:      IASlot[];
  current_ia_number: number | null;
}

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseDateParts(dateStr: string): { day: number; month: string } {
  const [, m, d] = dateStr.split("-").map(Number);
  return { day: d, month: MONTH_SHORT[m - 1] };
}

export default function IAScheduleWidget() {
  const navigate = useNavigate();
  const [status, setStatus]   = useState<IAStatusSlim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
        const res = await callBackend(`${backendUrl}/api/ia/status`);
        if (res.success) setStatus(res as IAStatusSlim);
      } catch {
        // silently hide widget on error
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  if (loading) return (
    <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm h-full flex flex-col animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-bg-alt flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-brand-bg-alt rounded" />
            <div className="h-2.5 w-16 bg-brand-bg-alt rounded" />
          </div>
        </div>
        <div className="h-3 w-10 bg-brand-bg-alt rounded" />
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-brand-line">
            <div className="w-12 h-12 rounded-xl bg-brand-bg-alt flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-36 bg-brand-bg-alt rounded" />
              <div className="h-2.5 w-20 bg-brand-bg-alt rounded" />
            </div>
            <div className="h-5 w-14 bg-brand-bg-alt rounded-lg" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-9 w-full bg-brand-bg-alt rounded-xl" />
    </div>
  );

  // Only render when the student has a meaningful schedule to show
  if (!status?.has_schedule || !status.prerequisites_met) return null;

  const isIADay    = status.is_ia_day;
  const slots      = status.upcoming_ias.slice(0, 2);
  const canStart   = isIADay && status.dcs_eligible;
  const nextSlot   = slots[0];
  const isImminent = !!nextSlot && nextSlot.days_away <= 1 && !isIADay;

  return (
    <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-teal-100 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-4 h-4 text-brand-teal-600" />
          </div>
          <div>
            <p className="font-dm font-bold text-brand-text text-sm leading-tight">IA Schedule</p>
            <p className="text-xs text-brand-text-mute leading-tight">Internal Assessments</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/student/internal")}
          className="text-xs font-semibold text-brand-teal-600 hover:underline flex items-center gap-0.5"
        >
          View <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Due tomorrow — required, not yet actionable */}
      {isImminent && (
        <div className="rounded-xl px-4 py-3 mb-4 border border-brand-line border-l-[3px] border-l-brand-purple bg-white">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-brand-text">
              Internal Assessment #{status.current_ia_number}
            </p>
            <span className="font-jetbrains text-[9px] font-bold uppercase tracking-wider bg-brand-purple/12 text-brand-purple px-2 py-0.5 rounded-full">
              Required
            </span>
          </div>
          <p className="text-xs font-medium text-brand-text-mute">
            Due {nextSlot.days_away === 0 ? "today" : "tomorrow"}, {nextSlot.date_formatted}. This re-scores your sub-scores — miss it and your scores go stale and momentum drops.
          </p>
        </div>
      )}

      {/* Today is IA day banner */}
      {isIADay && (
        <div className={`rounded-xl px-4 py-3 mb-4 flex items-center justify-between border border-l-[3px] bg-white ${
 canStart
 ? "border-brand-line border-l-brand-teal-600 "
 : "border-brand-line border-l-rose-500 "
 }`}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-brand-text">
                IA #{status.current_ia_number} — Today
              </p>
              <span className={`font-jetbrains text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${canStart ? "bg-brand-teal-600" : "bg-rose-500"}`}>
                Required
              </span>
            </div>
            <p className={`text-xs font-medium ${canStart ? "text-brand-teal-600 " : "text-rose-600 "}`}>
              {canStart ? "You're eligible — start your assessment" : `DCS ${status.avg_dcs}% — need 40% to start`}
            </p>
          </div>
          {canStart
            ? <CheckCircle2 className="w-5 h-5 text-brand-teal-600 flex-shrink-0" />
            : <Zap         className="w-5 h-5 text-rose-500 flex-shrink-0" />
          }
        </div>
      )}

      {/* Upcoming slots */}
      {slots.length > 0 ? (
        <div className="flex flex-col gap-3 flex-1">
          {slots.map((slot, i) => {
            const { day, month } = parseDateParts(slot.date);
            const isToday        = slot.days_away === 0;
            const isTomorrow     = slot.days_away === 1;
            const label          = isToday ? "Today" : isTomorrow ? "Tomorrow" : `${slot.days_away}d away`;
            return (
              <div
                key={slot.number}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
 i === 0
 ? "border-brand-teal-200 bg-brand-teal-50/60 "
 : "border-brand-line bg-brand-bg-alt/60 "
 }`}
              >
                {/* Date pill */}
                <div className={`flex flex-col items-center justify-center rounded-xl w-12 h-12 flex-shrink-0 border-2 ${
 i === 0
 ? "bg-brand-teal-600 border-brand-teal-700 "
 : "bg-brand-bg-alt border-brand-line "
 }`}>
                  <span className={`font-black text-base leading-none ${i === 0 ? "text-white" : "text-brand-text "}`}>{day}</span>
                  <span className={`font-jetbrains text-[9px] font-bold uppercase tracking-wide leading-none mt-0.5 ${i === 0 ? "text-brand-teal-200" : "text-brand-text-mute "}`}>{month}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${i === 0 ? "text-brand-text " : "text-brand-text-mute "}`}>
                    Internal Assessment #{slot.number}
                  </p>
                  <p className={`text-xs font-medium ${i === 0 ? "text-brand-teal-600 " : "text-brand-text-mute "}`}>
                    {slot.date_formatted}
                  </p>
                </div>

                {/* Days badge */}
                <span className={`text-xs font-black px-2 py-1 rounded-lg whitespace-nowrap ${
 i === 0
 ? "bg-brand-teal-600 text-white"
 : "bg-brand-bg-alt text-brand-text-mute "
 }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-brand-text-mute text-center py-4">No upcoming IA slots calculated yet.</p>
      )}

      {/* CTA */}
      <button
        onClick={() => navigate("/student/internal")}
        className="mt-4 w-full py-2.5 rounded-xl border border-brand-teal-200 text-brand-teal-600 font-bold text-xs uppercase tracking-wide hover:bg-brand-teal-50 transition-colors"
      >
        {isIADay && canStart ? "Start Today's Assessment →" : "View Full Schedule →"}
      </button>
    </div>
  );
}
