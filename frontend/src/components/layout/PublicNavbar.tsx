import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Logo';
import './PublicNavbar.css';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="public-nav">
      <div className="public-nav-inner">
        <Link to="/" className="public-nav-logo">
          <Logo size={30} />
        </Link>
        <div className={`public-nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Accueil</Link>
          <Link to="/annonces" className="nav-link" onClick={() => setMenuOpen(false)}>Annonces</Link>
          <Link to="/login" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>Connexion</Link>
          <button className="btn btn-primary btn-sm" onClick={() => { navigate('/register'); setMenuOpen(false); }}>
            S'inscrire
          </button>
        </div>

        <button className="public-nav-burger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
