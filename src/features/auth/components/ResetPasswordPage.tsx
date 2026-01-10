import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle } from "lucide-react";

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
    // Check if we have a valid recovery session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setValidSession(false);
          return;
        }

        // Check if this is a recovery session (user clicked reset link)
        // The URL will contain type=recovery in the hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get("type");
        
        if (session && type === "recovery") {
          setValidSession(true);
        } else if (session) {
          // User has a session but not from recovery link
          // This could happen if they're already logged in
          setValidSession(true);
        } else {
          setValidSession(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setValidSession(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: "Invalid Password",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated!",
        description: "Your password has been successfully changed. Please sign in with your new password.",
      });

      // Sign out to force re-authentication (security best practice)
      await supabase.auth.signOut();

      // Redirect to login with success message
      navigate("/auth?reset=success");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-muted-foreground">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired link
  if (!validSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid or Expired Link</h1>
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <Button
                onClick={() => navigate("/auth")}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Create a new password for your account
          </p>
        </div>

        {/* Reset Password Form */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it's at least 6 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Password match indicator */}
              {confirmPassword && (
                <div className="flex items-center gap-2 text-sm">
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Passwords don't match</span>
                    </>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                disabled={loading || newPassword !== confirmPassword}
              >
                {loading ? "Updating Password..." : "Update Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => navigate("/auth")}
                className="text-purple-600 hover:text-purple-700"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
