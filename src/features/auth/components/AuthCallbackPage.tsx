import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Loader2, Eye, EyeOff, CheckCircle2, ShieldAlert } from "lucide-react";

/**
 * Landing page for Supabase auth action links (invite / recovery / signup).
 * Backend invites redirect here (FRONTEND_URL/auth/callback) instead of /login.
 *
 * Flow:
 *   1. Parse the URL hash tokens and establish a session.
 *   2. type=invite   → show a "set your password" form, then route into the app.
 *      type=recovery → hand off to /reset-password.
 *      otherwise     → route into the app via /dashboard.
 */
type Phase = "processing" | "set-password" | "error";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [phase, setPhase] = useState<Phase>("processing");
  const [errorMsg, setErrorMsg] = useState("");
  const [linkType, setLinkType] = useState(""); // "invite" | "recovery" | "" — used to tailor error messaging
  const ran = useRef(false); // StrictMode / re-mount guard — process the hash once

  // Set-password form state
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes("access_token")) {
        setErrorMsg("This link is missing its sign-in token. Please use the link from your email again.");
        setPhase("error");
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const type = params.get("type") ?? "";
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token") ?? "";
      const linkError = params.get("error_description") ?? params.get("error");

      // Persist type so the error phase can tailor its messaging.
      setLinkType(type);

      if (linkError) {
        setErrorMsg(decodeURIComponent(linkError).replace(/\+/g, " "));
        setPhase("error");
        return;
      }
      if (!accessToken) {
        setErrorMsg("Invalid or expired link.");
        setPhase("error");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        setPhase("error");
        return;
      }

      // Strip the tokens from the address bar.
      window.history.replaceState(null, "", window.location.pathname);

      if (type === "recovery") {
        navigate("/reset-password", { replace: true });
        return;
      }
      if (type === "invite") {
        // Invited users have no password yet — force them to set one before entering.
        setPhase("set-password");
        return;
      }
      // signup / magiclink / generic — session is live; route by role.
      await refreshProfile().catch(() => {});
      navigate("/dashboard", { replace: true });
    })();
  }, [navigate, refreshProfile]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormError(error.message || "Could not set your password. Please try again.");
        setSubmitting(false);
        return;
      }
      // Session is already active; load the profile so the role-based redirect is correct.
      await refreshProfile().catch(() => {});
      navigate("/dashboard", { replace: true });
    } catch {
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (phase === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-teal-50 via-brand-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-brand-teal-600 animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Verifying your invite…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    const isInvite = linkType === "invite";
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-teal-50 via-brand-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6 text-rose-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            {isInvite ? "Invite link expired" : "Link not valid"}
          </h1>
          <p className="text-sm text-slate-500">
            {isInvite
              ? "This invite link has expired or has already been used."
              : errorMsg || "This link has expired or was already used."}
          </p>
          {isInvite ? (
            <>
              <div className="bg-brand-teal-50 rounded-xl p-4 text-left space-y-1">
                <p className="text-sm font-semibold text-brand-teal-800">What to do next</p>
                <p className="text-sm text-brand-teal-700">
                  Contact your institute admin and ask them to resend your invite.
                  They can find the <span className="font-medium">Resend Invite</span> option
                  next to your name in the student list.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Already set your password?{" "}
                <button
                  onClick={() => navigate("/login", { replace: true })}
                  className="text-brand-teal-600 hover:underline font-medium"
                >
                  Go to login
                </button>
              </p>
            </>
          ) : (
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full py-2.5 rounded-lg bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold transition-colors"
            >
              Go to login
            </button>
          )}
        </div>
      </div>
    );
  }

  // phase === "set-password"
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal-50 via-brand-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-full bg-brand-teal-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6 text-brand-teal-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Set your password</h1>
          <p className="text-sm text-slate-500 mt-1">Choose a password to finish setting up your account.</p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">New password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoFocus
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Confirm password</label>
            <input
              type={showPw ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-teal-500 focus:ring-1 focus:ring-brand-teal-500"
            />
          </div>

          {formError && <p className="text-sm text-rose-600">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-brand-teal-600 hover:bg-brand-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Set password & continue
          </button>
        </form>
      </div>
    </div>
  );
}
