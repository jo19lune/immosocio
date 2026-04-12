import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import './MesAnnoncesPage.css';

interface Annonce {
  id: number;
  titre: string;
  description: string;
  adresse: string;
  ville: string;
  pays: string;
  prix: number;
  nombrePieces: number;
  superficie: number;
  typeLogement: string;
  photos: string[];
  statut: string;
  dateCreation: string;
}

const typeLabels: Record<string, string> = {
  MAISON: '🏠 Maison',
  APPARTEMENT: '🏢 Appartement',
  STUDIO: '🏪 Studio',
  VILLA: '🏡 Villa',
  CHAMBRE: '🛏️ Chambre',
};

export default function MesAnnoncesPage() {
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMesAnnonces();
  }, []);

  const fetchMesAnnonces = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/annonces/mes-annonces?size=50');
      setAnnonces(data.content || []);
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/annonces/${id}`);
      setAnnonces((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Erreur lors de la suppression de l'annonce.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="mes-annonces-page">
        <div className="mes-annonces-header">
          <div>
            <h1 className="mes-annonces-title">Mes annonces</h1>
            <p className="mes-annonces-subtitle">
              {loading ? '…' : `${annonces.length} annonce${annonces.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link to="/mes-annonces/nouvelle" className="btn btn-accent">
            + Nouvelle annonce
          </Link>
        </div>

        {loading && (
          <div className="mes-annonces-loading">
            <div className="spinner" />
            <span>Chargement…</span>
          </div>
        )}

        {!loading && annonces.length === 0 && (
          <div className="mes-annonces-empty card">
            <span style={{ fontSize: 52 }}>🏚️</span>
            <p>Vous n'avez pas encore publié d'annonce.</p>
            <Link to="/mes-annonces/nouvelle" className="btn btn-primary">
              Publier ma première annonce
            </Link>
          </div>
        )}

        <div className="mes-annonces-list">
          {annonces.map((a) => {
            const img = a.photos?.[0];
            return (
              <div key={a.id} className="ma-card card">
                <div className="ma-card-img">
                  {img ? (
                    <img src={img} alt={a.titre} />
                  ) : (
                    <div className="ma-card-placeholder">🏠</div>
                  )}
                  <span className="ma-card-badge">
                    {typeLabels[a.typeLogement] || a.typeLogement}
                  </span>
                </div>

                <div className="ma-card-body">
                  <div className="ma-card-info">
                    <h3 className="ma-card-title">{a.titre}</h3>
                    <p className="ma-card-location">
                      📍 {a.ville}{a.pays ? `, ${a.pays}` : ''}
                    </p>
                    <div className="ma-card-meta">
                      {a.nombrePieces && (
                        <span>🛏 {a.nombrePieces} pièce{a.nombrePieces > 1 ? 's' : ''}</span>
                      )}
                      {a.superficie && <span>📐 {a.superficie} m²</span>}
                    </div>
                    <p className="ma-card-prix">
                      {Number(a.prix).toLocaleString('fr-FR')} Ar
                    </p>
                  </div>

                  <div className="ma-card-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/mes-annonces/${a.id}/modifier`)}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                    >
                      {deletingId === a.id ? '…' : '🗑 Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
