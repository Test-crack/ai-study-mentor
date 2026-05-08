import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface MomentumContextType {
  totalMomentum: number;
  streak: number;
  addPoints: (points: number, reason?: string) => void;
  deductPoints: (points: number, reason?: string) => void;
  syncMomentum: (serverScore: number, force?: boolean) => void;
  updateStreak: (newStreak: number) => void;
  applyMissPenalty: (missCount: 1 | 2, cycleKey: string) => boolean;
  hasPenaltyBeenApplied: (cycleKey: string) => boolean;
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const MomentumContext = createContext<MomentumContextType | undefined>(undefined);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export const MomentumProvider = ({ children }: { children: ReactNode }) => {

  // ── Core State ──────────────────────────────────────────────────────────────

  // ✅ FIXED: Initialize from localStorage so your score survives a page refresh!
  const [totalMomentum, setTotalMomentum] = useState<number>(() => {
    const saved = localStorage.getItem('testcrack_momentum');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [streak, setStreak] = useState<number>(0);

  const [appliedPenalties, setAppliedPenalties] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('testcrack_applied_penalties');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // ── Persistence Side-Effects ─────────────────────────────────────────────────

  // ✅ FIXED: Save to localStorage every time the score changes
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

  const deductPoints = useCallback((points: number, reason?: string) => {
    if (reason) console.info(`[Momentum] -${Math.abs(points)} — ${reason}`);
    setTotalMomentum(prev => Math.max(0, prev - Math.abs(points)));
  }, []);

  // ✅ FIXED: Smart Sync. Ignores the database if your local score is higher.
  const syncMomentum = useCallback((serverScore: number, force: boolean = false) => {
    setTotalMomentum(prev => {
      // If we force an update (like spending points), or if local is 0, trust the server.
      if (force || prev === 0) {
        return serverScore;
      }
      // Otherwise, keep whichever score is higher so you don't lose un-synced points!
      return Math.max(prev, serverScore);
    });
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