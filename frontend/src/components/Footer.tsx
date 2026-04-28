/**
 * Footer.tsx — Footer modernisé
 * Palette Teal × Ambre · anime.js
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebook, faInstagram, faLinkedin, faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import {
  faEnvelope, faPhone, faMapMarkerAlt, faChevronUp,
  faShieldHalved, faLock, faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { animate } from 'animejs';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isAnimating,   setIsAnimating]   = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;
    animate(footer, { opacity: [0, 1], translateY: [20, 0], duration: 600, easing: 'easeOutExpo' });
  }, []);

  const scrollToTop = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsAnimating(false), 800);
  };

  // Si l'utilisateur est connecté, n'afficher que les annonces
  // Si pas connecté, afficher accueil et annonces
  const navLinks = user
    ? [
        { path: '/annonces', label: 'Annonces' },
      ]
    : [
        { path: '/',        label: 'Accueil'   },
        { path: '/annonces',label: 'Annonces'  },
      ];
  const authLinks = user ? [
    { path: `/profil/${user.id}`, label: 'Mon profil'        },
    { path: '/mes-reservations',  label: 'Mes réservations'  },
    { path: '/parametres',        label: 'Paramètres'        },
  ] : [
    { path: '/login',    label: 'Connexion'  },
    { path: '/register', label: "S'inscrire" },
  ];
  const legalLinks = [
    { path: '/cgu',              label: 'Conditions générales' },
    { path: '/confidentialite',  label: 'Confidentialité'      },
    { path: '/cookies',          label: 'Cookies'              },
  ];
  const socialLinks = [
    { icon: faFacebook,  label: 'Facebook',  href: 'https://facebook.com'  },
    { icon: faInstagram, label: 'Instagram', href: 'https://instagram.com' },
    { icon: faLinkedin,  label: 'LinkedIn',  href: 'https://linkedin.com'  },
    { icon: faTwitter,   label: 'Twitter',   href: 'https://twitter.com'   },
  ];

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-ambient" aria-hidden="true" />

      {/* ─ Section principale ─ */}
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <Link to="/" className="footer-logo" aria-label="Retour à l'accueil">
                <Logo size={38} />
              </Link>
              <p className="footer-tagline">ImmoSocial</p>
              <p className="footer-description">
                La plateforme de confiance pour connecter propriétaires et locataires.
                Trouvez votre logement idéal, rapidement.
              </p>
              <div className="footer-contact">
                <div className="contact-item">
                  <FontAwesomeIcon icon={faEnvelope} className="contact-icon" aria-hidden="true" />
                  <span>contact@immosocial.com</span>
                </div>
                <div className="contact-item">
                  <FontAwesomeIcon icon={faPhone} className="contact-icon" aria-hidden="true" />
                  <span>+261 20 00 000 00</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav aria-label="Navigation principale">
              <h3 className="footer-nav-title">Navigation</h3>
              <ul className="footer-nav-list">
                {navLinks.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className={`footer-nav-link ${location.pathname === item.path ? 'active' : ''}`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Mon compte */}
            <nav aria-label="Mon compte">
              <h3 className="footer-nav-title">{user ? 'Mon compte' : 'Accès'}</h3>
              <ul className="footer-nav-list">
                {authLinks.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="footer-nav-link">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Légal */}
            <nav aria-label="Informations légales">
              <h3 className="footer-nav-title">Légal</h3>
              <ul className="footer-nav-list">
                {legalLinks.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="footer-nav-link">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* ─ Section secondaire ─ */}
      <div className="footer-secondary">
        <div className="footer-container">
          <div className="footer-location">
            <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: 'var(--color-danger)', width: 13 }} aria-hidden="true" />
            <span>Madagascar</span>
          </div>

          <div className="footer-social">
            <span className="social-label">Suivez-nous :</span>
            <div className="social-links">
              {socialLinks.map((s) => (
                <a
                  key={s.label} href={s.href} className="social-link"
                  target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  onMouseEnter={(e) => animate(e.currentTarget, { translateY: -3, duration: 180, easing: 'easeOutQuad' })}
                  onMouseLeave={(e) => animate(e.currentTarget, { translateY: 0, duration: 180, easing: 'easeOutQuad' })}
                >
                  <FontAwesomeIcon icon={s.icon} />
                </a>
              ))}
            </div>
          </div>

          <div className="footer-security">
            <div className="security-badge">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>Plateforme sécurisée</span>
            </div>
            <div className="security-badge">
              <FontAwesomeIcon icon={faLock} />
              <span>Données protégées</span>
            </div>
            <div className="security-badge">
              <FontAwesomeIcon icon={faGlobe} />
              <span>Disponible partout</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─ Section inférieure ─ */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-copyright">
            © {currentYear} ImmoSocial. Tous droits réservés.
          </div>
          <div className="footer-lang">
            <button className="lang-btn active" aria-label="Français">FR</button>
            <button className="lang-btn" aria-label="English">EN</button>
          </div>
        </div>
      </div>

      {/* ─ Back to top ─ */}
      {showBackToTop && (
        <button
          className={`back-to-top ${isAnimating ? 'animating' : ''}`}
          onClick={scrollToTop}
          aria-label="Retour en haut"
          title="Retour en haut"
        >
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
      )}
    </footer>
  );
}
