// Hydrates the exam-config singleton (examConfigStore) once from GET /api/exams after auth, then
// bumps a context so anything that rendered against the fallback re-renders with the live config.
// Mount high in the authenticated app tree. Pure display helpers (examScale) read the singleton
// synchronously; this provider is only about (a) filling it and (b) triggering the one re-render.
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { getBackendUrl } from "@/shared/utils";
import { hydrateExamConfigs, isExamConfigHydrated } from "./examConfigStore";

const ExamConfigReadyContext = createContext(false);

/** True once /api/exams has hydrated the config cache (re-renders consumers when it flips). */
export const useExamConfigReady = () => useContext(ExamConfigReadyContext);

export function ExamConfigProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [ready, setReady] = useState(isExamConfigHydrated());

  useEffect(() => {
    if (!profile || isExamConfigHydrated()) {
      if (isExamConfigHydrated() && !ready) setReady(true);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await callBackend(`${getBackendUrl()}/api/exams`);
        hydrateExamConfigs(res?.data);
      } catch {
        /* fallback config stays — live exams still render correctly */
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, [profile, ready]);

  return <ExamConfigReadyContext.Provider value={ready}>{children}</ExamConfigReadyContext.Provider>;
}
