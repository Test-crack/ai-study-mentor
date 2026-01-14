
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/hooks/useAuth";
import LandingPage from "@/features/home/components/LandingPage";
import DashboardPage from "@/features/home/components/DashboardPage";
import AuthPage from "@/features/auth/components/AuthPage";
import ResetPasswordPage from "@/features/auth/components/ResetPasswordPage";
import NotFoundPage from "@/shared/components/layout/NotFoundPage";
import SpeedAssessmentPage from "@/features/speed-assessment/components/SpeedAssessmentPage";
import ReadingAssessmentPage from "@/features/reading-assessment/components/ReadingAssessmentPage";
import NotesPage from "@/features/notes/components/NotesPage";
import ProfilePage from "@/features/profile/components/ProfilePage";
import PricingPage from "@/features/payment/components/PricingPage";
import PaymentSuccess from "@/features/payment/components/PaymentSuccess";
import CoursesPage from "@/features/courses/components/CoursesPage";
import CourseDetailPage from "@/features/courses/components/CourseDetailPage";
import LearningPage from "@/features/courses/components/learning/LearningPage";
import AdminDashboardPage from "@/features/courses/components/admin/AdminDashboardPage";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-muted-foreground">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes - accessible to everyone */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      
      {/* Protected routes - require authentication */}
      {user ? (
        <>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/learn/:slug" element={<LearningPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/assessment" element={<ReadingAssessmentPage />} />
          <Route path="/assessment/legacy" element={<SpeedAssessmentPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/courses/admin/dashboard" element={<AdminDashboardPage />} />
        </>
      ) : (
        <>
          {/* Redirect unauthenticated users to auth page for protected routes */}
          <Route path="/dashboard" element={<Navigate to="/auth" replace />} />
          <Route path="/learn/:slug" element={<Navigate to="/auth" replace />} />
          <Route path="/notes" element={<Navigate to="/auth" replace />} />
          <Route path="/profile" element={<Navigate to="/auth" replace />} />
          <Route path="/assessment" element={<Navigate to="/auth" replace />} />
          <Route path="/courses/admin/dashboard" element={<Navigate to="/auth" replace />} />
        </>
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
