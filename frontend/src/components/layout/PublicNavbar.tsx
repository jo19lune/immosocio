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
    <nav className={`bg-surface/80 backdrop-blur-md border-b border-outline shadow-sm flex justify-between items-center w-full px-6 md:px-8 h-16 fixed top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface' : ''}`}>
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary hover:opacity-80 transition-opacity">ImmoSocial</Link>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/annonces" className={`px-3 py-1.5 text-sm rounded-md transition-colors ${location.pathname === '/annonces' ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface hover:bg-background'}`}>
            Annonces
          </Link>
          <Link to="/" className={`px-3 py-1.5 text-sm rounded-md transition-colors ${location.pathname === '/' ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface hover:bg-background'}`}>
            Communauté
          </Link>
        </div>
      </div>
      
      <div className="flex-1 max-w-md mx-6 hidden lg:block">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Rechercher des biens ou des membres..." 
            className="form-input pl-10 rounded-full py-2"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">
          Connexion
        </Link>
        <Link to="/register" className="btn btn-primary rounded-full px-6">
          S'inscrire
        </Link>
      </div>
    </nav>
  );
}
