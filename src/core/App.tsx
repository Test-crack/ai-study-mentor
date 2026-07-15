// src/core/App.tsx
import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/shared/components/ui/toaster";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/hooks/useAuth";
import { callBackend } from "@/features/auth/services/authClient";
import { RoleProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import { RequireActiveInstitute } from "@/features/auth/components/RequireActiveInstitute";
import { WebSocketProvider } from "@/shared/context/WebSocketContext";
import { MomentumProvider } from "@/features/student/Context/MomentumContext";

// Landing page stays EAGER — this is the route we're optimizing.
import LandingPage from "@/features/home/components/LandingPage";
import AuthCallbackPage from "@/features/auth/components/AuthCallbackPage";

// Everything else becomes its own chunk, downloaded only when its route is visited.
const DashboardPage = lazy(() => import("@/features/home/components/DashboardPage"));
const LoginPage = lazy(() => import("@/features/auth/components/LoginPage"));
const ResetPasswordPage = lazy(() => import("@/features/auth/components/ResetPasswordPage"));
const NotFoundPage = lazy(() => import("@/shared/components/layout/NotFoundPage"));
const SpeedAssessmentPage = lazy(() => import("@/features/speed-assessment/components/SpeedAssessmentPage"));
const ReadingAssessmentPage = lazy(() => import("@/features/reading-assessment/components/ReadingAssessmentPage"));
const NotesPage = lazy(() => import("@/features/notes/components/NotesPage"));
const ProfilePage = lazy(() => import("@/features/profile/components/ProfilePage"));
const PricingPage = lazy(() => import("@/features/payment/components/PricingPage"));
const PaymentSuccess = lazy(() => import("@/features/payment/components/PaymentSuccess"));
const CoursesPage = lazy(() => import("@/features/courses/components/CoursesPage"));
const CourseDetailPage = lazy(() => import("@/features/courses/components/CourseDetailPage"));
const LearningPage = lazy(() => import("@/features/courses/components/learning/LearningPage"));
const AdminDashboardPage = lazy(() => import("@/features/courses/components/admin/AdminDashboardPage"));
const CourseManagementPage = lazy(() => import("@/features/courses/components/admin/CourseManagementPage"));
const StudentDashboardPage = lazy(() => import("@/features/student/components/StudentDashboardPage"));
const StudentProfilePage = lazy(() => import("@/features/student/components/StudentProfilePage"));
const StudentCoursesPage = lazy(() => import("@/features/student/components/StudentCoursesPage"));
const StudentSchedulePage = lazy(() => import("@/features/student/components/StudentSchedulePage"));
const StudentReadingAssessmentPage = lazy(() => import("@/features/student/components/StudentReadingAssessmentPage"));
const StudentAssessmentHistoryPage = lazy(() => import("@/features/student/components/StudentAssessmentHistoryPage"));
const StudentSpeakingHistoryPage = lazy(() => import("@/features/student/components/StudentSpeakingHistoryPage"));
const ReadingHistoryPage = lazy(() => import("@/features/student/components/ReadingHistoryPage"));
const StudentBatchView = lazy(() => import("@/features/student/components/StudentBatchView"));
const InstructorDashboardPage = lazy(() => import("@/features/instructor/components/InstructorDashboardPage"));
const InstructorAssessmentPage = lazy(() => import("@/features/instructor/components/assessments/InstructorAssessmentPage"));
const InstructorBatchView = lazy(() => import("@/features/instructor/components/InstructorBatchView"));
const InstructorStudentProgressPage = lazy(() => import("@/features/instructor/components/InstructorStudentProgressPage"));
const SpeakingPractice = lazy(() => import("@/features/student/components/SpeakingPractice"));
const MyCurriculum = lazy(() => import("@/features/student/components/MyCurriculum"));
const InstructorCourseManagementPage = lazy(() => import("@/features/instructor/components/InstructorCourseManagementPage"));
const TechPrepPage = lazy(() => import("@/features/instructor/components/TechPrepPage"));
const AlignmentPage = lazy(() => import("@/features/instructor/components/Alignment"));

const InstituteDashboard = lazy(() => import("@/features/Institute/dashboard/InstituteDashboard"));
const InstituteBatches = lazy(() => import("@/features/Institute/dashboard/BatchAllocation"));
const InstituteTutor = lazy(() => import("@/features/Institute/dashboard/InstituteTutor"));
const InstituteStudents = lazy(() => import("@/features/Institute/dashboard/InstituteStudents"));
const InstituteBillings = lazy(() => import("@/features/Institute/dashboard/InstituteBillings"));
const InstituteReports = lazy(() => import("@/features/Institute/dashboard/InstituteReports"));
const StudentOnboarding = lazy(() => import("@/features/Institute/dashboard/StudentOnboarding"));
const TutorOnboarding = lazy(() => import("@/features/Institute/dashboard/TutorOnboarding"));
const InstituteSettings = lazy(() => import("@/features/Institute/dashboard/InstituteSetting"));
const SuperAdminDashboard = lazy(() => import("@/features/TestCrackSuperAdmin/dashboard/SuperAdminDashboard"));
const SuperAdminInstitutes = lazy(() => import("@/features/TestCrackSuperAdmin/dashboard/SuperAdminInstitutes"));
const Subscription = lazy(() => import("@/features/TestCrackSuperAdmin/dashboard/Subscription"));
const PricingConfig = lazy(() => import("@/features/TestCrackSuperAdmin/dashboard/PricingConfig"));
const SupportTicket = lazy(() => import("@/features/TestCrackSuperAdmin/dashboard/SupportTicket"));
const PlatformAnalytics = lazy(() => import("@/features/TestCrackSuperAdmin/dashboard/PlatformAnalytics"));
const AllUsers = lazy(() => import("@/features/TestCrackSuperAdmin/dashboard/AllUsers"));
const InstituteOwnerDashboard = lazy(() => import("@/features/InstituteOwner/dashboard/InstituteOwnerDashboard"));
const Performance = lazy(() => import("@/features/InstituteOwner/dashboard/Performance"));
const BatchInsight = lazy(() => import("@/features/InstituteOwner/dashboard/BatchInsight"));
const InstituteAdmins = lazy(() => import("@/features/InstituteOwner/dashboard/InstituteAdmins"));
const InstituteStudentsPage = lazy(() => import("@/features/InstituteOwner/dashboard/InstituteStudentsPage"));
const InstituteInstructorsPage = lazy(() => import("@/features/InstituteOwner/dashboard/InstituteInstructorsPage"));
const InstituteBatchDetailPage = lazy(() => import("@/features/InstituteOwner/dashboard/InstituteBatchDetailPage"));
const InstituteOwnerStudentProgressPage = lazy(() => import("@/features/InstituteOwner/dashboard/InstituteOwnerStudentProgressPage"));

// Named exports need the .then(...) mapping for React.lazy
const RoiAnalyticsPage = lazy(() => import("@/features/InstituteOwner/dashboard/ComingSoonPages").then(m => ({ default: m.RoiAnalyticsPage })));
const StrategicReportPage = lazy(() => import("@/features/InstituteOwner/dashboard/ComingSoonPages").then(m => ({ default: m.StrategicReportPage })));
const AiCalibrationPage = lazy(() => import("@/features/InstituteOwner/dashboard/ComingSoonPages").then(m => ({ default: m.AiCalibrationPage })));
const InstructorReportPage = lazy(() => import("@/features/instructor/components/InstructorReportPage").then(m => ({ default: m.InstructorReportPage })));

const VoiceLab = lazy(() => import("@/features/student/components/VoiceLab"));
const SpeedReading = lazy(() => import("@/features/student/components/SpeedReading"));
const Workflow = lazy(() => import("@/features/instructor/components/Workflow"));
const IeltsWriting = lazy(() => import("@/features/student/components/IeltsWriting"));
const ListeningPractice = lazy(() => import("@/features/student/components/ListeningPractice"));
const ReadingPractice = lazy(() => import("@/features/student/components/ReadingPractice"));
const Dashdemo = lazy(() => import("@/features/home/components/Dashdemo"));
const Contactpage = lazy(() => import("@/features/home/components/ContactPage"));
const CourseSection = lazy(() => import("@/features/student/components/CourseSection"));
const Suggestion = lazy(() => import("@/features/student/components/Suggestions"));
const SpeakingAssessment = lazy(() => import("@/features/student/components/SpeakingAssessment"));
const Diagnosis = lazy(() => import("@/features/student/components/Diagnosis/Diagnosis"));
const OnboardingWalkthrough = lazy(() => import("@/features/student/components/Onboarding/OnboardingWalkthrough"));
const HowItWorks = lazy(() => import("@/features/student/components/HowItWorks"));
const AssessmentHistoryPage = lazy(() => import("@/features/student/components/AssessmentHistoryPage"));
const SuggestionsPage = lazy(() => import("@/features/student/components/SuggestionsPage"));
const Report = lazy(() => import("@/features/student/components/Report"));
const DrillScreen = lazy(() => import("@/features/student/components/Drills/DrillScreen"));
const LexiGrid = lazy(() => import("@/features/student/components/LexiGrid"));
const InternalAssessmentPage = lazy(() => import("@/features/student/components/Assessment"));
const FullMockAssessment = lazy(() => import("@/features/student/components/FullMockAssessment"));
const StudentNotEnrolledPage = lazy(() => import("@/features/student/components/StudentNotEnrolledPage"));
const B2CLoginPage = lazy(() => import("@/features/B-C/pages/B2cloginpage"));
const B2CStudentDashboard = lazy(() => import("@/features/B-C/pages/B2cstudentdashboard"));
const BandLadderGame = lazy(() => import("@/features/B-C/games/Bandladdergame"));
const ConnectorChainGame = lazy(() => import("@/features/B-C/games/Connectorchaingame"));
const InferenceSprintGame = lazy(() => import("@/features/B-C/games/Inferencesprintgame"));
const LexiGridGame = lazy(() => import("@/features/B-C/games/Lexigridgame"));
const SentenceSurgeryGame = lazy(() => import("@/features/B-C/games/Sentencesurgerygame"));
const TrapSpotterGame = lazy(() => import("@/features/B-C/games/Trapspottergame"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700" />
  </div>
);

const B2CProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const email = sessionStorage.getItem('b2c_email');
  return email ? <>{children}</> : <Navigate to="/b2c/login" replace />;
};

const LoginRedirect = () => {
  const { profile, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return null;

  if (profile?.role === 'SUPERADMIN') return <Navigate to="/superadmin/dashboard" replace />;
  if (profile?.role === 'INSTITUTE_OWNER') return <Navigate to="/institute-owner/dashboard" replace />;
  if (profile?.role === 'INSTITUTE_ADMIN') return <Navigate to="/institute-admin/dashboard" replace />;
  if (profile?.role === 'INSTRUCTOR') return <Navigate to="/instructor/dashboard" replace />;

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

  if (profile.role === 'STUDENT') {
    if (profile.isEnrolled === false) return <Navigate to="/student/not-enrolled" replace />;
    if (!profile.isDiagnosed)        return <Navigate to="/student/onboarding" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

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

const StudentDrillLockGuard = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading, profileLoading } = useAuth();
  const [dashboardUnlocked, setDashboardUnlocked] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== 'STUDENT') {
      setChecking(false);
      return;
    }
    let cancelled = false;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    callBackend(`${backendUrl}/api/student/daily-drill-state`)
      .then((res: any) => {
        if (cancelled) return;
        setDashboardUnlocked(res?.success ? Boolean(res.dashboard_unlocked) : false);
      })
      .catch(() => {
        if (!cancelled) setDashboardUnlocked(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => { cancelled = true; };
  }, [profile]);

  if ((loading || profileLoading) && !profile) return null;
  if (!profile) return <Navigate to="/login" replace />;

  if (profile.role === 'STUDENT') {
    if (checking) return null;
    if (!dashboardUnlocked) return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/student/onboarding" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><OnboardingWalkthrough /></RoleProtectedRoute>} />
      <Route path="/student/diagnosis" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><Diagnosis /></RoleProtectedRoute>} />
      <Route path="/dashdemo" element={<Dashdemo />} />
      <Route path="/Contact" element={<Contactpage />} />

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

      <Route path="/b2c/game/lexigrid"         element={<B2CProtectedRoute><LexiGridGame        /></B2CProtectedRoute>} />
      <Route path="/b2c/game/trap-spotter"     element={<B2CProtectedRoute><TrapSpotterGame     /></B2CProtectedRoute>} />
      <Route path="/b2c/game/band-ladder"      element={<B2CProtectedRoute><BandLadderGame      /></B2CProtectedRoute>} />
      <Route path="/b2c/game/sentence-surgery" element={<B2CProtectedRoute><SentenceSurgeryGame /></B2CProtectedRoute>} />
      <Route path="/b2c/game/inference-sprint" element={<B2CProtectedRoute><InferenceSprintGame /></B2CProtectedRoute>} />
      <Route path="/b2c/game/connector-chain"  element={<B2CProtectedRoute><ConnectorChainGame  /></B2CProtectedRoute>} />

      <Route element={<RequireActiveInstitute />}>
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

      <Route path="/superadmin/dashboard" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminDashboard /></RoleProtectedRoute>} />
      <Route path="/superadmin/institutes" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminInstitutes /></RoleProtectedRoute>} />
      <Route path="/superadmin/subscription" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><Subscription /></RoleProtectedRoute>} />
      <Route path="/superadmin/priceconfig" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><PricingConfig /></RoleProtectedRoute>} />
      <Route path="/superadmin/supportickets" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><SupportTicket /></RoleProtectedRoute>} />
      <Route path="/superadmin/platform" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><PlatformAnalytics /></RoleProtectedRoute>} />
      <Route path="/superadmin/allusers" element={<RoleProtectedRoute allowedRoles={['SUPERADMIN']}><AllUsers /></RoleProtectedRoute>} />

      <Route path="/login" element={user ? <LoginRedirect /> : <LoginPage />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      {/* Supabase invite/recovery action links land here — must render regardless of
          session state so the set-password flow runs before any role redirect. */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:slug" element={<CourseDetailPage />} />
      <Route path="/dashboard" element={<ManualDashboardAccess />} />
      <Route path="/dashboard/:tab" element={<ManualDashboardAccess />} />

      <Route path="/student/not-enrolled" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentNotEnrolledPage /></RoleProtectedRoute>} />

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

      <Route path="/student/courses" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><StudentCoursesPage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/schedule" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><StudentSchedulePage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/voice" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><VoiceLab /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/speed" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><SpeedReading /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/speaking-assessment" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><StudentReadingAssessmentPage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/writing" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><IeltsWriting /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/listening" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><ListeningPractice /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/asess" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><SpeakingAssessment /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/reading" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><ReadingPractice /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/courses-section" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><CourseSection /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/reading-assessment/history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><StudentAssessmentHistoryPage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/speaking-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><StudentSpeakingHistoryPage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/reading-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><ReadingHistoryPage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/my-curriculum" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><MyCurriculum /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/batches" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><StudentBatchView /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/assessment-history" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><AssessmentHistoryPage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/suggestion-page" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><SuggestionsPage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/report" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><Report /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/suggestion" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><Suggestion /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/speaking-practice" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><SpeakingPractice /></StudentDrillLockGuard></RoleProtectedRoute>} />

      <Route path="/student/drill" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><DrillScreen /></RoleProtectedRoute>} />
      <Route path="/student/lexigrid" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><LexiGrid /></RoleProtectedRoute>} />

      <Route path="/student/internal" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><InternalAssessmentPage /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/assessment" element={<Navigate to="/student/internal" replace />} />
      <Route path="/student/mock" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><FullMockAssessment /></StudentDrillLockGuard></RoleProtectedRoute>} />
      <Route path="/student/how-it-works" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentDrillLockGuard><HowItWorks /></StudentDrillLockGuard></RoleProtectedRoute>} />

      <Route
        path="/instructor/dashboard"
        element={
          <RoleProtectedRoute allowedRoles={['INSTRUCTOR']}>
            <InstructorDashboardPage />
          </RoleProtectedRoute>
        }
      />
      <Route path="/instructor/batches/:batchId/students/:studentId/progress" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorStudentProgressPage /></RoleProtectedRoute>} />
      <Route path="/instructor/assessments" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorAssessmentPage /></RoleProtectedRoute>} />
      <Route path="/instructor/coursemanagement" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorCourseManagementPage /></RoleProtectedRoute>} />
      <Route path="/instructor/batches" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorBatchView /></RoleProtectedRoute>} />
      <Route path="/instructor/tech-pep" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><TechPrepPage /></RoleProtectedRoute>} />
      <Route path="/instructor/alignment" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><AlignmentPage /></RoleProtectedRoute>} />
      <Route path="/instructor/reports" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorReportPage /></RoleProtectedRoute>} />
      <Route path="/instructor/workflow" element={<RoleProtectedRoute allowedRoles={['INSTRUCTOR']}><Workflow /></RoleProtectedRoute>} />

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
    </Suspense>
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