import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
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
      <PublicNavbar />

      {/* Hero */}
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
      </section>

      <div className="public-main">
        {/* Feed public */}
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

          {annoncesFeed.map((annonce) => (
            <div key={annonce.id} style={{ marginBottom: '24px' }}>
              <AnnonceCard annonce={annonce} />
            </div>
          ))}

          {hasMore && !loading && (
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
              onClick={loadMore}>
              Charger plus
            </button>
          )}
          {loading && annoncesFeed.length > 0 && (
            <div className="feed-loading"><div className="spinner" /></div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="public-sidebar">
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

          {/* Removed mini annonces from sidebar since they are in the feed now */}
        </aside>
      </div>
    </div>
  );
}
