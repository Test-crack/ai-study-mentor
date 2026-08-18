import { Gamepad2, Target, ClipboardCheck, FileText } from 'lucide-react';
import { cn } from '@/shared/utils';
import { HERO_SUMMARY_ROWS } from './data';
import { ACCENTS } from './accents';
import type { OrbitNodeId } from './types';

const ORBIT_NODES: { id: OrbitNodeId; label: string; icon: typeof Gamepad2; position: string }[] = [
  { id: 'lexigrid', label: 'LexiGrid', icon: Gamepad2, position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
  { id: 'drills', label: 'Drills', icon: Target, position: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2' },
  { id: 'ia', label: 'Internal Assessment', icon: ClipboardCheck, position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
  { id: 'mock', label: 'Full Mock', icon: FileText, position: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2' },
];

const NODE_ACCENT: Record<OrbitNodeId, 'teal' | 'amber' | 'indigo' | 'violet'> = {
  lexigrid: 'teal',
  drills: 'amber',
  ia: 'indigo',
  mock: 'violet',
};

export function HeroOrbit({
  activeCaption,
  activeNode,
}: {
  activeCaption: string;
  activeNode?: OrbitNodeId;
}) {
  return (
    <div className="rounded-3xl bg-brand-ink dark:bg-slate-900 border border-white/5 p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-6">
      {/* Left — summary */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-4 h-px bg-brand-mint" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-mint">
            The whole system
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Four loops, one band score
        </h1>
        <p className="text-sm text-white/60 max-w-md mb-5 leading-relaxed">
          Everything on the platform feeds one number. The daily loop keeps you sharp, assessments re-score you, and the mock confirms it. Tap any ring to see how it works.
        </p>

        <div className="space-y-1.5">
          {HERO_SUMMARY_ROWS.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] border border-white/5 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-brand-mint bg-brand-mint/10 rounded-full px-2 py-0.5">
                  {row.cadence}
                </span>
                <span className="text-[13px] text-white/85 truncate">{row.label}</span>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-white/90">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — orbit diagram */}
      <div className="flex items-center justify-center py-2">
        <div className="relative w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]">
          <div className="absolute inset-0 rounded-full border border-dashed border-white/15" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
              Your band
            </span>
            <span className="text-3xl font-black text-white tracking-tight leading-tight mt-0.5">
              5.5
            </span>
            <span className="text-[10px] text-brand-mint font-medium mt-1 leading-tight">
              {activeCaption}
            </span>
          </div>

          {ORBIT_NODES.map((node) => {
            const isActive = activeNode === node.id;
            const accent = ACCENTS[NODE_ACCENT[node.id]];
            const Icon = node.icon;
            return (
              <div
                key={node.id}
                className={cn('absolute flex flex-col items-center gap-1 w-20', node.position)}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300',
                    isActive
                      ? cn(accent.orbitActiveBg, accent.orbitActiveBorder, 'shadow-lg')
                      : 'bg-white/5 border-white/10'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-white/30')} />
                </div>
                <span
                  className={cn(
                    'text-[9px] text-center leading-tight transition-colors duration-300',
                    isActive ? 'text-white/80 font-semibold' : 'text-white/30'
                  )}
                >
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
