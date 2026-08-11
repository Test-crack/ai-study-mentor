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

const CARD_BG =
  "relative overflow-hidden rounded-3xl bg-brand-ink-deep border border-brand-line-16 p-5 shadow-sm h-full flex flex-col";
const CARD_GRID_STYLE = {
  backgroundImage:
    'linear-gradient(to right, rgba(62,224,160,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(62,224,160,0.05) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};

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
    <div className={`${CARD_BG} animate-pulse`} style={CARD_GRID_STYLE}>
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-2.5 w-16 bg-white/10 rounded" />
          </div>
        </div>
        <div className="h-3 w-10 bg-white/10 rounded" />
      </div>
      <div className="relative z-10 flex flex-col gap-3 flex-1">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-brand-line-16">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-36 bg-white/10 rounded" />
              <div className="h-2.5 w-20 bg-white/10 rounded" />
            </div>
            <div className="h-5 w-14 bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="relative z-10 mt-4 h-9 w-full bg-white/10 rounded-xl" />
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
    <div className={CARD_BG} style={CARD_GRID_STYLE}>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-4 h-4 text-brand-mint" />
          </div>
          <div>
            <p className="font-dm font-bold text-white text-sm leading-tight">IA Schedule</p>
            <p className="text-xs text-brand-on-ink-mute leading-tight">Internal Assessments</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/student/internal")}
          className="text-xs font-semibold text-brand-mint hover:underline flex items-center gap-0.5"
        >
          View <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative z-10 flex flex-col flex-1">

      {/* Due tomorrow — required, not yet actionable */}
      {isImminent && (
        <div className="rounded-xl px-4 py-3 mb-4 border border-brand-line-16 border-l-[3px] border-l-brand-purple bg-white/5">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-white">
              Internal Assessment #{status.current_ia_number}
            </p>
            <span className="font-jetbrains text-[9px] font-bold uppercase tracking-wider bg-brand-purple/20 text-brand-purple-tint px-2 py-0.5 rounded-full">
              Required
            </span>
          </div>
          <p className="text-xs font-medium text-brand-on-ink-mute">
            Due {nextSlot.days_away === 0 ? "today" : "tomorrow"}, {nextSlot.date_formatted}. This re-scores your sub-scores — miss it and your scores go stale and momentum drops.
          </p>
        </div>
      )}

      {/* Today is IA day banner */}
      {isIADay && (
        <div className={`rounded-xl px-4 py-3 mb-4 flex items-center justify-between border border-l-[3px] bg-white/5 ${
 canStart
 ? "border-brand-line-16 border-l-brand-mint "
 : "border-brand-line-16 border-l-rose-500 "
 }`}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-jetbrains text-xs font-black uppercase tracking-widest text-white">
                IA #{status.current_ia_number} — Today
              </p>
              <span className={`font-jetbrains text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${canStart ? "bg-brand-mint text-brand-ink-deep" : "bg-rose-500 text-white"}`}>
                Required
              </span>
            </div>
            <p className={`text-xs font-medium ${canStart ? "text-brand-mint " : "text-rose-300 "}`}>
              {canStart ? "You're eligible — start your assessment" : `DCS ${status.avg_dcs}% — need 40% to start`}
            </p>
          </div>
          {canStart
            ? <CheckCircle2 className="w-5 h-5 text-brand-mint flex-shrink-0" />
            : <Zap         className="w-5 h-5 text-rose-400 flex-shrink-0" />
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
 ? "border-brand-mint/25 bg-white/5 "
 : "border-brand-line-16 bg-white/[0.03] "
 }`}
              >
                {/* Date pill */}
                <div className={`flex flex-col items-center justify-center rounded-xl w-12 h-12 flex-shrink-0 border-2 ${
 i === 0
 ? "bg-brand-mint border-brand-mint/60 "
 : "bg-white/5 border-brand-line-16 "
 }`}>
                  <span className={`font-black text-base leading-none ${i === 0 ? "text-brand-ink-deep" : "text-white "}`}>{day}</span>
                  <span className={`font-jetbrains text-[9px] font-bold uppercase tracking-wide leading-none mt-0.5 ${i === 0 ? "text-brand-ink-deep/70" : "text-brand-on-ink-mute "}`}>{month}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${i === 0 ? "text-white " : "text-brand-on-ink-mute "}`}>
                    Internal Assessment #{slot.number}
                  </p>
                  <p className={`text-xs font-medium ${i === 0 ? "text-brand-mint " : "text-brand-on-ink-mute "}`}>
                    {slot.date_formatted}
                  </p>
                </div>

                {/* Days badge */}
                <span className={`text-xs font-black px-2 py-1 rounded-lg whitespace-nowrap ${
 i === 0
 ? "bg-brand-mint text-brand-ink-deep"
 : "bg-white/10 text-brand-on-ink-mute "
 }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-brand-on-ink-mute text-center py-4">No upcoming IA slots calculated yet.</p>
      )}

      {/* CTA */}
      <button
        onClick={() => navigate("/student/internal")}
        className="mt-4 w-full py-2.5 rounded-xl border border-brand-line-16 text-white font-bold text-xs uppercase tracking-wide hover:bg-white/5 transition-colors"
      >
        {isIADay && canStart ? "Start Today's Assessment →" : "View Full Schedule →"}
      </button>
      </div>
    </div>
  );
}
