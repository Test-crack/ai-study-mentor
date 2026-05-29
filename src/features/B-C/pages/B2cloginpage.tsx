// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/features/b2c/pages/B2CLoginPage.tsx
// CREATE this file at that path.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, Gamepad2, Zap, Trophy, Flame } from 'lucide-react';

export default function B2CLoginPage() {
  const navigate = useNavigate();

  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [step,      setStep]      = useState<'enter' | 'sent'>('enter');

  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // ── TODO: Replace with real auth API call ─────────────────────────────
      // const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      // const res = await fetch(`${backendUrl}/api/b2c/auth/magic-link`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: email.trim() }),
      // });
      // ── For now: simulate and navigate directly ───────────────────────────
      await new Promise(r => setTimeout(r, 1200));
      // Store email in sessionStorage for dashboard to pick up
      sessionStorage.setItem('b2c_email', email.trim());
      navigate('/b2c/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Feature pills shown on the left panel ────────────────────────────────
  const features = [
    { icon: <Gamepad2 className="w-4 h-4" />, text: '6 IELTS-skill games' },
    { icon: <Zap       className="w-4 h-4" />, text: 'Earn Momentum points' },
    { icon: <Flame     className="w-4 h-4" />, text: 'Daily streak tracker' },
    { icon: <Trophy    className="w-4 h-4" />, text: 'Band score leaderboard' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex">

      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 relative overflow-hidden flex-col justify-between p-12">

        {/* Background circles */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 -left-20 w-64 h-64 rounded-full bg-purple-400/20 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 backdrop-blur-sm">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-tight leading-none">TestCrack</p>
            <p className="text-indigo-200 text-xs font-medium tracking-widest uppercase">Play · Learn · Score</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
            Crack IELTS<br />
            <span className="text-indigo-200">one game</span><br />
            at a time.
          </h1>
          <p className="text-indigo-100 text-base leading-relaxed mb-8 max-w-sm">
            Sharpen your vocabulary, reading, and grammar through fast, addictive games — each one designed around real IELTS exam patterns.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium"
              >
                {f.icon}
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom game preview strips */}
        <div className="relative z-10">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-3">Games available</p>
          <div className="flex gap-2 flex-wrap">
            {['LexiGrid', 'Trap Spotter', 'Band Ladder', 'Sentence Surgery', 'Inference Sprint', 'Connector Chain'].map(g => (
              <span key={g} className="text-xs bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 font-semibold">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-slate-800 dark:text-white font-black text-lg leading-none">TestCrack</p>
            <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Play · Learn · Score</p>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {step === 'enter' ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1">
                  Sign in to play
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Enter your email — we'll get you in instantly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none transition-all
                        ${error
                          ? 'border-rose-400 ring-1 ring-rose-400'
                          : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                        }`}
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-rose-500 font-medium mt-1.5">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
                No password needed. No app to download.<br />Just your email and you're in.
              </p>
            </>
          ) : (
            /* Sent state */
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Mail className="w-7 h-7 text-indigo-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Check your inbox</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                We sent a sign-in link to<br />
                <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
              </p>
              <button
                onClick={() => setStep('enter')}
                className="text-indigo-500 hover:text-indigo-600 text-sm font-bold transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}