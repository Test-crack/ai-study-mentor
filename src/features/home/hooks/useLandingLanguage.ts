import { useCallback, useEffect, useState } from 'react';
import { LANDING_COPY, type LandingCopy, type LandingLang } from '../i18n/landingCopy';

const STORAGE_KEY = 'testcrack.landing.lang';

const isLandingLang = (value: unknown): value is LandingLang => value === 'en' || value === 'ml';

/**
 * Reads the visitor's stored choice, falling back to their browser language and
 * then English. Runs as lazy initial state so the first paint is already in the
 * right language — no English flash before a Malayalam-preferring visitor's
 * preference is applied.
 *
 * localStorage throws in some privacy modes, so every access is guarded; the
 * toggle still works for the session when storage is unavailable.
 */
const readInitialLang = (): LandingLang => {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLandingLang(stored)) return stored;
  } catch {
    // Storage blocked — fall through to browser language.
  }
  return window.navigator?.language?.toLowerCase().startsWith('ml') ? 'ml' : 'en';
};

/**
 * Landing-page language state. Scoped to the public landing page — the
 * authenticated app is not translated and does not read this.
 */
export const useLandingLanguage = () => {
  const [lang, setLangState] = useState<LandingLang>(readInitialLang);

  const setLang = useCallback((next: LandingLang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked — the choice still applies for this session.
    }
  }, []);

  // Keep the document language in sync so screen readers and the browser's
  // own translation prompt treat the page as Malayalam when it is.
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [lang]);

  const copy: LandingCopy = LANDING_COPY[lang];
  return { lang, setLang, copy };
};
