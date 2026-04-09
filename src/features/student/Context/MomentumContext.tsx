import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MomentumContextType {
  totalMomentum: number;
  streak: number;
  addPoints: (points: number) => void;
  updateStreak: (newStreak: number) => void;
}

const MomentumContext = createContext<MomentumContextType | undefined>(undefined);

export const MomentumProvider = ({ children }: { children: ReactNode }) => {
  // Load initial values from LocalStorage (or backend later)
  const [totalMomentum, setTotalMomentum] = useState(() => {
    return parseInt(localStorage.getItem('testcrack_momentum') || '120', 10); // starting with 120 for demo
  });
  
  const [streak, setStreak] = useState(() => {
    return parseInt(localStorage.getItem('testcrack_streak') || '2', 10); 
  });

  // Auto-save to LocalStorage whenever it changes (to persist across reloads for now)
  useEffect(() => {
    localStorage.setItem('testcrack_momentum', totalMomentum.toString());
  }, [totalMomentum]);

  // The function to call when the backend says "You earned X points!"
  const addPoints = (points: number) => {
    setTotalMomentum(prev => prev + points);
  };

  const updateStreak = (newStreak: number) => {
    setStreak(newStreak);
    localStorage.setItem('testcrack_streak', newStreak.toString());
  };

  return (
    <MomentumContext.Provider value={{ totalMomentum, streak, addPoints, updateStreak }}>
      {children}
    </MomentumContext.Provider>
  );
};

export const useMomentum = () => {
  const context = useContext(MomentumContext);
  if (!context) throw new Error('useMomentum must be used within MomentumProvider');
  return context;
};