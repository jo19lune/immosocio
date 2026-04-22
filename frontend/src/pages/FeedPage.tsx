import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { AnnonceCard } from './AnnoncesPage';
import api from '../lib/api';
import announcementLineSvg from '../assets/announcement_line.svg';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import '../styles/pages/FeedPage.css';

export default function FeedPage() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchAnnonces = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/annonces?page=${p}&size=10`);
      const items = data.content || [];
      setAnnonces((prev) => reset ? items : [...prev, ...items]);
      setHasMore(!data.last);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const fetchPosts = () => fetchAnnonces(0, true);

  useEffect(() => {
    fetchPosts();
  }, []);

  useAutoRefresh(fetchPosts, ['annonces']);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchAnnonces(next);
  };

  return (
    <AppLayout>
      <div className="feed-page">
        <h1 className="feed-title">Découvrir les nouveautés</h1>

        {loading && annonces.length === 0 && (
          <div className="feed-center">
            <div className="spinner" />
            <span>Chargement du fil…</span>
          </div>
        )}

        {!loading && annonces.length === 0 && (
          <div className="feed-empty card">
            <img src={announcementLineSvg} alt="Fil vide" width={64} height={64} />
            <h3>Rien à voir ici</h3>
            <p>Aucune annonce pour le moment. Soyez le premier à en publier !</p>
          </div>
        )}

        {annonces.map((annonce) => (
          <div key={annonce.id} className="feed-item-wrapper">
            <AnnonceCard annonce={annonce} onToggleSuivre={fetchPosts} />
          </div>
        ))}

        {hasMore && !loading && (
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
            onClick={loadMore}>
            Charger plus d'annonces
          </button>
        )}

        {loading && annonces.length > 0 && (
          <div className="feed-center"><div className="spinner" /></div>
        )}
      </div>
    </AppLayout>
  );
}
