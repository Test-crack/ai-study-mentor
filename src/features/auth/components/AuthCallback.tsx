import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * This component handles Supabase auth callbacks (email confirmation, password reset)
 * when they land on the root URL with hash tokens.
 * 
 * It detects the auth type from the URL hash and redirects to the appropriate page.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      
      if (!hash || !hash.includes("access_token")) {
        // No auth tokens in URL, not an auth callback
        setProcessing(false);
        return false;
      }

      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      console.log("Auth callback detected, type:", type);

      if (!accessToken) {
        setProcessing(false);
        return false;
      }

      try {
        // Set the session from URL tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (error) {
          console.error("Error setting session:", error);
          navigate("/auth?error=invalid_token");
          return true;
        }

        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);

        // Redirect based on auth type
        if (type === "recovery") {
          // Password reset flow
          navigate("/reset-password", { replace: true });
        } else if (type === "signup" || type === "magiclink") {
          // Email confirmation or magic link - go to profile for new users
          navigate("/profile?welcome=true", { replace: true });
        } else if (data.session) {
          // Generic sign in - go to dashboard
          navigate("/dashboard", { replace: true });
        }

        return true;
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/auth?error=callback_failed");
        return true;
      }
    };

    handleAuthCallback().then((handled) => {
      if (!handled) {
        setProcessing(false);
      }
    });
  }, [navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-blue-50 via-blue-50 to-brand-teal-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">Verifying your account...</p>
        </div>
      </div>
    );
  }

  // If not processing auth callback, return null (let parent render)
  return null;
};

export default AuthCallback;
