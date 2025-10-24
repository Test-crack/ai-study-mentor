import { useState, useEffect, useRef } from 'react';

interface FocusTrackingData {
  focusTime: number;
  totalSessionTime: number;
  focusRatio: number;
  tabSwitches: number;
  isCurrentlyFocused: boolean;
}

export const usePageVisibility = () => {
  const [focusData, setFocusData] = useState<FocusTrackingData>({
    focusTime: 0,
    totalSessionTime: 0,
    focusRatio: 1,
    tabSwitches: 0,
    isCurrentlyFocused: true
  });

  const lastActiveRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());
  const focusTimeRef = useRef<number>(0);
  const tabSwitchesRef = useRef<number>(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.hidden) {
        // Page became hidden - add the time since last active to focus time
        focusTimeRef.current += now - lastActiveRef.current;
        tabSwitchesRef.current += 1;
        
        setFocusData(prev => ({
          ...prev,
          isCurrentlyFocused: false,
          tabSwitches: tabSwitchesRef.current
        }));
      } else {
        // Page became visible - update last active time
        lastActiveRef.current = now;
        
        setFocusData(prev => ({
          ...prev,
          isCurrentlyFocused: true
        }));
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update total session time and focus ratio periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const totalSessionTime = now - sessionStartRef.current;
      const currentFocusTime = focusTimeRef.current + (document.hidden ? 0 : now - lastActiveRef.current);
      const focusRatio = totalSessionTime > 0 ? currentFocusTime / totalSessionTime : 1;

      setFocusData(prev => ({
        ...prev,
        focusTime: currentFocusTime,
        totalSessionTime,
        focusRatio
      }));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Reset tracking (useful when starting a new assessment)
  const resetTracking = () => {
    const now = Date.now();
    sessionStartRef.current = now;
    lastActiveRef.current = now;
    focusTimeRef.current = 0;
    tabSwitchesRef.current = 0;
    
    setFocusData({
      focusTime: 0,
      totalSessionTime: 0,
      focusRatio: 1,
      tabSwitches: 0,
      isCurrentlyFocused: true
    });
  };

  // Get final focus data (call this when submitting)
  const getFinalFocusData = (): FocusTrackingData => {
    const now = Date.now();
    const totalSessionTime = now - sessionStartRef.current;
    const finalFocusTime = focusTimeRef.current + (document.hidden ? 0 : now - lastActiveRef.current);
    const focusRatio = totalSessionTime > 0 ? finalFocusTime / totalSessionTime : 1;

    return {
      focusTime: finalFocusTime,
      totalSessionTime,
      focusRatio,
      tabSwitches: tabSwitchesRef.current,
      isCurrentlyFocused: !document.hidden
    };
  };

  return {
    focusData,
    resetTracking,
    getFinalFocusData
  };
};
