import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PublicNavbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`bg-surface-container/60 backdrop-blur-xl border-b border-surface-variant/50 shadow-2xl flex justify-between items-center w-full px-8 h-20 fixed top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface-container/90' : ''}`}>
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-h1 tracking-tight text-primary-fixed-dim hover:text-primary-container transition-colors">ImmoSocial</Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/annonces" className={`font-body-md font-bold duration-300 ease-in-out active:scale-95 ${location.pathname === '/annonces' ? 'text-primary-fixed-dim border-b-2 border-primary-fixed-dim pb-1' : 'text-on-surface-variant hover:text-primary-fixed-dim hover:bg-surface-variant/40 px-3 py-1 rounded-md'}`}>
            Annonces
          </Link>
          <Link to="/" className={`font-body-md font-bold duration-300 ease-in-out active:scale-95 ${location.pathname === '/' ? 'text-primary-fixed-dim border-b-2 border-primary-fixed-dim pb-1' : 'text-on-surface-variant hover:text-primary-fixed-dim hover:bg-surface-variant/40 px-3 py-1 rounded-md'}`}>
            Communauté
          </Link>
        </div>
      </div>
      
      <div className="flex-1 max-w-md mx-6 hidden lg:block">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input 
            type="text" 
            placeholder="Rechercher des biens ou des membres..." 
            className="w-full bg-surface-container border border-surface-variant rounded-full py-2 pl-10 pr-4 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-on-surface font-body-md text-body-md hover:text-primary-fixed-dim transition-colors hidden sm:block">
          Connexion
        </Link>
        <Link to="/register" className="bg-primary-container text-on-primary-container font-body-md text-body-md px-6 py-2 rounded-full font-bold hover:bg-primary-fixed transition-colors duration-300 active:scale-95">
          S'inscrire
        </Link>
      </div>
    </nav>
  );
}
