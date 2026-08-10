import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import testcrackLogo from '@/assets/testcrack-logo.svg';
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
    <div className="min-h-screen bg-brand-bg font-plex text-brand-text antialiased flex items-center justify-center p-4 lg:p-12">
      {/* OPEN BOOK CONTAINER */}
      <div className="flex w-full max-w-5xl bg-white overflow-hidden min-h-[620px] flex-col md:flex-row border border-brand-line">

        {/* LEFT – Visual Branding */}
        <div className="w-full md:w-[45%] bg-brand-ink p-10 md:p-14 flex flex-col justify-between relative overflow-hidden text-brand-bg">

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <Link to="/">
                <img src={testcrackLogo} alt="TestCrack" className="h-10 w-10 object-contain shrink-0" />
              </Link>
              <span className="font-manrope text-2xl font-extrabold tracking-[-0.03em] text-brand-bg">TestCrack</span>
            </div>

            <div className="space-y-6">
              <h2 className="font-manrope text-4xl lg:text-5xl font-extrabold leading-[1.05] tracking-[-0.04em] text-brand-bg">
                {isForgotPassword ? "Recover Your Access." : "Welcome Back to TestCrack."}
              </h2>
              <p className="text-brand-on-ink text-[18px] leading-[1.7] max-w-xs">
                {isForgotPassword
                  ? "Enter your email and we'll send you a link to reset your password."
                  : "Sign in to access your personalized study companion and master your exams."}
              </p>
            </div>
          </div>

          {/* Bottom decorative card */}
          <div className="relative z-10 mt-10 p-5 border border-brand-line-16">
            <p className="font-jetbrains text-[10.5px] text-brand-teal-soft uppercase tracking-[0.16em] mb-2">Access controlled</p>
            <p className="text-[14px] text-brand-on-ink leading-[1.65]">
              Accounts are created by administrators. Contact your institute or platform admin to get access.
            </p>
          </div>
        </div>

        {/* RIGHT – Form */}
        <div className="w-full md:w-[55%] p-8 md:p-20 flex flex-col justify-center bg-white">

          <div className="mb-8">
            <h3 className="font-manrope text-3xl font-extrabold text-brand-ink tracking-[-0.04em] leading-[1.1] mb-3">
              {isForgotPassword ? "Reset Password" : "Sign In"}
            </h3>
            <p className="text-brand-text-mute text-[16.5px] leading-[1.7]">
              {isForgotPassword
                ? "Enter your email address to receive a reset link."
                : "Enter your credentials to access your dashboard."}
            </p>
          </div>

          <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.14em]">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                className="h-12 bg-white border-brand-line rounded-[4px] text-[14.5px] text-brand-text placeholder:text-brand-text-mute focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-teal transition-colors duration-150"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-jetbrains text-[10.5px] text-brand-text-mute uppercase tracking-[0.14em]">Password</Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[13px] font-semibold text-brand-teal hover:text-brand-teal-dark hover:underline transition-colors duration-150"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-12 bg-white border-brand-line pr-12 rounded-[4px] text-[14.5px] text-brand-text placeholder:text-brand-text-mute focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-brand-teal transition-colors duration-150"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-mute hover:text-brand-ink transition-colors duration-150"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-[15.5px] rounded-md shadow-none transition-colors duration-150 active:scale-[0.98] mt-4"
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
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-brand-text-mute hover:text-brand-teal transition-colors duration-150"
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
