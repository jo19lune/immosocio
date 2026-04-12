import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import PublicationCard from '../components/publications/PublicationCard';
import CreatePublication from '../components/publications/CreatePublication';
import api from '../lib/api';
import './FeedPage.css';

export default function FeedPage() {
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPublications(0, true);
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

  const handleCreated = (pub: any) => {
    setPublications((prev) => [pub, ...prev]);
  };

  const handleDelete = (id: number) => {
    setPublications((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdate = (updated: any) => {
    setPublications((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPublications(next);
  };

  return (
    <AppLayout>
      <div className="feed-page">
        <CreatePublication onCreated={handleCreated} />

        {loading && publications.length === 0 && (
          <div className="feed-center">
            <div className="spinner" />
            <span>Chargement du fil…</span>
          </div>
        )}

        {!loading && publications.length === 0 && (
          <div className="feed-empty card">
            <span style={{ fontSize: 48 }}>📭</span>
            <p>Aucune publication pour le moment. Soyez le premier à partager !</p>
          </div>
        )}

        {publications.map((pub) => (
          <PublicationCard key={pub.id} publication={pub} onDelete={handleDelete} onUpdate={handleUpdate} />
        ))}

        {hasMore && !loading && (
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
            onClick={loadMore}>
            Charger plus
          </button>
        )}

        {loading && publications.length > 0 && (
          <div className="feed-center"><div className="spinner" /></div>
        )}
      </div>
    </AppLayout>
  );
}
