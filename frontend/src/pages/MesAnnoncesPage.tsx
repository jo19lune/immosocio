import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import homeLineSvg from '../assets/home_1_line.svg';
import announcementLineSvg from '../assets/announcement_line.svg';
import settingsLineSvg from '../assets/settings_1_line.svg';
import closeLineSvg from '../assets/close_line.svg';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
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
  MAISON:       'Maison',
  APPARTEMENT:  'Appartement',
  STUDIO:       'Studio',
  VILLA:        'Villa',
  CHAMBRE:      'Chambre',
};

export default function MesAnnoncesPage() {
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  useEffect(() => {
    fetchMesAnnonces();
  }, []);

  useAutoRefresh(fetchMesAnnonces);

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
            <img src={announcementLineSvg} alt="" width={56} height={56} style={{ opacity: 0.35, marginBottom: 12 }} />
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
                    <div className="ma-card-placeholder">
                      <img src={homeLineSvg} alt="" width={32} height={32} style={{ opacity: 0.3 }} />
                    </div>
                  )}
                  <span className="ma-card-badge">
                    {typeLabels[a.typeLogement] || a.typeLogement}
                  </span>
                  {a.statut !== 'DISPONIBLE' && (
                    <span className="badge badge-danger" style={{ position: 'absolute', top: 4, left: 4 }}>
                      {a.statut}
                    </span>
                  )}
                </div>

                <div className="ma-card-body">
                    <div className="ma-card-info">
                      <h3 className="ma-card-title">{a.titre}</h3>
                      <p className="ma-card-location">
                        <img src={homeLineSvg} alt="" width={14} style={{ opacity: 0.5, marginRight: 6 }} />
                        {a.ville}{a.pays ? `, ${a.pays}` : ''}
                      </p>
                      <div className="ma-card-meta">
                        {a.nombrePieces && (
                          <span>
                            <img src={homeLineSvg} alt="" width={14} style={{ opacity: 0.5, marginRight: 4 }} />
                            {a.nombrePieces} pièce{a.nombrePieces > 1 ? 's' : ''}
                          </span>
                        )}
                        {a.superficie && (
                          <span>
                            <img src={homeLineSvg} alt="" width={14} style={{ opacity: 0.5, marginRight: 4 }} />
                            {a.superficie} m²
                          </span>
                        )}
                      </div>
                      <p className="ma-card-prix">
                        {Number(a.prix).toLocaleString('fr-FR')} Ar
                      </p>
                    </div>

                  <div className="ma-card-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/mes-annonces/${a.id}/modifier`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <img src={settingsLineSvg} alt="" width={14} height={14} /> Modifier
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {deletingId === a.id ? '…' : (
                        <><img src={closeLineSvg} alt="" width={14} height={14} style={{ filter: 'brightness(0) invert(1)' }} /> Supprimer</>
                      )}
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
