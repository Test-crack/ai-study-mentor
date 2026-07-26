// src/shared/components/NetworkStatusBanner.tsx
import { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const NetworkStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const restoredTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track if we've ever been offline — don't flash "back online" on first mount
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline.current) {
        setShowRestored(true);
        restoredTimer.current = setTimeout(() => setShowRestored(false), 3000);
      }
    };
    const handleOffline = () => {
      wasOffline.current = true;
      setIsOnline(false);
      setShowRestored(false);
      if (restoredTimer.current) clearTimeout(restoredTimer.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (restoredTimer.current) clearTimeout(restoredTimer.current);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      role="alert"
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors duration-300 ${
        isOnline ? 'bg-emerald-600' : 'bg-red-600'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={16} />
          Back online — you're all set!
        </>
      ) : (
        <>
          <WifiOff size={16} />
          You're offline — please check your internet connection
        </>
      )}
    </div>
  );
};