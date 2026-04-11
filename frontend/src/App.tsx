import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages publiques
import PublicFeedPage from './pages/PublicFeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AnnoncesPage from './pages/AnnoncesPage';

// Pages membres
import FeedPage from './pages/FeedPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilPage from './pages/ProfilPage';

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

      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><RegisterPage /></PublicRoute>
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

      {/* ── Fallback ─────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
