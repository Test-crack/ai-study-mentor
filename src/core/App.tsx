import { Toaster } from "@/shared/components/ui/toaster";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/hooks/useAuth";
import LandingPage from "@/features/home/components/LandingPage";
import DashboardPage from "@/features/home/components/DashboardPage";
import LoginPage from "@/features/auth/components/LoginPage";
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
import StudentSpeakingHistoryPage from "@/features/student/components/StudentSpeakingHistoryPage";
import ReadingHistoryPage from "@/features/student/components/ReadingHistoryPage";
import StudentBatchView from "@/features/student/components/StudentBatchView";
import InstructorDashboardPage from "@/features/instructor/components/InstructorDashboardPage";
import InstructorAssessmentPage from "@/features/instructor/components/assessments/InstructorAssessmentPage";
import InstructorBatchView from "@/features/instructor/components/InstructorBatchView";
import InstructorStudentProgressPage from "@/features/instructor/components/InstructorStudentProgressPage";
import { RoleProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import SpeakingPractice from "@/features/student/components/SpeakingPractice";
import MyCurriculum from "@/features/student/components/MyCurriculum";
import InstructorCourseManagementPage from "@/features/instructor/components/InstructorCourseManagementPage";
import TechPrepPage from "@/features/instructor/components/TechPrepPage";
import AlignmentPage from "@/features/instructor/components/Alignment";
import MicTest from "@/features/student/components/MicTest";
import { WebSocketProvider } from "@/shared/context/WebSocketContext";
import { RequireActiveInstitute } from "@/features/auth/components/RequireActiveInstitute";

import InstituteDashboard from "@/features/Institute/dashboard/InstituteDashboard";
import InstituteBatches from "@/features/Institute/dashboard/BatchAllocation";
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
import InstituteAdmins from "@/features/InstituteOwner/dashboard/InstituteAdmins";
import BatchAnalyticsView from "@/features/InstituteOwner/dashboard/BatchAnalyticsView";
import VoiceLab from "@/features/student/components/VoiceLab";
import SpeedReading from "@/features/student/components/SpeedReading";
import InstructorReport from "@/features/instructor/components/InstructorReport";
import Workflow from "@/features/instructor/components/Workflow";
import IeltsWriting from "@/features/student/components/IeltsWriting";
import ListeningPractice from "@/features/student/components/ListeningPractice";
import ReadingPractice from "@/features/student/components/ReadingPractice";
import Dashdemo from "@/features/home/components/Dashdemo";
import Contactpage from "@/features/home/components/ContactPage";
import CourseSection from "@/features/student/components/CourseSection";
import InstituteOwnerStudentProgressPage from "@/features/InstituteOwner/dashboard/InstituteOwnerStudentProgressPage";
import Suggestion from "@/features/student/components/Suggestions";
import SpeakingAssessment from "@/features/student/components/SpeakingAssessment";
import Diagnosis from "@/features/student/components/Diagnosis/Diagnosis";
import AssessmentHistoryPage from "@/features/student/components/AssessmentHistoryPage";
import SuggestionsPage from "@/features/student/components/SuggestionsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent aggressive re-fetches on tab switches
    },
  },
});

/**
 * 1. Initial Login Redirector
 * Triggered when a user lands on /auth while already logged in.
 * Sends users to their specific homes.
 */
const LoginRedirect = () => {
  const { profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;

  if (profile?.role === 'SUPERADMIN') return <Navigate to="/superadmin/dashboard" replace />;
  if (profile?.role === 'INSTITUTE_OWNER') return <Navigate to="/institute-owner/dashboard" replace />;
  if (profile?.role === 'INSTITUTE_ADMIN') return <Navigate to="/institute-admin/dashboard" replace />;
  if (profile?.role === 'INSTRUCTOR') return <Navigate to="/instructor/dashboard" replace />;
  // Default: STUDENT
  return <Navigate to="/student/dashboard" replace />;
};

/**
 * 2. Manual URL Entry Redirector
 * Triggered when someone types /dashboard manually in the URL bar.
 */
const ManualDashboardAccess = () => {
  const { profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;
  if (!profile) return <Navigate to="/login" replace />;

  // Instructors: Show DashboardPage on /dashboard
  if (profile.role === 'SUPERADMIN') {
    return <DashboardPage />;
  }

  // All others: Redirect to their specific home
  if (profile.role === 'INSTRUCTOR') return <Navigate to="/instructor/dashboard" replace />;
  if (profile.role === 'INSTITUTE_OWNER') return <Navigate to="/institute-owner/dashboard" replace />;
  if (profile.role === 'INSTITUTE_ADMIN') return <Navigate to="/institute-admin/dashboard" replace />;

  // Students
  return <Navigate to="/student/dashboard" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/daignosis" element={<Diagnosis/>} />
      <Route path="/dashdemo" element={<Dashdemo/>} />
      <Route path="/Contact" element={<Contactpage/>} />

      {/* Routes that require the institute to be active (Owners & Admins) */}
      <Route element={<RequireActiveInstitute />}>
        {/* Institute Owner Routes — RBAC: INSTITUTE_OWNER only */}
        <Route path="/institute-owner/dashboard" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><InstituteOwnerDashboard/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/performance" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><Performance/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/roi" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><RoiAnalytics/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/insight" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><BatchInsight/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/tuteffect" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><TutorEffective/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/strategic" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><StrategicReport/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/calibration" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><AiCalibration/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/admins" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><InstituteAdmins/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/batches/:batchSlug/analytics" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER', 'INSTRUCTOR']}><BatchAnalyticsView/></RoleProtectedRoute>}/>
        <Route path="/institute-owner/students/:studentId/progress" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER', 'INSTRUCTOR']}><InstituteOwnerStudentProgressPage/></RoleProtectedRoute>}/>

        {/* Institute Admin routes — RBAC: INSTITUTE_ADMIN + INSTITUTE_OWNER */}
        <Route path="/institute-admin/dashboard" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteDashboard/></RoleProtectedRoute>} />
        <Route path="/institute-admin/batches" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteBatches/></RoleProtectedRoute>} />
        <Route path="/institute-admin/tutor" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteTutor/></RoleProtectedRoute>} />
        <Route path="/institute-admin/students" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteStudents/></RoleProtectedRoute>} />
        <Route path="/institute-admin/billings" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteBillings/></RoleProtectedRoute>} />
        <Route path="/institute-admin/reports" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteReports/></RoleProtectedRoute>} />
        <Route path="/institute-admin/studentOnboarding" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><StudentOnboarding/></RoleProtectedRoute>} />
        <Route path="/institute-admin/tutorOnboarding" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><TutorOnboarding/></RoleProtectedRoute>}/>
        <Route path="/institute-admin/Setting" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteSettings/></RoleProtectedRoute>}/>
      </Route>

      {/* Testcrack SuperAdmin — RBAC: SUPERADMIN only */}
      <Route path="/superadmin/dashboard" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminDashboard/></RoleProtectedRoute>} />
      <Route path="/superadmin/institutes" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminInstitutes/></RoleProtectedRoute>} />
      <Route path="/superadmin/subscription" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><Subscription/></RoleProtectedRoute>} />
      <Route path="/superadmin/priceconfig" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><PricingConfig/></RoleProtectedRoute>} />
      <Route path="/superadmin/supportickets" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SupportTicket/></RoleProtectedRoute>} />
      <Route path="/superadmin/platform" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><PlatformAnalytics/></RoleProtectedRoute>} />
      <Route path="/superadmin/allusers" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><AllUsers/></RoleProtectedRoute>} />

      {/* Login Route: On login, LoginRedirect forces role-based dashboards */}
      <Route path="/login" element={user ? <LoginRedirect /> : <LoginPage />} />
      {/* Legacy redirect – keeps old /auth links working */}
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      
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
      <Route path="/student/voice" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><VoiceLab/></RoleProtectedRoute>} />
      <Route path="/student/speed" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SpeedReading/></RoleProtectedRoute>} />
      <Route path="/student/speaking-assessment" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentReadingAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/student/writing" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><IeltsWriting/></RoleProtectedRoute>} />
      <Route path="/student/listening" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><ListeningPractice/></RoleProtectedRoute>} />
      <Route path="/student/asess" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SpeakingAssessment/></RoleProtectedRoute>} />
      <Route path="/student/reading" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><ReadingPractice/></RoleProtectedRoute>} />
      <Route path="/student/courses-section" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><CourseSection/></RoleProtectedRoute>} />
      <Route path="/student/reading-assessment/history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentAssessmentHistoryPage /></RoleProtectedRoute>} />
      <Route path="/student/speaking-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentSpeakingHistoryPage /></RoleProtectedRoute>} />
      <Route path="/student/reading-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><ReadingHistoryPage /></RoleProtectedRoute>} />
      <Route path="/student/my-curriculum" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><MyCurriculum/></RoleProtectedRoute>} />
      <Route path="/student/batches" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentBatchView/></RoleProtectedRoute>} />
      <Route path="/student/assessment-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><AssessmentHistoryPage/></RoleProtectedRoute>} />
      <Route path="/student/suggestion-page" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SuggestionsPage/></RoleProtectedRoute>} />
      <Route path="/student/suggestion" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><Suggestion/></RoleProtectedRoute>} />
      <Route path="/student/speaking-practice" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SpeakingPractice/></RoleProtectedRoute>} />

      {/* Instructor Dashboard & Routes */}
      <Route 
        path="/instructor/dashboard" 
        element={
          <RoleProtectedRoute allowedRoles={['INSTRUCTOR']}>
            <InstructorDashboardPage />
          </RoleProtectedRoute>
        } 
      />

      <Route 
        path="/instructor/student/:studentSlug/progress" 
        element={
          <RoleProtectedRoute allowedRoles={['INSTRUCTOR']}>
            <InstructorStudentProgressPage />
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/instructor/assessments" 
        element={
          <RoleProtectedRoute allowedRoles={['INSTRUCTOR']}>
            <InstructorAssessmentPage />
          </RoleProtectedRoute>
        } 
      />
      <Route path="/instructor/coursemanagement" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseManagementPage/></RoleProtectedRoute>} />
      <Route path="/instructor/batches" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorBatchView/></RoleProtectedRoute>} />
      <Route path="/instructor/tech-pep" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><TechPrepPage/></RoleProtectedRoute>} />
      <Route path="/instructor/alignment" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><AlignmentPage/></RoleProtectedRoute>} />
      <Route path="/instructor/reports" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorReport/></RoleProtectedRoute>} />
      <Route path="/instructor/workflow" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><Workflow/></RoleProtectedRoute>} />

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
          <RoleProtectedRoute allowedRoles={["INSTRUCTOR"]}>
            <AdminDashboardPage />
          </RoleProtectedRoute>
        } 
      />
      <Route 
        path="/courses/admin/manage/:id" 
        element={
          <RoleProtectedRoute allowedRoles={["INSTRUCTOR"]}>
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