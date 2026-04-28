import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { onNotification } from '../../lib/websocket';
import { emitAppRefresh, getRefreshScopesFromPayload } from '../../lib/appEvents';
import api from '../../lib/api';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  badge?: number;
  section?: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    const fetchCounts = async () => {
      try {
        const [n, m] = await Promise.all([
          api.get('/notifications/count', { signal: controller.signal }),
          api.get('/messages/non-lus',    { signal: controller.signal }),
        ]);
        setUnreadNotifs(n.data.nonLues ?? 0);
        setUnreadMessages(m.data.nonLus ?? 0);
      } catch (err: any) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      }
    };

    fetchCounts();
    intervalRef.current = setInterval(fetchCounts, 30_000);

    const unsub = onNotification((data) => {
      fetchCounts();
      emitAppRefresh(getRefreshScopesFromPayload(data), { source: 'websocket', payload: data });
    });

    return () => {
      controller.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
      unsub();
    };
  }, [user]);

  const isProprietaire = user?.role === 'PROPRIETAIRE';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const navItems: NavItem[] = [
    { path: '/feed', icon: 'dynamic_feed', label: 'Fil d\'actualité', section: 'principal' },
    { path: '/annonces', icon: 'campaign', label: 'Annonces', section: 'principal' },
    ...(isProprietaire ? [
      { path: '/mes-annonces', icon: 'storefront', label: 'Mes annonces', section: 'proprietaire' },
      { path: '/demandes-reservations', icon: 'check_circle', label: 'Demandes', section: 'proprietaire' },
    ] : []),
    ...(!isProprietaire && !isAdmin ? [
      { path: '/mes-reservations', icon: 'event_available', label: 'Réservations', section: 'locataire' },
    ] : []),
    { path: '/messages', icon: 'forum', label: 'Messages', badge: unreadMessages, section: 'communication' },
    { path: '/notifications', icon: 'notifications', label: 'Notifications', badge: unreadNotifs, section: 'communication' },
  ];

  const bottomItems: NavItem[] = [
    { path: '/parametres', icon: 'settings', label: 'Paramètres' },
    ...(isAdmin ? [
      { path: '/admin/dashboard', icon: 'shield_person', label: 'Panneau Admin' },
    ] : []),
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  const avatarUrl = user?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || '') + '+' + (user?.nom || ''))}&background=fabd00&color=000&bold=true`;

  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container transition-colors duration-300">
      
      {/* SideNavBar (Desktop) */}
      <nav className="hidden md:flex flex-col h-screen w-72 fixed left-0 top-0 bg-surface-container-low border-r border-surface-variant shadow-none transition-all duration-200 z-50">
        <div className="p-8 border-b border-surface-variant/50 flex flex-col items-start space-y-4">
          <Link to="/" className="text-xl font-bold text-primary-fixed-dim font-h1 text-h1 tracking-tight hover:opacity-80 transition-opacity">ImmoSocial</Link>
          <div className="flex items-center gap-4 w-full cursor-pointer hover:bg-surface-variant/30 p-2 -ml-2 rounded-lg transition-colors" onClick={() => navigate(`/profil/${user?.id}`)}>
            <img src={avatarUrl} alt="User Profile" className="w-12 h-12 rounded-full border-2 border-surface-container-highest object-cover" />
            <div className="overflow-hidden">
              <p className="font-body-md text-body-md text-on-surface font-semibold truncate">{user?.prenom} {user?.nom}</p>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider truncate">{user?.role === 'PROPRIETAIRE' ? 'Propriétaire' : user?.role === 'ADMIN' ? 'Administrateur' : user?.role === 'SUPERADMIN' ? 'Superadmin' : 'Locataire'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full space-y-2 pt-8 overflow-y-auto px-0 pb-8 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path) && item.path !== '/';
            const isActiveFeed = item.path === '/feed' && location.pathname === '/feed';
            const active = isActive || isActiveFeed;
            return (
              <Link key={item.path} to={item.path} className={`py-3 px-6 flex items-center justify-between border-l-4 transition-all duration-300 ${active ? 'border-primary-fixed-dim bg-primary-fixed-dim/5 text-primary-fixed-dim hover:bg-surface-variant/50' : 'text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface'}`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                  <span className="font-h3 text-sm font-semibold">{item.label}</span>
                </div>
                {item.badge != null && item.badge > 0 && (
                  <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </Link>
            );
          })}

          <div className="mt-auto pt-8 space-y-2 pb-2">
            {bottomItems.map((item) => (
              <Link key={item.path} to={item.path} className={`py-3 px-6 flex items-center gap-3 border-l-4 border-transparent text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface transition-colors ${location.pathname.startsWith(item.path) ? 'text-primary-fixed-dim bg-surface-variant/20 border-primary-fixed-dim' : ''}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-h3 text-sm font-semibold">{item.label}</span>
              </Link>
            ))}
            <button onClick={handleLogout} className="w-full py-3 px-6 flex items-center gap-3 border-l-4 border-transparent text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-colors">
              <span className="material-symbols-outlined">logout</span>
              <span className="font-h3 text-sm font-semibold">Déconnexion</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-72 flex flex-col h-screen overflow-hidden bg-background">
        {/* Top Action Bar */}
        <header className="h-20 w-full px-lg flex justify-between items-center bg-surface/80 backdrop-blur-xl border-b border-surface-container-highest z-40 sticky top-0">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Rechercher des comptes, annonces..."
                className="w-full bg-surface-container-low border border-surface-variant rounded-full py-3 pl-12 pr-4 text-body-md font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <Link to="/notifications" className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface relative">
              <span className="material-symbols-outlined">notifications</span>
              {unreadNotifs > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>}
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-lg">
          {children}
        </div>
      </main>

      {/* Mobile Bottom NavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-xl border-t border-surface-container-highest z-50 h-16 flex justify-around items-center px-4">
        <Link to="/feed" className={`flex flex-col items-center gap-1 ${location.pathname === '/feed' ? 'text-primary-fixed-dim' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>
          <span className="material-symbols-outlined" style={location.pathname === '/feed' ? { fontVariationSettings: "'FILL' 1" } : {}}>dynamic_feed</span>
          <span className="font-label-caps text-[10px]">Actualité</span>
        </Link>
        <Link to="/annonces" className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/annonces') ? 'text-primary-fixed-dim' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>
          <span className="material-symbols-outlined" style={location.pathname.startsWith('/annonces') ? { fontVariationSettings: "'FILL' 1" } : {}}>campaign</span>
          <span className="font-label-caps text-[10px]">Annonces</span>
        </Link>
        <Link to="/messages" className={`flex flex-col items-center gap-1 relative ${location.pathname.startsWith('/messages') ? 'text-primary-fixed-dim' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>
          <span className="material-symbols-outlined" style={location.pathname.startsWith('/messages') ? { fontVariationSettings: "'FILL' 1" } : {}}>forum</span>
          <span className="font-label-caps text-[10px]">Messages</span>
          {unreadMessages > 0 && <span className="absolute top-0 right-1 w-2 h-2 bg-error rounded-full"></span>}
        </Link>
        <Link to={`/profil/${user?.id}`} className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/profil') ? 'text-primary-fixed-dim' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>
          <span className="material-symbols-outlined" style={location.pathname.startsWith('/profil') ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          <span className="font-label-caps text-[10px]">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
