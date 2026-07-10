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
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
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

  const mobileMoreItems: NavItem[] = [
    { path: '/notifications', icon: 'notifications', label: 'Notifications', badge: unreadNotifs },
    ...(isProprietaire ? [
      { path: '/mes-annonces', icon: 'storefront', label: 'Mes annonces' },
      { path: '/demandes-reservations', icon: 'check_circle', label: 'Demandes' },
    ] : []),
    ...(!isProprietaire && !isAdmin ? [
      { path: '/mes-reservations', icon: 'event_available', label: 'Reservations' },
    ] : []),
    ...bottomItems,
  ];

  const isRouteActive = (path: string) => (
    path === '/feed' ? location.pathname === '/feed' : location.pathname.startsWith(path)
  );

  const hasActiveMoreItem = mobileMoreItems.some((item) => isRouteActive(item.path));

  const handleLogout = () => {
    setMobileMoreOpen(false);
    logout();
    navigate('/');
  };

  useEffect(() => {
    setMobileMoreOpen(false);
  }, [location.pathname]);

  const avatarUrl = user?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || '') + '+' + (user?.nom || ''))}&background=2563eb&color=fff&bold=true`;

  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-background text-on-background h-screen flex overflow-hidden">
      
      {/* SideNavBar (Desktop) */}
      <nav className="hidden md:flex flex-col h-screen w-72 fixed left-0 top-0 bg-surface border-r border-outline shadow-sm transition-all duration-200 z-50">
        <div className="p-6 border-b border-outline flex flex-col items-start space-y-4">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight hover:opacity-80 transition-opacity">ImmoSocial</Link>
          <div className="flex items-center gap-3 w-full cursor-pointer hover:bg-background p-2 rounded-lg transition-colors border border-transparent hover:border-outline" onClick={() => navigate(`/profil/${user?.id}`)}>
            <img src={avatarUrl} alt="User Profile" className="w-10 h-10 rounded-full border border-outline object-cover" />
            <div className="overflow-hidden">
              <p className="text-sm text-on-surface font-semibold truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider truncate">{user?.role === 'PROPRIETAIRE' ? 'Propriétaire' : user?.role === 'ADMIN' ? 'Administrateur' : user?.role === 'SUPERADMIN' ? 'Superadmin' : 'Locataire'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full space-y-1 pt-6 overflow-y-auto px-4 pb-6 scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path) && item.path !== '/';
            const isActiveFeed = item.path === '/feed' && location.pathname === '/feed';
            const active = isActive || isActiveFeed;
            return (
              <Link key={item.path} to={item.path} className={`py-2.5 px-4 flex items-center justify-between rounded-md transition-colors ${active ? 'bg-primary text-on-primary font-medium' : 'text-on-surface-variant hover:bg-background hover:text-on-surface'}`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.badge != null && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-on-primary text-primary' : 'bg-primary text-on-primary'}`}>{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </Link>
            );
          })}

          <div className="mt-auto pt-6 space-y-1">
            {bottomItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
              <Link key={item.path} to={item.path} className={`py-2.5 px-4 flex items-center gap-3 rounded-md transition-colors ${active ? 'bg-primary text-on-primary font-medium' : 'text-on-surface-variant hover:bg-background hover:text-on-surface'}`}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )})}
            <button onClick={handleLogout} className="w-full py-2.5 px-4 flex items-center gap-3 rounded-md text-on-surface-variant hover:bg-background hover:text-error transition-colors">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-72 flex flex-col h-screen overflow-hidden bg-background">
        {/* Top Action Bar */}
        <header className="h-16 w-full px-6 flex justify-between items-center bg-surface/80 backdrop-blur-md border-b border-outline z-40 sticky top-0">
          <div className="flex-1 max-w-lg">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Rechercher des comptes, annonces..."
                className="form-input pl-10 rounded-full py-2"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <Link to="/notifications" className="w-10 h-10 rounded-full flex items-center justify-center bg-background border border-outline hover:bg-surface transition-colors text-on-surface relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadNotifs > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>}
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-8 p-4 md:p-8">
          {children}
        </div>
      </main>

      {mobileMoreOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="md:hidden fixed inset-0 bottom-16 z-40 bg-on-background/20 backdrop-blur-sm"
          onClick={() => setMobileMoreOpen(false)}
        />
      )}

      <div
        id="mobile-more-menu"
        className={`md:hidden fixed left-3 right-3 bottom-20 z-50 card transition-all duration-200 ${
          mobileMoreOpen
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between border-b border-outline px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-on-surface">Options</p>
            <p className="text-xs text-on-surface-variant">Acces rapide à votre espace</p>
          </div>
          <button
            type="button"
            aria-label="Fermer les options"
            className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-background hover:text-on-surface"
            onClick={() => setMobileMoreOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {mobileMoreItems.map((item) => {
            const active = isRouteActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between rounded-md px-3 py-2.5 transition-colors ${
                  active
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-background hover:text-on-surface'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                  <span className="truncate text-sm">{item.label}</span>
                </span>
                {item.badge != null && item.badge > 0 && (
                  <span className={`ml-3 rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? 'bg-on-primary text-primary' : 'bg-primary text-on-primary'}`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-on-surface-variant transition-colors hover:bg-background hover:text-error"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom NavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 z-50 h-16 w-full border-t border-outline bg-surface px-2">
        <div className="grid h-full grid-cols-5 items-center">
        <Link to="/feed" className={`flex flex-col items-center gap-1 ${location.pathname === '/feed' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>
          <span className="material-symbols-outlined text-[24px]" style={location.pathname === '/feed' ? { fontVariationSettings: "'FILL' 1" } : {}}>dynamic_feed</span>
          <span className="text-[10px] font-medium">Actualité</span>
        </Link>
        <Link to="/annonces" className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/annonces') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>
          <span className="material-symbols-outlined text-[24px]" style={location.pathname.startsWith('/annonces') ? { fontVariationSettings: "'FILL' 1" } : {}}>campaign</span>
          <span className="text-[10px] font-medium">Annonces</span>
        </Link>
        <Link to="/messages" className={`flex flex-col items-center gap-1 relative ${location.pathname.startsWith('/messages') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>
          <span className="material-symbols-outlined text-[24px]" style={location.pathname.startsWith('/messages') ? { fontVariationSettings: "'FILL' 1" } : {}}>forum</span>
          <span className="text-[10px] font-medium">Messages</span>
          {unreadMessages > 0 && <span className="absolute top-0 right-3 w-2 h-2 bg-error rounded-full"></span>}
        </Link>
        <Link to={`/profil/${user?.id}`} className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/profil') ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}>
          <span className="material-symbols-outlined text-[24px]" style={location.pathname.startsWith('/profil') ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
        <button
          type="button"
          aria-label="Afficher les autres options"
          aria-expanded={mobileMoreOpen ? "true" : "false"}
          aria-controls="mobile-more-menu"
          className={`relative flex flex-col items-center gap-1 ${mobileMoreOpen || hasActiveMoreItem ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'}`}
          onClick={() => setMobileMoreOpen((open) => !open)}
        >
          <span className="material-symbols-outlined text-[24px]" style={mobileMoreOpen || hasActiveMoreItem ? { fontVariationSettings: "'FILL' 1" } : {}}>apps</span>
          <span className="text-[10px] font-medium">Plus</span>
          {(unreadNotifs > 0 || hasActiveMoreItem) && (
            <span className="absolute top-0 right-4 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
        </div>
      </nav>
    </div>
  );
}
