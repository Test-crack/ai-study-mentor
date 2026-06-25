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
import BatchInsight from "@/features/InstituteOwner/dashboard/BatchInsight";
import InstituteAdmins from "@/features/InstituteOwner/dashboard/InstituteAdmins";
import BatchAnalyticsView from "@/features/InstituteOwner/dashboard/BatchAnalyticsView";
import InstituteStudentsPage from "@/features/InstituteOwner/dashboard/InstituteStudentsPage";
import InstituteInstructorsPage from "@/features/InstituteOwner/dashboard/InstituteInstructorsPage";
import InstituteBatchDetailPage from "@/features/InstituteOwner/dashboard/InstituteBatchDetailPage";
import { RoiAnalyticsPage, StrategicReportPage, AiCalibrationPage } from "@/features/InstituteOwner/dashboard/ComingSoonPages";
import VoiceLab from "@/features/student/components/VoiceLab";
import SpeedReading from "@/features/student/components/SpeedReading";
import { InstructorReportPage } from "@/features/instructor/components/InstructorReportPage";
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
import OnboardingWalkthrough from "@/features/student/components/Onboarding/OnboardingWalkthrough";
import HowItWorks from "@/features/student/components/HowItWorks";
import AssessmentHistoryPage from "@/features/student/components/AssessmentHistoryPage";
import SuggestionsPage from "@/features/student/components/SuggestionsPage";
import Report from "@/features/student/components/Report";
import DrillScreen from "@/features/student/components/Drills/DrillScreen";
import { MomentumProvider } from "@/features/student/Context/MomentumContext";
import LexiGrid from "@/features/student/components/LexiGrid";
import InternalAssessmentPage from "@/features/student/components/Assessment";
import FullMockAssessment from "@/features/student/components/FullMockAssessment";
import StudentNotEnrolledPage from "@/features/student/components/StudentNotEnrolledPage";
import B2CLoginPage from "@/features/B-C/pages/B2cloginpage";
import B2CStudentDashboard from "@/features/B-C/pages/B2cstudentdashboard";
import BandLadderGame from "@/features/B-C/games/Bandladdergame";
import ConnectorChainGame from "@/features/B-C/games/Connectorchaingame";
import InferenceSprintGame from "@/features/B-C/games/Inferencesprintgame";
import LexiGridGame from "@/features/B-C/games/Lexigridgame";
import SentenceSurgeryGame from "@/features/B-C/games/Sentencesurgerygame";
import TrapSpotterGame from "@/features/B-C/games/Trapspottergame";
// import QuestionBankManager from "@/features/TestCrackSuperAdmin/dashboard/Questionbankmanager";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// ─── B2C auth guard ───────────────────────────────────────────────────────────
// Checks sessionStorage for b2c_email.
// Replace with real B2C auth check once backend is wired.
const B2CProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const email = sessionStorage.getItem('b2c_email');
  return email ? <>{children}</> : <Navigate to="/b2c/login" replace />;
};

/**
 * 1. Initial Login Redirector
 */
const LoginRedirect = () => {
  const { profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;

  if (profile?.role === 'SUPERADMIN') return <Navigate to="/superadmin/dashboard" replace />;
  if (profile?.role === 'INSTITUTE_OWNER') return <Navigate to="/institute-owner/dashboard" replace />;
  if (profile?.role === 'INSTITUTE_ADMIN') return <Navigate to="/institute-admin/dashboard" replace />;
  if (profile?.role === 'INSTRUCTOR') return <Navigate to="/instructor/dashboard" replace />;

  // Default: STUDENT
  if (profile?.role === 'STUDENT') {
    if (profile.isEnrolled === false) {
      return <Navigate to="/student/not-enrolled" replace />;
    }
    if (!profile.isDiagnosed) {
      return <Navigate to="/student/onboarding" replace />;
    }
  }
  return <Navigate to="/student/dashboard" replace />;
};

/**
 * 2. Manual URL Entry Redirector
 */
const ManualDashboardAccess = () => {
  const { profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;
  if (!profile) return <Navigate to="/login" replace />;

  if (profile.role === 'SUPERADMIN') {
    return <DashboardPage />;
  }

  if (profile.role === 'INSTRUCTOR') return <Navigate to="/instructor/dashboard" replace />;
  if (profile.role === 'INSTITUTE_OWNER') return <Navigate to="/institute-owner/dashboard" replace />;
  if (profile.role === 'INSTITUTE_ADMIN') return <Navigate to="/institute-admin/dashboard" replace />;

  // Students
  if (profile.role === 'STUDENT') {
    if (profile.isEnrolled === false) return <Navigate to="/student/not-enrolled" replace />;
    if (!profile.isDiagnosed)        return <Navigate to="/student/onboarding" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

/**
 * 3. Student Diagnosis Guard
 */
const StudentDiagnosisGuard = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading, profileLoading } = useAuth();

  if ((loading || profileLoading) && !profile) {
    return null;
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (profile.role === 'STUDENT') {
    if (profile.isEnrolled === false) return <Navigate to="/student/not-enrolled" replace />;
    if (!profile.isDiagnosed)        return <Navigate to="/student/onboarding" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* ── Public routes ────────────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/student/onboarding" element={<OnboardingWalkthrough />} />
      <Route path="/student/diagnosis" element={<Diagnosis />} />
      <Route path="/dashdemo" element={<Dashdemo />} />
      <Route path="/Contact" element={<Contactpage />} />

      {/* ── B2C routes (no B2B auth required) ────────────────────────────── */}
      <Route path="/b2c/login" element={<B2CLoginPage />} />
      <Route
        path="/b2c/dashboard"
        element={
          <B2CProtectedRoute>
            <B2CStudentDashboard />
          </B2CProtectedRoute>
        }
      />
      <Route path="/b2c/leaderboard" element={<B2CProtectedRoute><B2CStudentDashboard /></B2CProtectedRoute>} />

      {/* ── B2C game routes — all fully functional ───────────────────────── */}
      <Route path="/b2c/game/lexigrid"         element={<B2CProtectedRoute><LexiGridGame        /></B2CProtectedRoute>} />
      <Route path="/b2c/game/trap-spotter"     element={<B2CProtectedRoute><TrapSpotterGame     /></B2CProtectedRoute>} />
      <Route path="/b2c/game/band-ladder"      element={<B2CProtectedRoute><BandLadderGame      /></B2CProtectedRoute>} />
      <Route path="/b2c/game/sentence-surgery" element={<B2CProtectedRoute><SentenceSurgeryGame /></B2CProtectedRoute>} />
      <Route path="/b2c/game/inference-sprint" element={<B2CProtectedRoute><InferenceSprintGame /></B2CProtectedRoute>} />
      <Route path="/b2c/game/connector-chain"  element={<B2CProtectedRoute><ConnectorChainGame  /></B2CProtectedRoute>} />

      {/* ── Routes that require the institute to be active ─────────────── */}
      <Route element={<RequireActiveInstitute />}>
        {/* Institute Owner Routes */}
        <Route path="/institute-owner/dashboard"    element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><InstituteOwnerDashboard /></RoleProtectedRoute>} />
        <Route path="/institute-owner/insight"      element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><BatchInsight /></RoleProtectedRoute>} />
        <Route path="/institute-owner/students"     element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><InstituteStudentsPage /></RoleProtectedRoute>} />
        <Route path="/institute-owner/instructors"  element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><InstituteInstructorsPage /></RoleProtectedRoute>} />
        <Route path="/institute-owner/performance"  element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><Performance /></RoleProtectedRoute>} />
        <Route path="/institute-owner/admins"       element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><InstituteAdmins /></RoleProtectedRoute>} />
        <Route path="/institute-owner/roi"          element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><RoiAnalyticsPage /></RoleProtectedRoute>} />
        <Route path="/institute-owner/strategic"    element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><StrategicReportPage /></RoleProtectedRoute>} />
        <Route path="/institute-owner/calibration"  element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER']}><AiCalibrationPage /></RoleProtectedRoute>} />
        <Route path="/institute-owner/batches/:batchSlug/analytics" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER', 'INSTRUCTOR']}><InstituteBatchDetailPage /></RoleProtectedRoute>} />
        <Route path="/institute-owner/students/:studentSlug/progress" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_OWNER', 'INSTRUCTOR']}><InstituteOwnerStudentProgressPage /></RoleProtectedRoute>} />

        {/* Institute Admin routes */}
        <Route path="/institute-admin/dashboard" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteDashboard /></RoleProtectedRoute>} />
        <Route path="/institute-admin/batches" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteBatches /></RoleProtectedRoute>} />
        <Route path="/institute-admin/tutor" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteTutor /></RoleProtectedRoute>} />
        <Route path="/institute-admin/students" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteStudents /></RoleProtectedRoute>} />
        <Route path="/institute-admin/billings" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteBillings /></RoleProtectedRoute>} />
        <Route path="/institute-admin/reports" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteReports /></RoleProtectedRoute>} />
        <Route path="/institute-admin/studentOnboarding" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><StudentOnboarding /></RoleProtectedRoute>} />
        <Route path="/institute-admin/tutorOnboarding" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><TutorOnboarding /></RoleProtectedRoute>} />
        <Route path="/institute-admin/Setting" element={<RoleProtectedRoute allowedRoles={['INSTITUTE_ADMIN', 'INSTITUTE_OWNER']}><InstituteSettings /></RoleProtectedRoute>} />
      </Route>

      {/* ── TestCrack SuperAdmin ──────────────────────────────────────────── */}
      <Route path="/superadmin/dashboard" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminDashboard /></RoleProtectedRoute>} />
      <Route path="/superadmin/institutes" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminInstitutes /></RoleProtectedRoute>} />
      <Route path="/superadmin/subscription" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><Subscription /></RoleProtectedRoute>} />
      <Route path="/superadmin/priceconfig" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><PricingConfig /></RoleProtectedRoute>} />
      <Route path="/superadmin/supportickets" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SupportTicket /></RoleProtectedRoute>} />
      <Route path="/superadmin/platform" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><PlatformAnalytics /></RoleProtectedRoute>} />
      {/* <Route path="/superadmin/question" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><QuestionBankManager /></RoleProtectedRoute>} /> */}
      <Route path="/superadmin/allusers" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><AllUsers /></RoleProtectedRoute>} />

      {/* ── Auth & misc ───────────────────────────────────────────────────── */}
      <Route path="/login" element={user ? <LoginRedirect /> : <LoginPage />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      <Route path="/dashboard" element={<ManualDashboardAccess />} />
      <Route path="/dashboard/:tab" element={<ManualDashboardAccess />} />

      {/* Not-enrolled screen — role-protected but no enrollment guard (would loop) */}
      <Route path="/student/not-enrolled" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentNotEnrolledPage /></RoleProtectedRoute>} />

      {/* Student Dashboard & Routes */}
      <Route
        path="/student/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDiagnosisGuard>
              <StudentDashboardPage />
            </StudentDiagnosisGuard>
          </RoleProtectedRoute>
        }
      />
      <Route path="/student/settings" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentProfilePage /></RoleProtectedRoute>} />
      <Route path="/student/courses" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentCoursesPage /></RoleProtectedRoute>} />
      <Route path="/student/schedule" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentSchedulePage /></RoleProtectedRoute>} />
      <Route path="/student/voice" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><VoiceLab /></RoleProtectedRoute>} />
      <Route path="/student/speed" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SpeedReading /></RoleProtectedRoute>} />
      <Route path="/student/speaking-assessment" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentReadingAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/student/writing" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><IeltsWriting /></RoleProtectedRoute>} />
      <Route path="/student/listening" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><ListeningPractice /></RoleProtectedRoute>} />
      <Route path="/student/asess" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SpeakingAssessment /></RoleProtectedRoute>} />
      <Route path="/student/reading" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><ReadingPractice /></RoleProtectedRoute>} />
      <Route path="/student/courses-section" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><CourseSection /></RoleProtectedRoute>} />
      <Route path="/student/reading-assessment/history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentAssessmentHistoryPage /></RoleProtectedRoute>} />
      <Route path="/student/speaking-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentSpeakingHistoryPage /></RoleProtectedRoute>} />
      <Route path="/student/reading-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><ReadingHistoryPage /></RoleProtectedRoute>} />
      <Route path="/student/my-curriculum" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><MyCurriculum /></RoleProtectedRoute>} />
      <Route path="/student/batches" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentBatchView /></RoleProtectedRoute>} />
      <Route path="/student/assessment-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><AssessmentHistoryPage /></RoleProtectedRoute>} />
      <Route path="/student/suggestion-page" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SuggestionsPage /></RoleProtectedRoute>} />
      <Route path="/student/report" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><Report /></RoleProtectedRoute>} />
      <Route path="/student/suggestion" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><Suggestion /></RoleProtectedRoute>} />
      <Route path="/student/speaking-practice" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><SpeakingPractice /></RoleProtectedRoute>} />
      <Route path="/student/drill" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><DrillScreen /></RoleProtectedRoute>} />
      <Route path="/student/lexigrid" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><LexiGrid /></RoleProtectedRoute>} />
      <Route path="/student/internal" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><InternalAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/student/assessment" element={<Navigate to="/student/internal" replace />} />
      <Route path="/student/mock" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><FullMockAssessment /></RoleProtectedRoute>} />
      <Route path="/student/how-it-works" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><HowItWorks /></RoleProtectedRoute>} />

      {/* ── Instructor Dashboard & Routes ─────────────────────────────────── */}
      <Route
        path="/instructor/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={['INSTRUCTOR']}>
            <InstructorDashboardPage />
          </RoleProtectedRoute>
        }
      />
      <Route path="/instructor/student/:studentSlug/progress" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorStudentProgressPage /></RoleProtectedRoute>} />
      <Route path="/instructor/students/:studentSlug/progress" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorStudentProgressPage /></RoleProtectedRoute>} />
      <Route path="/instructor/batches/:batchId/students/:studentId/progress" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorStudentProgressPage /></RoleProtectedRoute>} />
      <Route path="/instructor/assessments" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/instructor/coursemanagement" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseManagementPage /></RoleProtectedRoute>} />
      <Route path="/instructor/batches" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorBatchView /></RoleProtectedRoute>} />
      <Route path="/instructor/tech-pep" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><TechPrepPage /></RoleProtectedRoute>} />
      <Route path="/instructor/alignment" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><AlignmentPage /></RoleProtectedRoute>} />
      <Route path="/instructor/reports" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorReportPage /></RoleProtectedRoute>} />
      <Route path="/instructor/workflow" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><Workflow /></RoleProtectedRoute>} />

      {/* ── Shared protected routes ───────────────────────────────────────── */}
      <Route path="/learn/:slug" element={<RoleProtectedRoute><LearningPage /></RoleProtectedRoute>} />
      <Route path="/notes" element={<RoleProtectedRoute><NotesPage /></RoleProtectedRoute>} />
      <Route path="/profile" element={<RoleProtectedRoute><ProfilePage /></RoleProtectedRoute>} />
      <Route path="/assessment" element={<RoleProtectedRoute><ReadingAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/assessment/legacy" element={<RoleProtectedRoute><SpeedAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/payment/success" element={<RoleProtectedRoute><PaymentSuccess /></RoleProtectedRoute>} />
      <Route path="/courses/admin/dashboard" element={<RoleProtectedRoute allowedRoles={["INSTRUCTOR"]}><AdminDashboardPage /></RoleProtectedRoute>} />
      <Route path="/courses/admin/manage/:id" element={<RoleProtectedRoute allowedRoles={["INSTRUCTOR"]}><CourseManagementPage /></RoleProtectedRoute>} />

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
            <MomentumProvider>
              <WebSocketProvider>
                <AppRoutes />
              </WebSocketProvider>
            </MomentumProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;