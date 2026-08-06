import React, { useState } from "react";
import { Lock, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const MAX_ATTEMPTS = 5;

export default function ResumePasswordModal({ onVerified }: { onVerified: () => void }) {
  const { user, profile, signOut } = useAuth();
  const email = profile?.email || user?.email || "";
  // OAuth (Google etc.) accounts have no password — force a full re-login instead.
  const isPasswordAccount = (user?.app_metadata?.provider ?? "email") === "email";

  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        const next = attempts + 1;
        setAttempts(next);
        setPassword("");
        if (next >= MAX_ATTEMPTS) {
          await signOut(); // clears session + redirects to /login
          return;
        }
        setError(`Incorrect password. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} left.`);
      } else {
        onVerified();
      }
    } catch {
      setError("Verification failed. Check your connection and try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 pt-20">
      <div className="bg-white p-8 md:p-10 rounded-xl border-2 border-gray-900 max-w-md w-full rpm-fade-in" style={{ boxShadow: "6px 6px 0 #0F0F0F" }}>
        <div className="w-14 h-14 bg-brand-teal-700 border-2 border-gray-900 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ boxShadow: "3px 3px 0 #0F0F0F" }}>
          <Lock className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide text-center mb-2">
          Verify It&apos;s You
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          You have a diagnostic in progress.{" "}
          {isPasswordAccount
            ? "Enter your password to resume exactly where you left off."
            : "For security, please log in again to resume."}
        </p>

        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm font-bold text-gray-700 text-center mb-4 truncate">
          {email}
        </div>

        {isPasswordAccount ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
              autoComplete="current-password"
              className="w-full border-2 border-gray-900 rounded-lg p-3.5 text-sm font-bold focus:border-brand-teal-700 focus:ring-2 focus:ring-brand-teal-100 outline-none transition-all bg-white placeholder:text-gray-300 text-gray-900"
              style={{ boxShadow: "3px 3px 0 #0F0F0F" }}
            />
            {error && <p className="text-red-600 text-xs font-bold text-center">{error}</p>}
            <button
              type="submit"
              disabled={!password || verifying}
              className="w-full py-3.5 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-black text-sm uppercase tracking-wide rounded-lg border-2 border-gray-900 transition-all rpm-btn disabled:opacity-60 disabled:pointer-events-none"
              style={{ boxShadow: "4px 4px 0 #0F0F0F" }}
            >
              {verifying ? "Verifying…" : "Resume Diagnostic →"}
            </button>
          </form>
        ) : (
          <button
            onClick={() => signOut()}
            className="w-full py-3.5 bg-brand-teal-700 hover:bg-brand-teal-600 text-white font-black text-sm uppercase tracking-wide rounded-lg border-2 border-gray-900 transition-all rpm-btn"
            style={{ boxShadow: "4px 4px 0 #0F0F0F" }}
          >
            Log In Again →
          </button>
        )}

        <button
          onClick={() => signOut()}
          className="w-full mt-4 flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-700 text-xs font-bold uppercase tracking-wide transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Not you? Switch account
        </button>
      </div>

      <style>{`
        @keyframes rpm-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .rpm-fade-in { animation: rpm-fade 0.35s ease-out; }
        .rpm-btn { transition: all 0.1s ease; }
        .rpm-btn:hover { transform: translate(-1px, -1px); }
        .rpm-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #0F0F0F !important; }
      `}</style>
    </div>
  );
}