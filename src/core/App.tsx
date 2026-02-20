import { Toaster } from "@/shared/components/ui/toaster";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
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
import StudentDashboardPage from "@/features/student/components/StudentDashboardPage";
import StudentProfilePage from "@/features/student/components/StudentProfilePage";
import StudentCoursesPage from "@/features/student/components/StudentCoursesPage";
import StudentSchedulePage from "@/features/student/components/StudentSchedulePage";
import StudentReadingAssessmentPage from "@/features/student/components/StudentReadingAssessmentPage";
import StudentAssessmentHistoryPage from "@/features/student/components/StudentAssessmentHistoryPage";
import InstructorDashboardPage from "@/features/instructor/components/InstructorDashboardPage";
import InstructorAssessmentPage from "@/features/instructor/components/assessments/InstructorAssessmentPage";
import { RoleProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import SpeakingPractice from "@/features/student/components/SpeakingPractice";
import MyCurriculum from "@/features/student/components/MyCurriculum";
const queryClient = new QueryClient();

/**
 * 1. Initial Login Redirector
 * Triggered when a user lands on /auth while already logged in.
 * Sends users to their specific homes.
 */
const LoginRedirect = () => {
  const { profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;

  if (profile?.role === 'INSTRUCTOR' || profile?.role === 'ADMIN') {
    return <Navigate to="/instructor/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

/**
 * 2. Manual URL Entry Redirector
 * Triggered when someone types /dashboard manually in the URL bar.
 */
const ManualDashboardAccess = () => {
  const { profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;
  if (!profile) return <Navigate to="/auth" replace />;

  // Instructors/Admins: Stay on /dashboard and show the DashboardPage
  if (profile.role === 'INSTRUCTOR' || profile.role === 'ADMIN') {
    return <DashboardPage />;
  }

  // Students: Always kick them back to their specific dashboard
  return <Navigate to="/student/dashboard" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth Route: On login, LoginRedirect forces role-based dashboards */}
      <Route path="/auth" element={user ? <LoginRedirect /> : <AuthPage />} />
      
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      
      {/* Manual Dashboard Access: Handled by ManualDashboardAccess logic */}
      <Route path="/dashboard" element={<ManualDashboardAccess />} />
      <Route path="/dashboard/:tab" element={<ManualDashboardAccess />} />

      {/* Student Dashboard & Routes */}
      <Route 
        path="/student/dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboardPage />
          </RoleProtectedRoute>
        } 
      />
      <Route path="/student/settings" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentProfilePage /></RoleProtectedRoute>} />
      <Route path="/student/courses" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentCoursesPage /></RoleProtectedRoute>} />
      <Route path="/student/schedule" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentSchedulePage /></RoleProtectedRoute>} />
      <Route path="/student/reading-assessment" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentReadingAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/student/reading-assessment/history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentAssessmentHistoryPage /></RoleProtectedRoute>} />
      <Route path="/student/my-curriculum" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><MyCurriculum/></RoleProtectedRoute>} />
      <Route path="/student/speaking-practice" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SpeakingPractice/></RoleProtectedRoute>} />

      {/* Instructor Dashboard & Routes */}
      <Route 
        path="/instructor/dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <InstructorDashboardPage />
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/instructor/assessments" 
        element={
          <RoleProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
            <InstructorAssessmentPage />
          </RoleProtectedRoute>
        } 
      />

      {/* Protected routes */}
      <Route path="/learn/:slug" element={<RoleProtectedRoute><LearningPage /></RoleProtectedRoute>} />
      <Route path="/notes" element={<RoleProtectedRoute><NotesPage /></RoleProtectedRoute>} />
      <Route path="/profile" element={<RoleProtectedRoute><ProfilePage /></RoleProtectedRoute>} />
      <Route path="/assessment" element={<RoleProtectedRoute><ReadingAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/assessment/legacy" element={<RoleProtectedRoute><SpeedAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/payment/success" element={<RoleProtectedRoute><PaymentSuccess /></RoleProtectedRoute>} />
      
      {/* Admin specific */}
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
  <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;