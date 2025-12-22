import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthPage } from '@/features/auth';
import { NotesPage } from '@/features/notes';
import { ProfilePage } from '@/features/profile';
import { ReadingAssessmentPage } from '@/features/reading-assessment';
import { SpeedAssessmentPage } from '@/features/speed-assessment';
import { HomePage } from '@/features/home';
import NotFoundPage  from '@/shared/components/layout/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/notes',
    element: <NotesPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/reading-assessment',
    element: <ReadingAssessmentPage />,
  },
  {
    path: '/speed-assessment',
    element: <SpeedAssessmentPage />,
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
