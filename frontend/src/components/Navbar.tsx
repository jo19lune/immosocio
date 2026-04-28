/**
 * Navbar.tsx — Barre de navigation utilisateur connecté
 * Palette Teal × Ambre · anime.js
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { animate, stagger } from 'animejs';
import { useAuth } from '../contexts/AuthContext';
import logoSrc from '../assets/logo.svg';
import {
  IconHome, IconBell, IconEnvelope, IconSettings,
  IconUser, IconSearch, IconDarkMode, IconLightMode, IconPlus,
  IconSignOut, IconShield,
} from './icons';

export default function Navbar() {
  const location     = useLocation();
  const { user }     = useAuth();
  const navRef       = useRef<HTMLElement>(null);
  const itemsRef     = useRef<HTMLUListElement>(null);
  const [dark, setDark]   = useState(document.documentElement.dataset.theme !== 'light');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!navRef.current) return;
    animate(navRef.current, {
      opacity: [0, 1], translateY: [-12, 0],
      duration: 500, easing: 'easeOutExpo',
    });
    const items = itemsRef.current?.querySelectorAll('.nav-item');
    if (items) {
      animate(items, {
        opacity: [0, 1], translateY: [-8, 0],
        delay: stagger(60), duration: 400, easing: 'easeOutCubic',
      });
    }
  }, []);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setDark(!dark);
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav ref={navRef} className="navbar" style={{ opacity: 0 }}>
      <Link to="/" className="navbar-brand">
        <img src={logoSrc} alt="Logo" className="logo" style={{ width: 34, height: 34 }} />
      </Link>

      <ul ref={itemsRef} className="navbar-nav">
        <li>
          <Link to="/feed" className={`nav-item ${isActive('/feed') ? 'active' : ''}`}>
            <IconHome size={18} />
            <span className="nav-label">Accueil</span>
          </Link>
        </li>
        <li>
          <Link to="/annonces" className={`nav-item ${isActive('/annonces') ? 'active' : ''}`}>
            <FontAwesomeIcon icon={['fas', 'bullhorn']} />
            <span className="nav-label">Annonces</span>
          </Link>
        </li>
        <li>
          <Link to="/messages" className={`nav-item ${isActive('/messages') ? 'active' : ''}`}>
            <span className="icon-badge-wrapper"><IconEnvelope size={18} /></span>
            <span className="nav-label">Messages</span>
          </Link>
        </li>
        <li>
          <Link to="/notifications" className={`nav-item ${isActive('/notifications') ? 'active' : ''}`}>
            <span className="icon-badge-wrapper"><IconBell size={18} /></span>
            <span className="nav-label">Notifications</span>
          </Link>
        </li>
      </ul>

      <div className="navbar-actions">
        <button className="btn btn-ghost btn-icon" aria-label="Rechercher">
          <IconSearch size={16} />
        </button>

        {user && (
          <Link to="/mes-annonces/nouvelle" className="btn btn-primary" style={{ gap: '0.4em' }}>
            <IconPlus size={14} />
            <span className="hide-sm">Publier</span>
          </Link>
        )}

        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          aria-label="Basculer le thème"
          title={dark ? 'Mode clair' : 'Mode sombre'}
        >
          {dark ? <IconLightMode size={16} /> : <IconDarkMode size={16} />}
        </button>

        {user && (
          <div className="profile-menu-wrapper">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu utilisateur"
            >
              <IconUser size={16} />
            </button>
            {menuOpen && (
              <ProfileDropdown user={user} onClose={() => setMenuOpen(false)} />
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function ProfileDropdown({ user, onClose }: { user: any; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { logout } = useAuth() as any;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const items = ref.current?.querySelectorAll('.dropdown-item');
    if (items) {
      animate(items, {
        opacity: [0, 1], translateX: [8, 0],
        delay: stagger(40), duration: 220, easing: 'easeOutCubic',
      });
    }
  }, []);

  return (
    <div ref={ref} className="profile-dropdown">
      <Link to={`/profil/${user.id}`} className="dropdown-item" onClick={onClose}>
        <FontAwesomeIcon icon={['fas', 'user']} style={{ width: 14 }} /> Mon profil
      </Link>
      <Link to="/mes-annonces" className="dropdown-item" onClick={onClose}>
        <FontAwesomeIcon icon={['fas', 'bullhorn']} style={{ width: 14 }} /> Mes annonces
      </Link>
      <Link to="/mes-reservations" className="dropdown-item" onClick={onClose}>
        <FontAwesomeIcon icon={['fas', 'bookmark']} style={{ width: 14 }} /> Mes réservations
      </Link>
      <Link to="/parametres" className="dropdown-item" onClick={onClose}>
        <IconSettings size={14} /> Paramètres
      </Link>
      {user?.role === 'admin' && (
        <>
          <div className="dropdown-divider" />
          <Link to="/admin/dashboard" className="dropdown-item" onClick={onClose}>
            <IconShield size={14} /> Dashboard admin
          </Link>
        </>
      )}
      <div className="dropdown-divider" />
      <button className="dropdown-item danger" onClick={() => { onClose(); logout?.(); }}>
        <IconSignOut size={14} /> Se déconnecter
      </button>
    </div>
  );
}
