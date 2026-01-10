import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, GraduationCap, CheckCircle } from "lucide-react";

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

  // Show success message if redirected from password reset
  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. Please sign in with your new password.",
      });
      // Clean up the URL
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
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Please check your email to confirm your account before signing in.",
        });
        
        // Clear form and switch to login
        setEmail("");
        setPassword("");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if email is verified
        if (!data.user?.email_confirmed_at) {
          await supabase.auth.signOut();
          throw new Error("Please verify your email before signing in. Check your inbox for the confirmation link.");
        }

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
        
        // Redirect to dashboard after successful login
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Check Your Email",
        description: "We've sent you a password reset link. Click it to set your new password.",
      });

      // Switch back to login view
      setIsForgotPassword(false);
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Study Mentor
          </h1>
          <p className="text-muted-foreground">
            {isForgotPassword
              ? "Enter your email to receive a password reset link"
              : isSignUp 
              ? "Create your account to start learning with AI" 
              : "Welcome back! Sign in to continue your learning journey"
            }
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>
              {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? "We'll send you a link to reset your password"
                : isSignUp 
                ? "Get started with your AI-powered learning companion"
                : "Access your personalized study dashboard"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!isForgotPassword && !isSignUp && (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-purple-600 hover:text-purple-700 p-0 h-auto"
                  >
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                disabled={loading}
              >
                {loading 
                  ? "Please wait..." 
                  : isForgotPassword 
                  ? "Send Reset Link" 
                  : isSignUp 
                  ? "Create Account" 
                  : "Sign In"
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              {isForgotPassword ? (
                <Button
                  variant="link"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setEmail("");
                  }}
                  className="text-purple-600 hover:text-purple-700"
                >
                  Back to sign in
                </Button>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setEmail("");
                      setPassword("");
                    }}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    {isSignUp ? "Sign in instead" : "Create account"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo Note */}
        <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold mb-2">🚀 Ready to Demo</h3>
            <p className="text-sm text-purple-100">
              Sign up to test real AI-powered note analysis and YouTube learning features
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;