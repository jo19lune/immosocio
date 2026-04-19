import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { AnnonceCard } from './AnnoncesPage';
import api from '../lib/api';
import './FeedPage.css';

export default function FeedPage() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchAnnonces(0, true);
  }, []);

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

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchAnnonces(next);
  };

  return (
    <AppLayout>
      <div className="feed-page" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '20px' }}>
        <h1 style={{ marginBottom: '24px', fontSize: '28px', color: 'var(--text-primary)' }}>Nouveautés Immobilières</h1>

        {loading && annonces.length === 0 && (
          <div className="feed-center">
            <div className="spinner" />
            <span>Chargement du fil…</span>
          </div>
        )}

        {!loading && annonces.length === 0 && (
          <div className="feed-empty card">
            <span style={{ fontSize: 48 }}>📭</span>
            <p>Aucune annonce pour le moment. Soyez le premier à en publier !</p>
          </div>
        )}

        {annonces.map((annonce) => (
          <div key={annonce.id} style={{ marginBottom: '24px' }}>
            <AnnonceCard annonce={annonce} />
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
