import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle, ChevronLeft, ShieldCheck } from "lucide-react";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setValidSession(false);
          return;
        }
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get("type");
        
        if (session && type === "recovery") {
          setValidSession(true);
        } else if (session) {
          setValidSession(true);
        } else {
          setValidSession(false);
        }
      } catch (err) {
        setValidSession(false);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) return "Password must be at least 6 characters long";
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords Don't Match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({ title: "Invalid Password", description: passwordError, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password Updated!", description: "Your password has been successfully changed." });
      await supabase.auth.signOut();
      navigate("/auth?reset=success");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-slate-500 font-medium">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-12">
      <div className="flex w-full max-w-5xl bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] min-h-[650px] flex-col md:flex-row border border-slate-100">
        
        {/* LEFT SIDE: Visual Branding */}
        <div className="w-full md:w-[45%] bg-indigo-700 p-10 md:p-14 flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full -ml-12 -mb-12 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="p-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">TestCrack</span>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-extrabold leading-[1.15]">
                {validSession ? "Secure Your Account." : "Link Expired."}
              </h2>
              <p className="text-purple-100/80 text-lg leading-relaxed max-w-xs">
                {validSession 
                  ? "Choose a strong password to protect your learning progress and data."
                  : "For your security, reset links are only valid for a limited time."}
              </p>
            </div>
          </div>

          {validSession && (
            <div className="relative z-10 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-5 w-5 text-green-300" />
                <span className="font-bold text-sm uppercase tracking-wider">Security First</span>
              </div>
              <p className="text-sm text-indigo-100/80">
                Update your password to regain access to your AI-powered dashboard.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: The Form */}
        <div className="w-full md:w-[55%] p-8 md:p-20 flex flex-col justify-center bg-white">
          {!validSession ? (
            <div className="text-center space-y-6">
              <div className="inline-flex p-4 bg-red-50 rounded-full mb-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Invalid Link</h3>
              <p className="text-slate-500 font-medium">
                This password reset link is invalid or has expired. Please request a new one from the sign-in page.
              </p>
              <Button 
                onClick={() => navigate("/auth")}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xl mt-4"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Set New Password</h3>
                <p className="text-slate-500 font-medium">Create a secure password with at least 6 characters.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="newPassword" className="text-slate-700 font-bold text-sm ml-1">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-2xl transition-all"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="confirmPassword" className="text-slate-700 font-bold text-sm ml-1">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 rounded-2xl transition-all"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {confirmPassword && (
                  <div className={`flex items-center gap-2 text-sm font-bold ml-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {newPassword === confirmPassword ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {newPassword === confirmPassword ? "Passwords match" : "Passwords don't match"}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] mt-4"
                  disabled={loading || newPassword !== confirmPassword}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>

              <div className="mt-10 text-center">
                <button
                  onClick={() => navigate("/auth")}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;