import { useEffect, useRef, useState } from "react";

/**
 * useState that survives a page refresh by mirroring to sessionStorage (per-tab; cleared when the
 * tab closes — the right scope for an in-progress admin task). Use for SERIALIZABLE state only —
 * File handles / DOM refs can't be persisted. Keys must be unique per logical field.
 *
 * Values are JSON-serialised; on a parse/quota error it silently falls back to the initial value
 * so a corrupt entry never blocks the UI.
 */
export function usePersistentState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  // Skip the write on the very first render (nothing changed yet) — avoids clobbering a freshly
  // restored value and needless writes.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* quota exceeded or non-serialisable — drop silently */
    }
  }, [key, state]);

  return [state, setState];
}

/** Clear one or more persisted keys (e.g. on an explicit "start over" / reset). */
export function clearPersistentState(...keys: string[]) {
  for (const k of keys) {
    try { sessionStorage.removeItem(k); } catch { /* ignore */ }
  }
}
