import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faBuilding,
  faUsers,
  faHandshake,
  faShield,
  faChevronRight,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';

import { AnnonceCard } from './AnnoncesPage';
import Logo from '../components/Logo';
import api from '../lib/api';
import announcementLineSvg from '../assets/announcement_line.svg';
import '../styles/pages/PublicFeedPage.css';

export default function PublicFeedPage() {
  const [annoncesFeed, setAnnoncesFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchAnnoncesFeed(0, true);
  }, []);

  const fetchAnnoncesFeed = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/annonces?page=${p}&size=10`);
      const items = data.content || [];
      setAnnoncesFeed((prev) => reset ? items : [...prev, ...items]);
      setHasMore(!data.last);
      setTotalElements(data.totalElements || items.length);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchAnnoncesFeed(next);
  };

  return (
    <div className="public-page">
      

      {/* Welcome/Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Logo size={20} showText={false} />
            <span>Plateforme Immobilière Sociale</span>
          </div>
          <h1 className="hero-title">
            Trouvez votre logement,<br />
            <span className="hero-title-accent">partagez votre expérience</span>
          </h1>
          <p className="hero-desc">
            Annonces, publications de la communauté, messagerie directe — tout pour faciliter
            votre recherche ou location.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Rejoindre gratuitement</Link>
            <Link to="/annonces" className="btn btn-ghost btn-lg">Voir les annonces</Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">{totalElements}+</span>
            <span className="stat-label">Annonces</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Utilisateurs</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Sécurisé</span>
          </div>
        </div>
      </section>

      <div className="public-main">
        {/* Feed public with pagination */}
        <div className="public-feed">
          <div className="feed-header">
            <h2 className="feed-title">Dernières annonces</h2>
            <span className="badge badge-primary">Public</span>
          </div>

          {loading && annoncesFeed.length === 0 && (
            <div className="feed-loading">
              <div className="spinner" />
              <span>Chargement…</span>
            </div>
          )}

          {!loading && annoncesFeed.length === 0 && (
            <div className="feed-empty card">
              <img src={announcementLineSvg} alt="Aucune annonce" width={52} height={52} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p>Aucune annonce pour le moment.</p>
            </div>
          )}

          <div className="annonces-list">
            {annoncesFeed.map((annonce) => (
              <div key={annonce.id} style={{ marginBottom: '24px' }}>
                <AnnonceCard annonce={annonce} />
              </div>
            ))}
          </div>

          {hasMore && !loading && (
            <button 
              className="btn btn-ghost load-more-btn" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={loadMore}>
              <FontAwesomeIcon icon={faChevronDown} style={{ marginRight: 8 }} />
              Charger plus d'annonces
            </button>
          )}
          {loading && annoncesFeed.length > 0 && (
            <div className="feed-loading"><div className="spinner" /></div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="public-sidebar">
          {/* Navigation */}
          <div className="sidebar-nav card">
            <Link to="/annonces" className="sidebar-link">
              <FontAwesomeIcon icon={faHome} />
              <span>Toutes les annonces</span>
              <FontAwesomeIcon icon={faChevronRight} className="chevron" />
            </Link>
            <Link to="/utilisateurs" className="sidebar-link">
              <FontAwesomeIcon icon={faUsers} />
              <span>Propriétaires</span>
              <FontAwesomeIcon icon={faChevronRight} className="chevron" />
            </Link>
          </div>

          {/* CTA connexion */}
          <div className="sidebar-cta card">
            <h3>Rejoindre la communauté</h3>
            <p>Créez un compte gratuit pour publier, commenter, envoyer des messages et plus encore.</p>
            <Link to="/register" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              S'inscrire
            </Link>
            <Link to="/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              Se connecter
            </Link>
          </div>
        </aside>
      </div>

      {/* About Section */}
      <section className="about-section">
        <div className="about-content">
          <h2 className="about-title">À propos de l'application</h2>
          <p className="about-desc">
            Notre plateforme facilite la recherche et la publication d'annonces immobilières pour les étudiants et les propriétaires.
            Nous offering une solution complète pour la gestion des locations, réservations et communications.
          </p>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faBuilding} />
              </div>
              <h3>Annonces</h3>
              <p>Publiez et consultez des annonces de logement facilement.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faHandshake} />
              </div>
              <h3>Réservations</h3>
              <p>Gérez vos réservations en toute simplicité.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <FontAwesomeIcon icon={faShield} />
              </div>
              <h3>Sécurité</h3>
              <p>Vos données et transactions sont protégées.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      
    </div>
  );
}