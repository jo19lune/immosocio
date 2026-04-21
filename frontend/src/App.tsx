import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AUTH_SESSION_EXPIRED_EVENT } from './lib/api';
import { initTheme } from './lib/theme';

// Pages publiques
import PublicFeedPage from './pages/PublicFeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AnnoncesPage from './pages/AnnoncesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AnnonceDetailsPage from './pages/AnnonceDetailsPage';

// Pages membres
import FeedPage from './pages/FeedPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilPage from './pages/ProfilPage';
import CreateAnnoncePage from './pages/CreateAnnoncePage';
import MesAnnoncesPage from './pages/MesAnnoncesPage';
import EditAnnoncePage from './pages/EditAnnoncePage';
import SuperadminDashboard from './pages/SuperadminDashboard';
import CreateReservationPage from './pages/CreateReservationPage';
import MyReservationsPage from './pages/MyReservationsPage';
import ReservationDemandsPage from './pages/ReservationDemandsPage';

// Guard routes privées
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// Guard routes publiques (redirige si déjà connecté)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/feed" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Pages publiques ─────────────────────────── */}
      <Route path="/" element={<PublicFeedPage />} />
      <Route path="/annonces" element={<AnnoncesPage />} />
      <Route path="/annonces/:id" element={<AnnonceDetailsPage />} />

      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><RegisterPage /></PublicRoute>
      } />
      <Route path="/mot-de-passe-oublie" element={
        <PublicRoute><ForgotPasswordPage /></PublicRoute>
      } />
      <Route path="/auth/reset-password" element={
        <PublicRoute><ResetPasswordPage /></PublicRoute>
      } />
      <Route path="/auth/verify-email" element={
        <PublicRoute><VerifyEmailPage /></PublicRoute>
      } />

      {/* ── Pages membres ────────────────────────────── */}
      <Route path="/feed" element={
        <PrivateRoute><FeedPage /></PrivateRoute>
      } />
      <Route path="/messages" element={
        <PrivateRoute><MessagesPage /></PrivateRoute>
      } />
      <Route path="/messages/:userId" element={
        <PrivateRoute><MessagesPage /></PrivateRoute>
      } />
      <Route path="/notifications" element={
        <PrivateRoute><NotificationsPage /></PrivateRoute>
      } />
      <Route path="/parametres" element={
        <PrivateRoute><SettingsPage /></PrivateRoute>
      } />
      <Route path="/profil/:userId" element={
        <PrivateRoute><ProfilPage /></PrivateRoute>
      } />
      <Route path="/mes-annonces" element={
        <PrivateRoute><MesAnnoncesPage /></PrivateRoute>
      } />
      <Route path="/mes-annonces/nouvelle" element={
        <PrivateRoute><CreateAnnoncePage /></PrivateRoute>
      } />
      <Route path="/mes-annonces/:id/modifier" element={
        <PrivateRoute><EditAnnoncePage /></PrivateRoute>
      } />
      <Route path="/reservations/nouvelle" element={
        <PrivateRoute><CreateReservationPage /></PrivateRoute>
      } />
      <Route path="/mes-reservations" element={
        <PrivateRoute><MyReservationsPage /></PrivateRoute>
      } />
      <Route path="/demandes-reservations" element={
        <PrivateRoute><ReservationDemandsPage /></PrivateRoute>
      } />
      <Route path="/admin/dashboard" element={
        <PrivateRoute><SuperadminDashboard /></PrivateRoute>
      } />

      {/* ── Fallback ─────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { Toaster } from 'react-hot-toast';

function AuthSessionRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      navigate('/login', { replace: true });
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [navigate]);

  return null;
}

export default function App() {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AuthProvider>
        <AuthSessionRedirect />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
