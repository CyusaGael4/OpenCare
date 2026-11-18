import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import AuthPage from './pages/auth/AuthPage.jsx';
import LandingPage from './pages/public/LandingPage.jsx';
import PatientDashboard from './pages/patient/PatientDashboard.jsx';
import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx';
import { roleHome } from './utils/roleHome.js';

function ProtectedRoute({ children, allowedRoles, redirectTo = '/auth' }) {
  const { status, isAuthenticated, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink-muted">
        <div className="flex items-center gap-2">
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-primary" />
          Loading your session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={roleHome(user?.role ?? 'patient')} replace />;
  }

  return children;
}

function GuestRoute({ children, redirectTo = '/' }) {
  const { status, isAuthenticated, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink-muted">
        <div className="flex items-center gap-2">
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-primary" />
          Preparing sign-in…
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to={roleHome(user?.role ?? 'patient')} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<GuestRoute><AuthPage /></GuestRoute>} />
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
