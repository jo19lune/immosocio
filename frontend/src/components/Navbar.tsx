/**
 * Navbar.tsx — Barre de navigation utilisateur connecté
 * Refactored to use standard Tailwind and new design system variables
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
    <nav ref={navRef} className="bg-surface/80 backdrop-blur-md border-b border-outline h-16 flex items-center justify-between px-6 sticky top-0 z-50 transition-colors shadow-sm" style={{ opacity: 0 }}>
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img src={logoSrc} alt="Logo" className="w-8 h-8 object-contain" />
      </Link>

      <ul ref={itemsRef} className="hidden md:flex items-center gap-2">
        <li>
          <Link to="/feed" className={`nav-item flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive('/feed') ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-background hover:text-on-surface'}`}>
            <IconHome size={18} />
            <span className="hidden lg:inline">Accueil</span>
          </Link>
        </li>
        <li>
          <Link to="/annonces" className={`nav-item flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive('/annonces') ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-background hover:text-on-surface'}`}>
            <FontAwesomeIcon icon={['fas', 'bullhorn']} />
            <span className="hidden lg:inline">Annonces</span>
          </Link>
        </li>
        <li>
          <Link to="/messages" className={`nav-item flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive('/messages') ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-background hover:text-on-surface'}`}>
            <span className="relative"><IconEnvelope size={18} /></span>
            <span className="hidden lg:inline">Messages</span>
          </Link>
        </li>
        <li>
          <Link to="/notifications" className={`nav-item flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive('/notifications') ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-background hover:text-on-surface'}`}>
            <span className="relative"><IconBell size={18} /></span>
            <span className="hidden lg:inline">Notifications</span>
          </Link>
        </li>
      </ul>

      <div className="flex items-center gap-3">
        <button className="btn btn-ghost !p-2 !rounded-full" aria-label="Rechercher">
          <IconSearch size={16} />
        </button>

        {user && (
          <Link to="/mes-annonces/nouvelle" className="btn btn-primary !rounded-full hidden sm:inline-flex">
            <IconPlus size={14} />
            <span>Publier</span>
          </Link>
        )}

        <button
          className="btn btn-ghost !p-2 !rounded-full"
          onClick={toggleTheme}
          aria-label="Basculer le thème"
          title={dark ? 'Mode clair' : 'Mode sombre'}
        >
          {dark ? <IconLightMode size={16} /> : <IconDarkMode size={16} />}
        </button>

        {user && (
          <div className="relative">
            <button
              className="btn btn-ghost !p-2 !rounded-full"
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
    <div ref={ref} className="card absolute right-0 top-full mt-2 w-56 flex flex-col p-1 z-50">
      <Link to={`/profil/${user.id}`} className="dropdown-item flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:bg-background hover:text-on-surface rounded-md transition-colors" onClick={onClose}>
        <FontAwesomeIcon icon={['fas', 'user']} style={{ width: 14 }} /> Mon profil
      </Link>
      <Link to="/mes-annonces" className="dropdown-item flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:bg-background hover:text-on-surface rounded-md transition-colors" onClick={onClose}>
        <FontAwesomeIcon icon={['fas', 'bullhorn']} style={{ width: 14 }} /> Mes annonces
      </Link>
      <Link to="/mes-reservations" className="dropdown-item flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:bg-background hover:text-on-surface rounded-md transition-colors" onClick={onClose}>
        <FontAwesomeIcon icon={['fas', 'bookmark']} style={{ width: 14 }} /> Mes réservations
      </Link>
      <Link to="/parametres" className="dropdown-item flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:bg-background hover:text-on-surface rounded-md transition-colors" onClick={onClose}>
        <IconSettings size={14} /> Paramètres
      </Link>
      {user?.role === 'admin' && (
        <>
          <div className="h-px bg-outline my-1 mx-2" />
          <Link to="/admin/dashboard" className="dropdown-item flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:bg-background hover:text-on-surface rounded-md transition-colors" onClick={onClose}>
            <IconShield size={14} /> Dashboard admin
          </Link>
        </>
      )}
      <div className="h-px bg-outline my-1 mx-2" />
      <button className="dropdown-item flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-md transition-colors w-full text-left" onClick={() => { onClose(); logout?.(); }}>
        <IconSignOut size={14} /> Se déconnecter
      </button>
    </div>
  );
}
