import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import PublicationCard from '../components/publications/PublicationCard';
import api from '../lib/api';
import './PublicFeedPage.css';

export default function PublicFeedPage() {
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [annonces, setAnnonces] = useState<any[]>([]);

  useEffect(() => {
    fetchPublications(0, true);
    fetchAnnonces();
  }, []);

  const fetchPublications = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/publications?page=${p}&size=10`);
      const items = data.content || [];
      setPublications((prev) => reset ? items : [...prev, ...items]);
      setHasMore(!data.last);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const fetchAnnonces = async () => {
    try {
      const { data } = await api.get('/annonces?page=0&size=4');
      setAnnonces(data.content || []);
    } catch { /* silencieux */ }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPublications(next);
  };

  return (
    <div className="public-page">
      <PublicNavbar />

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🏡 Plateforme Immobilière Sociale</div>
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
            <h2 className="feed-title">Publications récentes</h2>
            <span className="badge badge-primary">Public</span>
          </div>

          {loading && publications.length === 0 && (
            <div className="feed-loading">
              <div className="spinner" />
              <span>Chargement…</span>
            </div>
          )}

          {!loading && publications.length === 0 && (
            <div className="feed-empty card">
              <span style={{ fontSize: 48 }}>📭</span>
              <p>Aucune publication pour le moment.</p>
            </div>
          )}

          {publications.map((pub) => (
            <PublicationCard key={pub.id} publication={pub} />
          ))}

          {hasMore && !loading && (
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
              onClick={loadMore}>
              Charger plus
            </button>
          )}
          {loading && publications.length > 0 && (
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

          {/* Annonces récentes */}
          {annonces.length > 0 && (
            <div className="sidebar-annonces card">
              <h3 className="sidebar-section-title">Annonces récentes 🏘️</h3>
              {annonces.map((a) => (
                <Link key={a.id} to="/annonces" className="annonce-mini">
                  <div className="annonce-mini-img">
                    {a.photos?.[0] ? (
                      <img src={a.photos[0]} alt={a.titre} />
                    ) : (
                      <span>🏠</span>
                    )}
                  </div>
                  <div className="annonce-mini-info">
                    <strong>{a.titre}</strong>
                    <span>{a.ville} · {Number(a.prix).toLocaleString('fr-FR')} Ar</span>
                  </div>
                </Link>
              ))}
              <Link to="/annonces" className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                Voir toutes les annonces
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
