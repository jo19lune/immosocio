import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { onNotification } from '../../lib/websocket';
import api from '../../lib/api';
import Logo from '../Logo';
import './AppLayout.css';

// ── SVG assets ────────────────────────────────────────────────────────────────
import homeLineSvg        from '../../assets/home_1_line.svg';
import homeFillSvg        from '../../assets/home_1_fill.svg';
import announcementLineSvg from '../../assets/announcement_line.svg';
import announcementFillSvg from '../../assets/announcement_fill.svg';
import messengerLineSvg   from '../../assets/messenger_line.svg';
import messengerFillSvg   from '../../assets/messenger_fill.svg';
import notifLineSvg       from '../../assets/notification_line.svg';
import notifFillSvg       from '../../assets/notification_fill.svg';
import settingsLineSvg    from '../../assets/settings_1_line.svg';
import settingsFillSvg    from '../../assets/settings_1_fill.svg';
import menuLineSvg        from '../../assets/menu_line.svg';
import userLineSvg        from '../../assets/user_1_line.svg';
import closeLineSvg       from '../../assets/close_line.svg';
import checkFillSvg       from '../../assets/checkbox_circle_fill.svg';
import timeLineSvg        from '../../assets/time_line.svg';

interface NavItem {
  path: string;
  iconLine: string;
  iconFill: string;
  label: string;
  badge?: number;
}

/** Icône SVG qui bascule entre la version "line" et "fill" selon l'état actif */
function NavIcon({ src, alt, size = 20 }: { src: string; alt: string; size?: number }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ flexShrink: 0, filter: 'var(--nav-icon-filter, none)' }}
    />
  );
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
    
    // Refresh auto sur notification WebSocket
    const unsub = onNotification((data) => {
      fetchCounts();
      // On peut aussi émettre un événement global pour que les pages se rafraîchissent
      window.dispatchEvent(new CustomEvent('ws-refresh', { detail: data }));
    });

    return () => {
      clearInterval(id);
      unsub();
    };
  }, []);

  const navItems: NavItem[] = [
    { path: '/feed',          iconLine: homeLineSvg,         iconFill: homeFillSvg,         label: "Fil d'actualité" },
    { path: '/annonces',      iconLine: announcementLineSvg,  iconFill: announcementFillSvg,  label: 'Annonces' },
    ...(user?.role === 'PROPRIETAIRE'
      ? [
          { path: '/mes-annonces', iconLine: announcementLineSvg, iconFill: announcementFillSvg, label: 'Mes annonces' },
          { path: '/demandes-reservations', iconLine: checkFillSvg, iconFill: checkFillSvg, label: 'Demandes reçues' }
        ]
      : []),
    { path: '/mes-reservations', iconLine: timeLineSvg, iconFill: timeLineSvg, label: 'Mes réservations' },
    { path: '/messages',      iconLine: messengerLineSvg,    iconFill: messengerFillSvg,    label: 'Messages',       badge: unreadMessages },
    { path: '/notifications', iconLine: notifLineSvg,        iconFill: notifFillSvg,        label: 'Notifications',  badge: unreadNotifs  },
    { path: '/parametres',    iconLine: settingsLineSvg,      iconFill: settingsFillSvg,     label: 'Paramètres'      },
    ...(user?.role === 'SUPERADMIN' || user?.role === 'ADMIN'
      ? [{ path: '/admin/dashboard', iconLine: userLineSvg, iconFill: userLineSvg, label: 'Administration' }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const avatarUrl = user?.photo
    || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || '') + '+' + (user?.nom || ''))}&background=3B6CF8&color=fff&bold=true`;

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
          <Logo size={32} />
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
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">
                  <NavIcon
                    src={isActive ? item.iconFill : item.iconLine}
                    alt={item.label}
                  />
                </span>
                <span className="nav-label">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions bas de sidebar */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <NavIcon src={closeLineSvg} alt="Déconnexion" size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="main-wrapper">
        {/* Topbar mobile */}
        <header className="topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <img src={sidebarOpen ? closeLineSvg : menuLineSvg} alt="Menu" width={22} height={22} />
          </button>
          <Logo size={26} />
          <div className="topbar-actions">
            <Link to="/messages" className="topbar-icon-btn">
              <img src={messengerLineSvg} alt="Messages" width={22} height={22} />
              {unreadMessages > 0 && <span className="notif-dot" />}
            </Link>
            <Link to="/notifications" className="topbar-icon-btn">
              <img src={notifLineSvg} alt="Notifications" width={22} height={22} />
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
