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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
        <div className="w-full md:w-[45%] bg-gradient-to-br from-indigo-900 to-blue-800 p-10 md:p-14 flex flex-col justify-between relative overflow-hidden text-white">
          {/* Decorative Blur Elements - Enhanced for Depth */}
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
                <h2 className="text-4xl lg:text-5xl font-extrabold leading-[1.15]">
                  {isForgotPassword ? "Protect Your Progress." : isSignUp ? "Start Your AI Journey." : "Welcome Back to Learning."}
                </h2>
                <p className="text-purple-100/80 text-lg leading-relaxed max-w-xs">
                  Access your personalized study companion and master your exams with ease.
                </p>
            </div>
          </div>

          <div className="relative z-10 p-6 bg-gradient-to-r from-white/10 to-indigo-500/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-sm hover:bg-white/15 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-400/20 p-1.5 rounded-lg">
                  <Rocket className="h-4 w-4 text-amber-300" />
              </div>
              <span className="font-bold text-xs uppercase tracking-widest text-indigo-100">Ready to Demo</span>
            </div>
            <p className="text-sm text-indigo-50/90 leading-relaxed">
              Sign up to test real AI-powered note analysis and YouTube learning features.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: The Form (The Page) */}
        <div className="w-full md:w-[55%] p-8 md:p-20 flex flex-col justify-center bg-white">
          
          <div className="mb-8">
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

          {!isForgotPassword && (
            <>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    className="w-full h-12 rounded-2xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 mb-6 flex items-center justify-center gap-3 shadow-sm"
                >
                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </Button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">Or continue with email</span>
                    </div>
                </div>
            </>
          )}

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