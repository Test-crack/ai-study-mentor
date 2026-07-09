import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface MomentumContextType {
  totalMomentum: number;
  streak: number;
  addPoints: (points: number, reason?: string, multiplier?: number) => void;
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

  const [totalMomentum, setTotalMomentum] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  const [appliedPenalties, setAppliedPenalties] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('testcrack_applied_penalties');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // ── Persistence Side-Effects ─────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem(
      'testcrack_applied_penalties',
      JSON.stringify(Array.from(appliedPenalties))
    );
  }, [appliedPenalties]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  // Handles standard additions + the ?mode=replay multiplier (0.5x)
  const addPoints = useCallback((points: number, reason?: string, multiplier: number = 1.0) => {
    const finalPoints = Math.round(points * multiplier);
    if (reason) console.info(`[Momentum] ${finalPoints >= 0 ? '+' : ''}${finalPoints} (Base: ${points}, Mult: ${multiplier}x) — ${reason}`);

    // Respect the sign: a negative value (e.g. the -150 optimistic LexiGrid-skip
    // deduction) must subtract. Math.abs previously turned every call into an add,
    // so skipping visibly *raised* the topbar until syncMomentum corrected it.
    setTotalMomentum(prev => Math.max(0, prev + finalPoints));
  }, []);

  // Handles skips (-20 pts) and missed assessment penalties (-20/-40 pts)
  const deductPoints = useCallback((points: number, reason?: string) => {
    const deduction = Math.abs(points);
    if (reason) console.info(`[Momentum] -${deduction} — ${reason}`);
    
    setTotalMomentum(prev => Math.max(0, prev - deduction));
  }, []);

  // Authoritative sync from Sarthak's backend
  const syncMomentum = useCallback((serverScore: number) => {
    setTotalMomentum(serverScore);
  }, []);

  const updateStreak = useCallback((newStreak: number) => {
    setStreak(newStreak);
  }, []);

  const applyMissPenalty = useCallback(
    (missCount: 1 | 2, cycleKey: string): boolean => {
      if (appliedPenalties.has(cycleKey)) return false; 

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