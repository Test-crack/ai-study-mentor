import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface MomentumContextType {
  totalMomentum: number;
  streak: number;
  addPoints: (points: number, reason?: string) => void;
  deductPoints: (points: number, reason?: string) => void;
  syncMomentum: (serverScore: number) => void;
  updateStreak: (newStreak: number) => void;
  applyMissPenalty: (missCount: 1 | 2, cycleKey: string) => boolean;
  hasPenaltyBeenApplied: (cycleKey: string) => boolean;
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const MomentumContext = createContext<MomentumContextType | undefined>(undefined);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export const MomentumProvider = ({ children }: { children: ReactNode }) => {

  // ── Core State ──────────────────────────────────────────────────────────────

  const [totalMomentum, setTotalMomentum] = useState<number>(() => {
    const stored = localStorage.getItem('testcrack_momentum');
    return stored !== null ? parseInt(stored, 10) : 120;
  });

  const [streak, setStreak] = useState<number>(() => {
    const stored = localStorage.getItem('testcrack_streak');
    // Default 0 — backend authoritative value overwrites this on first load
    return stored !== null ? parseInt(stored, 10) : 0;
  });

  /**
   * Tracks which penalty cycles have already been applied.
   * Key format: "miss_penalty_<cycleKey>" where cycleKey is a unique identifier
   * per miss event (e.g. "2026-W25-miss1", "2026-W25-miss2").
   * This prevents double-deduction on re-renders or page reloads.
   */
  const [appliedPenalties, setAppliedPenalties] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('testcrack_applied_penalties');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // ── Persistence Side-Effects ─────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem('testcrack_momentum', totalMomentum.toString());
  }, [totalMomentum]);

  useEffect(() => {
    localStorage.setItem(
      'testcrack_applied_penalties',
      JSON.stringify(Array.from(appliedPenalties))
    );
  }, [appliedPenalties]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addPoints = useCallback((points: number, reason?: string) => {
    if (reason) console.info(`[Momentum] +${points} — ${reason}`);
    setTotalMomentum(prev => prev + Math.abs(points));
  }, []);

  /**
   * Safely deducts points. Floors at 0 — momentum can never go negative.
   */
  const deductPoints = useCallback((points: number, reason?: string) => {
    if (reason) console.info(`[Momentum] -${Math.abs(points)} — ${reason}`);
    setTotalMomentum(prev => Math.max(0, prev - Math.abs(points)));
  }, []);

  // Override local state with the authoritative value from the backend
  const syncMomentum = useCallback((serverScore: number) => {
    setTotalMomentum(serverScore);
  }, []);

  const updateStreak = useCallback((newStreak: number) => {
    setStreak(newStreak);
    localStorage.setItem('testcrack_streak', newStreak.toString());
  }, []);

  /**
   * Applies a miss penalty ONCE per unique cycleKey.
   * Miss 1 → −20 pts. Miss 2 → −40 pts (cumulative from miss 1 = −60 total).
   *
   * cycleKey should encode enough context to be unique per event:
   *   e.g. `${studentId}_${isoWeek}_miss${missCount}`
   *   For now a date-based key works fine: `${todayDate}_miss${missCount}`
   *
   * Returns true if the penalty was freshly applied, false if already recorded.
   */
  const applyMissPenalty = useCallback(
    (missCount: 1 | 2, cycleKey: string): boolean => {
      if (appliedPenalties.has(cycleKey)) return false; // guard — already applied

      const deduction = missCount === 1 ? 20 : 40;
      const reason = missCount === 1
        ? 'Missed assessment — cycle 1'
        : 'Second consecutive missed assessment — cycle 2 intervention';

      deductPoints(deduction, reason);

      setAppliedPenalties(prev => {
        const next = new Set(prev);
        next.add(cycleKey);
        return next;
      });

      return true;
    },
    [appliedPenalties, deductPoints]
  );

  const hasPenaltyBeenApplied = useCallback(
    (cycleKey: string): boolean => appliedPenalties.has(cycleKey),
    [appliedPenalties]
  );

  // ── Provider ─────────────────────────────────────────────────────────────────

  return (
    <MomentumContext.Provider
      value={{
        totalMomentum,
        streak,
        addPoints,
        deductPoints,
        syncMomentum,
        updateStreak,
        applyMissPenalty,
        hasPenaltyBeenApplied,
      }}
    >
      {children}
    </MomentumContext.Provider>
  );
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const useMomentum = (): MomentumContextType => {
  const context = useContext(MomentumContext);
  if (!context) {
    throw new Error('useMomentum must be used within a MomentumProvider');
  }
  return context;
};