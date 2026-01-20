import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("STUDENT" | "INSTRUCTOR" | "ADMIN")[];
}

export const RoleProtectedRoute = ({ 
  children, 
  allowedRoles 
}: RoleProtectedRouteProps) => {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  // Always wait for basic auth state. 
  // Only wait for profile if specific roles are required for this route.
  if (loading || (allowedRoles && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-purple-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-purple-100 animate-pulse"></div>
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-500 tracking-wide uppercase">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Senior Logic: Redirect to profile page for unauthorized access as requested
    return <Navigate to="/profile" replace />;
  }

  // If we have a user but no profile could be loaded (even after loading finished), 
  // or if we're indefinitely waiting, redirect to profile to re-verify or complete setup.
  if (allowedRoles && !profile && !profileLoading) {
      return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};
