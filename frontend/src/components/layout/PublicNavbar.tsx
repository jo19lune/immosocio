import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Logo';
import menuLineSvg  from '../../assets/menu_line.svg';
import closeLineSvg from '../../assets/close_line.svg';
import userLineSvg  from '../../assets/user_1_line.svg';
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
          <Link to="/"         className="nav-link" onClick={() => setMenuOpen(false)}>Accueil</Link>
          <Link to="/annonces" className="nav-link" onClick={() => setMenuOpen(false)}>Annonces</Link>
          <Link to="/login" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>
            <img src={userLineSvg} alt="" width={16} height={16} style={{ marginRight: 4 }} />
            Connexion
          </Link>
          <button className="btn btn-primary btn-sm" onClick={() => { navigate('/register'); setMenuOpen(false); }}>
            S'inscrire
          </button>
        </div>

        <button className="public-nav-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <img src={menuOpen ? closeLineSvg : menuLineSvg} alt={menuOpen ? 'Fermer' : 'Menu'} width={22} height={22} />
        </button>
      </div>
    </nav>
  );
}
