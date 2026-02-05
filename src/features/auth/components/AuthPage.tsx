import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, GraduationCap, ChevronLeft, Rocket } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Logic Preserved: Show success message if redirected from password reset
  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. Please sign in with your new password.",
      });
      navigate("/auth", { replace: true });
    }
  }, [searchParams, toast, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile?welcome=true`,
          },
        });
        if (error) throw error;
        toast({
          title: "Success!",
          description: "Please check your email to confirm your account before signing in.",
        });
        setEmail("");
        setPassword("");
        setIsSignUp(false);
      } else {
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
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      {/* THE OPEN BOOK CONTAINER */}
      <div className="flex w-full max-w-5xl bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] min-h-[650px] flex-col md:flex-row border border-slate-100">
        
        {/* LEFT SIDE: Visual Branding (The Cover) */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-10 md:p-14 flex flex-col justify-between relative overflow-hidden text-white">
          {/* Decorative Blur Elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="p-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">TestCrack</span>
            </div>
            
            <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-extrabold leading-[1.15]">
                  {isForgotPassword ? "Protect Your Progress." : isSignUp ? "Start Your AI Journey." : "Welcome Back to Learning."}
                </h2>
                <p className="text-purple-100/80 text-lg leading-relaxed max-w-xs">
                  Access your personalized study companion and master your exams with ease.
                </p>
            </div>
          </div>

          <div className="relative z-10 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl">
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="h-5 w-5 text-blue-300" />
              <span className="font-bold text-sm uppercase tracking-wider">Ready to Demo</span>
            </div>
            <p className="text-sm text-indigo-100/80">
              Sign up to test real AI-powered note analysis and YouTube learning features.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: The Form (The Page) */}
        <div className="w-full md:w-[55%] p-8 md:p-20 flex flex-col justify-center bg-white">
          
          <div className="mb-10">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Sign In"}
            </h3>
            <p className="text-slate-500 font-medium">
              {isForgotPassword 
                ? "Enter your email for a recovery link." 
                : isSignUp 
                ? "Get started with your AI learning companion." 
                : "Enter your credentials to access your dashboard."}
            </p>
          </div>

          <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-slate-700 font-bold text-sm ml-1">Email Address</Label>
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
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                : isSignUp 
                ? "Create Account" 
                : "Sign In"}
            </Button>
          </form>

          {/* Navigation Switcher */}
          <div className="mt-10 text-center">
            {isForgotPassword ? (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to sign in
              </button>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setEmail("");
                    setPassword("");
                  }}
                  className="ml-2 font-bold text-purple-600 hover:text-purple-800 transition-colors"
                >
                  {isSignUp ? "Sign in instead" : "Create account"}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;