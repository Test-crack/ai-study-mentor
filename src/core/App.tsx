
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
import CourseManagementPage from "@/features/courses/components/admin/CourseManagementPage";
const queryClient = new QueryClient();

import { RoleProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { StudyGuides, YouTubeAnalyzer } from "@/features/notes";
import { ProgressDashboard } from "@/features/profile";
import {PremiumModal}  from "@/features/payment/components";

const AppRoutes = () => {
  const { user } = useAuth();

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
      <Route path="/dashboard" element={<RoleProtectedRoute><DashboardPage /></RoleProtectedRoute>} />
      <Route path="/youtube-ana" element={<RoleProtectedRoute><YouTubeAnalyzer/></RoleProtectedRoute>}/>
      <Route path="/notes" element={<RoleProtectedRoute><NotesPage/></RoleProtectedRoute>}/>
      <Route path="/study" element={<RoleProtectedRoute><StudyGuides/></RoleProtectedRoute>}/>
      <Route path="/progress" element={<RoleProtectedRoute><ProgressDashboard/></RoleProtectedRoute>}/>
      <Route path="/learn/:slug" element={<RoleProtectedRoute><LearningPage /></RoleProtectedRoute>} />
      <Route path="/notes" element={<RoleProtectedRoute><NotesPage /></RoleProtectedRoute>} />
      <Route path="/profile" element={<RoleProtectedRoute><ProfilePage /></RoleProtectedRoute>} />
      <Route path="/assessment" element={<RoleProtectedRoute><ReadingAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/assessment/legacy" element={<RoleProtectedRoute><SpeedAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/payment/success" element={<RoleProtectedRoute><PaymentSuccess /></RoleProtectedRoute>} />
      
      {/* Instructor/Admin only routes */}
      <Route 
        path="/courses/admin/dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={["INSTRUCTOR", "ADMIN"]}>
            <AdminDashboardPage />
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/courses/admin/manage/:id" 
        element={
          <RoleProtectedRoute allowedRoles={["INSTRUCTOR", "ADMIN"]}>
            <CourseManagementPage />
          </RoleProtectedRoute>
        } 
      />

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
