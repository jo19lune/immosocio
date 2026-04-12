import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import './AppLayout.css';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  badge?: number;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [n, m] = await Promise.all([
          api.get('/notifications/count'),
          api.get('/messages/non-lus'),
        ]);
        setUnreadNotifs(n.data.nonLues || 0);
        setUnreadMessages(m.data.nonLus || 0);
      } catch { /* silencieux */ }
    };
    fetchCounts();
    const id = setInterval(fetchCounts, 30000);
    return () => clearInterval(id);
  }, []);

  const navItems: NavItem[] = [
    { path: '/feed', icon: '🏠', label: 'Fil d\'actualité' },
    { path: '/annonces', icon: '🏘️', label: 'Annonces' },
    ...(user?.role === 'PROPRIETAIRE'
      ? [{ path: '/mes-annonces', icon: '📋', label: 'Mes annonces' }]
      : []),
    { path: '/messages', icon: '💬', label: 'Messages', badge: unreadMessages },
    { path: '/notifications', icon: '🔔', label: 'Notifications', badge: unreadNotifs },
    { path: '/parametres', icon: '⚙️', label: 'Paramètres' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const avatarUrl = user?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || '') + '+' + (user?.nom || ''))}&background=3B6CF8&color=fff&bold=true`;

  return (
    <div className="app-layout">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="logo-icon">🏡</span>
          <span className="logo-text">ImmoSocial</span>
        </div>

        {/* Profil rapide */}
        <Link to={`/profil/${user?.id}`} className="sidebar-profile">
          <img src={avatarUrl} alt="" className="avatar" width={42} height={42} />
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{user?.prenom} {user?.nom}</span>
            <span className="sidebar-profile-role badge badge-primary">
              {user?.role === 'PROPRIETAIRE' ? 'Propriétaire' : user?.role === 'ADMIN' ? 'Admin' : 'Locataire'}
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Actions bas de sidebar */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="main-wrapper">
        {/* Topbar mobile */}
        <header className="topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <span className="topbar-logo">🏡 ImmoSocial</span>
          <div className="topbar-actions">
            <Link to="/messages" className="topbar-icon-btn">
              💬
              {unreadMessages > 0 && <span className="notif-dot" />}
            </Link>
            <Link to="/notifications" className="topbar-icon-btn">
              🔔
              {unreadNotifs > 0 && <span className="notif-dot" />}
            </Link>
            <Link to={`/profil/${user?.id}`}>
              <img src={avatarUrl} alt="" className="avatar topbar-avatar" width={34} height={34} />
            </Link>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
