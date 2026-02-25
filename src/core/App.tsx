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
import InstructorCourseManagementPage from "@/features/instructor/components/InstructorCourseManagementPage";
import TechPrepPage from "@/features/instructor/components/TechPrepPage";
import AlignmentPage from "@/features/instructor/components/Alignment";
import MicTest from "@/features/student/components/MicTest";
import { WebSocketProvider } from "@/shared/context/WebSocketContext";

import InstituteDashboard from "@/features/Institute/dashboard/InstituteDashboard";
import InstituteBatches from "@/features/Institute/dashboard/InstituteBatches";
import InstituteTutor from "@/features/Institute/dashboard/InstituteTutor";
import InstituteStudents from "@/features/Institute/dashboard/InstituteStudents";
import InstituteBillings from "@/features/Institute/dashboard/InstituteBillings";
import InstituteReports from "@/features/Institute/dashboard/InstituteReports";
import StudentOnboarding from "@/features/Institute/dashboard/StudentOnboarding";
import TutorOnboarding from "@/features/Institute/dashboard/TutorOnboarding";
import InstituteSettings from "@/features/Institute/dashboard/InstituteSetting";
import SuperAdminDashboard from "@/features/TestCrackSuperAdmin/dashboard/SuperAdminDashboard";
import SuperAdminInstitutes from "@/features/TestCrackSuperAdmin/dashboard/SuperAdminInstitutes";
import Subscription from "@/features/TestCrackSuperAdmin/dashboard/Subscription";
import PricingConfig from "@/features/TestCrackSuperAdmin/dashboard/PricingConfig";
import SupportTicket from "@/features/TestCrackSuperAdmin/dashboard/SupportTicket";
import PlatformAnalytics from "@/features/TestCrackSuperAdmin/dashboard/PlatformAnalytics";
import AllUsers from "@/features/TestCrackSuperAdmin/dashboard/AllUsers";
import InstituteOwnerDashboard from "@/features/InstituteOwner/dashboard/InstituteOwnerDashboard";
import Performance from "@/features/InstituteOwner/dashboard/Performance";
import RoiAnalytics from "@/features/InstituteOwner/dashboard/RoiAnalytics";
import BatchInsight from "@/features/InstituteOwner/dashboard/BatchInsight";
import TutorEffective from "@/features/InstituteOwner/dashboard/TutorEffective";
import StrategicReport from "@/features/InstituteOwner/dashboard/StrategicReport";
import AiCalibration from "@/features/InstituteOwner/dashboard/AiCalibration";
import VoiceLab from "@/features/student/components/VoiceLab";
import SpeedReading from "@/features/student/components/SpeedReading";
import InstructorReport from "@/features/instructor/components/InstructorReport";
import Workflow from "@/features/instructor/components/Workflow";
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
{/* Institute Owner Routes */}
<Route path="/owner-dashboard" element={<InstituteOwnerDashboard/>}/>
<Route path="/owner-performance" element={<Performance/>}/>
<Route path="/owner-roi" element={<RoiAnalytics/>}/>
<Route path="/owner-insight" element={<BatchInsight/>}/>
<Route path="/owner-tuteffect" element={<TutorEffective/>}/>
<Route path="/owner-strategic" element={<StrategicReport/>}/>
<Route path="/owner-calibration" element={<AiCalibration/>}/>
{/* Testcrack SuperAdmin */}
            <Route path="/superadmin-dashboard" element={<SuperAdminDashboard/>} />
            <Route path="/superadmin-institutes" element={<SuperAdminInstitutes/>} />
            <Route path="/superadmin-subscription" element={<Subscription/>} />
            <Route path="/superadmin-priceconfig" element={<PricingConfig/>} />
            <Route path="/superadmin-supportickets" element={<SupportTicket/>} />
            <Route path="/superadmin-platform" element={<PlatformAnalytics/>} />
            <Route path="/superadmin-allusers" element={<AllUsers/>} />


      {/*Institute routes  */}'/superadmin-allusers
            <Route path="/institute-dashboard" element={<InstituteDashboard/>} />
            <Route path="/institute-batches" element={<InstituteBatches/>} />
            <Route path="/institute-tutor" element={<InstituteTutor/>} />
            <Route path="/institute-students" element={<InstituteStudents/>} />
            <Route path="/institute-billings" element={<InstituteBillings/>} />
            <Route path="/institute-reports" element={<InstituteReports/>} />
            <Route path="/institute-studentonboarding" element={<StudentOnboarding/>} />
            <Route path="/institute-tutoronboarding" element={<TutorOnboarding/>}/>
            <Route path="/institute-Setting" element={<InstituteSettings/>}/>
      {/* Auth Route: On login, LoginRedirect forces role-based dashboards */}
      <Route path="/auth" element={user ? <LoginRedirect /> : <AuthPage />} />
      
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      
      {/* Manual Dashboard Access: Handled by ManualDashboardAccess logic */}/institute-studentOnboarding
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
      <Route path="/student/voice" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><VoiceLab/></RoleProtectedRoute>} />
      <Route path="/student/speed" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SpeedReading/></RoleProtectedRoute>} />
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
      <Route path="/instructor/coursemanagement" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseManagementPage/></RoleProtectedRoute>} />
      <Route path="/instructor/tech-pep" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><TechPrepPage/></RoleProtectedRoute>} />
      <Route path="/instructor/alignment" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><AlignmentPage/></RoleProtectedRoute>} />
      <Route path="/instructor/reports" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorReport/></RoleProtectedRoute>} />
      <Route path="/instructor/workflow" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><Workflow/></RoleProtectedRoute>} />

      {/* Protected routes */}/instructor/report
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
            <WebSocketProvider>
              <AppRoutes />
            </WebSocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;