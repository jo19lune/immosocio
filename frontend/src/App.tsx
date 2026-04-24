import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AUTH_SESSION_EXPIRED_EVENT } from './lib/api';
import { initTheme } from './lib/theme';

// ── Font Awesome — bibliothèque globale ──────────────────────────────────────
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faHome, faBell, faEnvelope, faCog, faUser,
  faBars, faSearch, faTimes, faCheck, faTrash,
  faEdit, faPaperPlane, faExpand, faCompress,
  faMoon, faSun, faUserPlus, faUserMinus,
  faCheckCircle, faTimesCircle,
  faComment, faEye, faUsers, faStar, faHeart,
  faPlus, faSignOutAlt, faShield, faBullhorn,
  faBookmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  faBell as faBellRegular, faComment as faCommentRegular,
  faEnvelope as faEnvelopeRegular, faHeart as faHeartRegular,
  faBookmark as faBookmarkRegular,
} from '@fortawesome/free-regular-svg-icons';

library.add(
  faHome, faBell, faEnvelope, faCog, faUser,
  faBars, faSearch, faTimes, faCheck, faTrash,
  faEdit, faPaperPlane, faExpand, faCompress,
  faMoon, faSun, faUserPlus, faUserMinus,
  faCheckCircle, faTimesCircle,
  faComment, faEye, faUsers, faStar, faHeart,
  faPlus, faSignOutAlt, faShield, faBullhorn,
  faBookmark,
  faBellRegular, faCommentRegular, faEnvelopeRegular,
  faHeartRegular, faBookmarkRegular,
);

import LoadingScreen from './components/LoadingScreen';
import AppLayout from './components/layout/AppLayout';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages publiques
import PublicFeedPage from './pages/PublicFeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AnnoncesPage from './pages/AnnoncesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AnnonceDetailsPage from './pages/AnnonceDetailsPage';
import UsersListPage from './pages/UsersListPage';

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

// Layout conditionnel global
function RootLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  if (user) {
    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    );
  } else {
    return (
      <div className="public-layout fade-in">
        <Navbar />
        <main className="public-main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  }
}

// Guard routes privées
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// Guard routes publiques (redirige si déjà connecté)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/feed" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* ── Pages publiques ─────────────────────────── */}
        <Route path="/" element={<PublicFeedPage />} />
        <Route path="/annonces" element={<AnnoncesPage />} />
        <Route path="/annonces/:id" element={<AnnonceDetailsPage />} />
        <Route path="/utilisateurs" element={<UsersListPage />} />

        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/mot-de-passe-oublie" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/auth/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/auth/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />

        {/* ── Pages membres ────────────────────────────── */}
        <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/messages/:userId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/parametres" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/profil/:userId" element={<PrivateRoute><ProfilPage /></PrivateRoute>} />
        <Route path="/mes-annonces" element={<PrivateRoute><MesAnnoncesPage /></PrivateRoute>} />
        <Route path="/mes-annonces/nouvelle" element={<PrivateRoute><CreateAnnoncePage /></PrivateRoute>} />
        <Route path="/mes-annonces/:id/modifier" element={<PrivateRoute><EditAnnoncePage /></PrivateRoute>} />
        <Route path="/reservations/nouvelle" element={<PrivateRoute><CreateReservationPage /></PrivateRoute>} />
        <Route path="/mes-reservations" element={<PrivateRoute><MyReservationsPage /></PrivateRoute>} />
        <Route path="/demandes-reservations" element={<PrivateRoute><ReservationDemandsPage /></PrivateRoute>} />
        <Route path="/admin/dashboard" element={<PrivateRoute><SuperadminDashboard /></PrivateRoute>} />

        {/* ── Fallback ─────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
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
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-surface, var(--surface))',
            color: 'var(--text-primary, var(--text))',
            border: '1px solid var(--border-color, var(--border))',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            backdropFilter: 'blur(12px)',
          },
          success: {
            iconTheme: { primary: 'var(--success)', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: 'var(--danger)', secondary: '#fff' },
          },
        }}
      />
      <AuthProvider>
        <AuthSessionRedirect />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}