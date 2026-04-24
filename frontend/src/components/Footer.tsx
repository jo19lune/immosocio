// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import {
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faChevronUp,
  faShieldHalved,
  faLock,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { animate } from 'animejs';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import '../styles/components/Footer.css';

/**
 * Footer principal - Respecte les règles IHM :
 * - Accessibilité (ARIA, contrastes, navigation clavier)
 * - Hiérarchie visuelle claire
 * - Feedback utilisateur immédiat
 * - Animations subtiles et performantes
 * - Responsive design
 */
export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    animate(footer, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      easing: 'easeOutExpo',
    });

    const navItems = footer.querySelectorAll('.footer-nav-link');
    if (navItems.length) {
      navItems.forEach((item, index) => {
        animate(item, {
          opacity: [0, 1],
          translateX: [-10, 0],
          delay: index * 50,
          duration: 400,
          easing: 'easeOutCubic',
        });
      });
    }
  }, []);

  const scrollToTop = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    animate(document.documentElement || document.body, {
      scrollTop: 0,
      duration: 800,
      easing: 'easeInOutQuart',
      complete: () => setIsAnimating(false),
    });
  };

  const mainNavItems = [
    { path: '/', label: 'Accueil' },
    { path: '/annonces', label: 'Annonces' },
    { path: '/apropos', label: 'À propos' },
    { path: '/contact', label: 'Contact' },
  ];

  const legalNavItems = [
    { path: '/cgu', label: 'CGU' },
    { path: '/cgu', label: 'Conditions générales' },
    { path: '/confidentialite', label: 'Confidentialité' },
    { path: '/cookies', label: 'Cookies' },
  ];

  const supportNavItems = [
    { path: '/aide', label: 'Aide' },
    { path: '/faq', label: 'FAQ' },
    { path: '/signaler', label: 'Signaler un abus' },
    ...(user ? [{ path: '/support', label: 'Support' }] : []),
  ];

  const socialLinks = [
    { icon: faFacebook, label: 'Facebook', href: 'https://facebook.com', ariaLabel: 'Facebook' },
    { icon: faInstagram, label: 'Instagram', href: 'https://instagram.com', ariaLabel: 'Instagram' },
    { icon: faLinkedin, label: 'LinkedIn', href: 'https://linkedin.com', ariaLabel: 'LinkedIn' },
    { icon: faTwitter, label: 'Twitter', href: 'https://twitter.com', ariaLabel: 'Twitter' },
  ];

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Accueil - Retour à la page d'accueil">
              <Logo size={40} />
            </Link>
            <p className="footer-description">
              Votre plateforme de confiance pour trouver des logements de qualité
              et connecter propriétaires et locataires.
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <FontAwesomeIcon icon={faEnvelope} className="contact-icon" aria-hidden="true" />
                <span>contact@plateforme.com</span>
              </div>
              <div className="contact-item">
                <FontAwesomeIcon icon={faPhone} className="contact-icon" aria-hidden="true" />
                <span>09 70 00 00 00</span>
              </div>
            </div>
          </div>

          <nav className="footer-nav" aria-label="Navigation principale">
            <h3 className="footer-nav-title">Navigation</h3>
            <ul className="footer-nav-list">
              {mainNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`footer-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-nav" aria-label="Informations légales">
            <h3 className="footer-nav-title">Légal</h3>
            <ul className="footer-nav-list">
              {legalNavItems.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="footer-nav-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer-nav" aria-label="Support">
            <h3 className="footer-nav-title">Support</h3>
            <ul className="footer-nav-list">
              {supportNavItems.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="footer-nav-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="footer-secondary">
        <div className="footer-container">
          <div className="footer-location">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="location-icon" aria-hidden="true" />
            <span>Paris, France</span>
          </div>

          <div className="footer-social">
            <span className="social-label">Suivez-nous :</span>
            <div className="social-links">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  onMouseEnter={(e) => {
                    animate(e.currentTarget, {
                      translateY: -3,
                      duration: 200,
                      easing: 'easeOutQuad',
                    });
                  }}
                  onMouseLeave={(e) => {
                    animate(e.currentTarget, {
                      translateY: 0,
                      duration: 200,
                      easing: 'easeOutQuad',
                    });
                  }}
                >
                  <FontAwesomeIcon icon={social.icon} />
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
              <span>Paiement sécurisé</span>
            </div>
            <div className="security-badge">
              <FontAwesomeIcon icon={faGlobe} />
              <span>Disponible partout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-copyright">
            <span>© {currentYear} Plateforme. Tous droits réservés.</span>
          </div>
          <div className="footer-lang">
            <button className="lang-btn active" aria-label="Français">FR</button>
            <button className="lang-btn" aria-label="English">EN</button>
            <button className="lang-btn" aria-label="Español">ES</button>
          </div>
        </div>
      </div>

      {showBackToTop && (
        <button
          className={`back-to-top ${isAnimating ? 'animating' : ''}`}
          onClick={scrollToTop}
          aria-label="Retour en haut de la page"
          title="Retour en haut"
        >
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
      )}
    </footer>
  );
}
