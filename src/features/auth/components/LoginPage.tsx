import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, GraduationCap, ChevronLeft } from "lucide-react";

const LoginPage = () => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Show success message if redirected from password reset
  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. Please sign in with your new password.",
      });
      navigate("/login", { replace: true });
    }
  }, [searchParams, toast, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error("Please verify your email before signing in. Check your inbox for the confirmation link.");
      }
      toast({ title: "Welcome back!", description: "You've been signed in successfully." });
      // Navigate to /login — LoginRedirect component in App.tsx will handle role-based redirect
      navigate("/login");
    } catch (error: any) {
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Check Your Email", description: "We've sent you a password reset link." });
      setIsForgotPassword(false);
      setEmail("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-12">
      {/* OPEN BOOK CONTAINER */}
      <div className="flex w-full max-w-5xl bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] min-h-[620px] flex-col md:flex-row border border-slate-100">

        {/* LEFT – Visual Branding */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-indigo-900 to-blue-800 p-10 md:p-14 flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full -ml-20 -mb-20 blur-[80px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg ring-1 ring-white/10">
                <GraduationCap className="h-7 w-7 text-indigo-100" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white/95 drop-shadow-sm">TestCrack</span>
            </div>

            <div className="space-y-6">
              <h2 style={{ fontFamily: "sans-serif", fontWeight: "bold" }} className="text-4xl lg:text-5xl font-extrabold leading-[1.15]">
                {isForgotPassword ? "Recover Your Access." : "Welcome Back to TestCrack."}
              </h2>
              <p className="text-purple-100/80 text-lg leading-relaxed max-w-xs">
                {isForgotPassword
                  ? "Enter your email and we'll send you a link to reset your password."
                  : "Sign in to access your personalized study companion and master your exams."}
              </p>
            </div>
          </div>

          {/* Bottom decorative card */}
          <div className="relative z-10 mt-10 p-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <p className="text-xs text-indigo-200/70 uppercase tracking-widest font-semibold mb-1">Access controlled</p>
            <p className="text-sm text-indigo-50/80 leading-relaxed">
              Accounts are created by administrators. Contact your institute or platform admin to get access.
            </p>
          </div>
        </div>

        {/* RIGHT – Form */}
        <div className="w-full md:w-[55%] p-8 md:p-20 flex flex-col justify-center bg-white">

          <div className="mb-8">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {isForgotPassword ? "Reset Password" : "Sign In"}
            </h3>
            <p className="text-slate-500 font-medium">
              {isForgotPassword
                ? "Enter your email address to receive a reset link."
                : "Enter your credentials to access your dashboard."}
            </p>
          </div>

          <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-slate-700 font-bold text-sm ml-1">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-2xl transition-all"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-slate-700 font-bold text-sm">Password</Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-12 bg-slate-50 border-slate-200 pr-12 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-2xl transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] mt-4"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isForgotPassword
                ? "Send Reset Link"
                : "Sign In"}
            </Button>
          </form>

          {/* Back to login link */}
          {isForgotPassword && (
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setEmail("");
                }}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
