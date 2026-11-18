import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';

// Public Pages
import { LandingPage } from '../pages/LandingPage';
import { AboutPage } from '../pages/AboutPage';
import { FeaturesPage } from '../pages/FeaturesPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ProfilePage } from '../pages/ProfilePage';

// Candidate Pages
import { CandidateDashboard } from '../pages/candidate/CandidateDashboard';
import { JobListingsPage } from '../pages/candidate/JobListingsPage';
import { JobDetailsPage } from '../pages/candidate/JobDetailsPage';
import { CandidateApplicationsPage } from '../pages/candidate/CandidateApplicationsPage';
import { ResumeUploadPage } from '../pages/candidate/ResumeUploadPage';
import { CandidateInterviewsPage } from '../pages/candidate/CandidateInterviewsPage';
import { AssessmentHistoryPage } from '../pages/candidate/AssessmentHistoryPage';

// Recruiter Pages
import { RecruiterDashboard } from '../pages/recruiter/RecruiterDashboard';
import { JobManagementPage } from '../pages/recruiter/JobManagementPage';
import { ApplicationsReviewPage } from '../pages/recruiter/ApplicationsReviewPage';
import { QuestionManagementPage } from '../pages/recruiter/QuestionManagementPage';
import { InterviewSchedulingPage } from '../pages/recruiter/InterviewSchedulingPage';
import { CandidateComparisonPage } from '../pages/recruiter/CandidateComparisonPage';
import { AnalyticsPage } from '../pages/recruiter/AnalyticsPage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { AISettingsPage } from '../pages/admin/AISettingsPage';

// Interview & Research
import { VideoInterviewRoom } from '../pages/interview/VideoInterviewRoom';
import { IEEEResearchPage } from '../pages/research/IEEEResearchPage';

// Root Security Gate: Forces unauthenticated users to /login immediately; authorized users go straight to their dashboard
const RootSecurityGate: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Authentication Credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user.role === 'RECRUITER' || user.role === 'INTERVIEWER') {
    return <Navigate to="/recruiter/dashboard" replace />;
  } else {
    return <Navigate to="/candidate/dashboard" replace />;
  }
};

// Public Auth Route Guard: If already logged in, redirect away from /login and /register to authorized dashboard
const PublicAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Session...</span>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'RECRUITER' || user.role === 'INTERVIEWER') {
      return <Navigate to="/recruiter/dashboard" replace />;
    } else {
      return <Navigate to="/candidate/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Protected Route Guard: Requires valid authentication and enforces role permissions
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Authenticating Token & Permissions...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Fullscreen Video Room Route - Strictly Authenticated */}
      <Route
        path="/interview/:roomCode"
        element={
          <ProtectedRoute>
            <VideoInterviewRoom />
          </ProtectedRoute>
        }
      />

      {/* Main Layout Wrapped Routes */}
      <Route element={<AppLayout />}>
        {/* Root Route: Always checks authentication. If not logged in -> /login. If logged in -> Role Portal */}
        <Route path="/" element={<RootSecurityGate />} />

        {/* Authentication Gateways */}
        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <LoginPage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicAuthRoute>
              <RegisterPage />
            </PublicAuthRoute>
          }
        />

        {/* Optional Public Info Pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/welcome" element={<LandingPage />} />

        {/* Protected Jobs Browsing - Authorized Users Only */}
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobListingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <JobDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* User Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Candidate Routes - Accessible by Candidates & Admins */}
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/applications"
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
              <CandidateApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/resume"
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
              <ResumeUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/interviews"
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
              <CandidateInterviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/assessments"
          element={
            <ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN']}>
              <AssessmentHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Recruiter & Interviewer Routes - Also fully accessible by Admins */}
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute allowedRoles={['RECRUITER', 'INTERVIEWER', 'ADMIN']}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
              <JobManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute allowedRoles={['RECRUITER', 'INTERVIEWER', 'ADMIN']}>
              <ApplicationsReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/questions"
          element={
            <ProtectedRoute allowedRoles={['RECRUITER', 'INTERVIEWER', 'ADMIN']}>
              <QuestionManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/interviews"
          element={
            <ProtectedRoute allowedRoles={['RECRUITER', 'INTERVIEWER', 'ADMIN']}>
              <InterviewSchedulingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/rankings"
          element={
            <ProtectedRoute allowedRoles={['RECRUITER', 'INTERVIEWER', 'ADMIN']}>
              <CandidateComparisonPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/analytics"
          element={
            <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Master Admin Routes - Strictly Admin Only */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AISettingsPage />
            </ProtectedRoute>
          }
        />

        {/* IEEE Research Suite - Protected for Admin & Evaluators */}
        <Route
          path="/research/experiments"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECRUITER', 'INTERVIEWER']}>
              <IEEEResearchPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback - Redirects to root security gate */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
