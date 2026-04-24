import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import homeLineSvg from '../assets/home_1_line.svg';
import closeLineSvg from '../assets/close_line.svg';
import '../styles/pages/MesAnnoncesPage.css'; // On peut réutiliser les styles ou en créer de nouveaux

interface Reservation {
  id: number;
  dateDebut: string;
  dateFin: string;
  statut: string;
  quantite: number;
  prixTotal: number;
  annonce: {
    id: number;
    titre: string;
    ville: string;
    photos: string[];
  };
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reservations/mes-reservations');
      setReservations(data.content || []);
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useAutoRefresh(fetchReservations);

  const handleCancel = async (id: number) => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    try {
      await api.patch(`/reservations/${id}/annuler`);
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'annulation");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMEE': return <span className="badge badge-success">Confirmée</span>;
      case 'ANNULEE': return <span className="badge badge-danger">Annulée</span>;
      case 'EN_ATTENTE': return <span className="badge badge-primary">En attente</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    
      <div className="mes-annonces-page">
        <div className="mes-annonces-header">
          <div>
            <h1 className="mes-annonces-title">Mes réservations</h1>
            <p className="mes-annonces-subtitle">
              {loading ? 'Chargement...' : `${reservations.length} réservation(s) effectuée(s)`}
            </p>
          </div>
        </div>

        {loading && (
          <div className="mes-annonces-loading">
            <div className="spinner" />
            <span>Chargement...</span>
          </div>
        )}

        {!loading && reservations.length === 0 && (
          <div className="mes-annonces-empty card">
            <img src={homeLineSvg} alt="" width={56} height={56} style={{ opacity: 0.35, marginBottom: 12 }} />
            <p>Vous n'avez pas encore effectué de réservation.</p>
            <Link to="/annonces" className="btn btn-primary">Découvrir les annonces</Link>
          </div>
        )}

        <div className="mes-annonces-list">
          {reservations.map((res) => {
            const img = res.annonce.photos?.[0];
            return (
              <div key={res.id} className="ma-card card">
                <div className="ma-card-img">
                  {img ? <img src={img} alt="" /> : <div className="ma-card-placeholder"><img src={homeLineSvg} width={32} style={{ opacity: 0.3 }} /></div>}
                </div>
                <div className="ma-card-body">
                  <div className="ma-card-info">
                    <h3 className="ma-card-title">{res.annonce.titre}</h3>
                    <p className="ma-card-location">
                      <img src={homeLineSvg} alt="" width={14} style={{ opacity: 0.5, marginRight: 6 }} />
                      {res.annonce.ville} | Du {new Date(res.dateDebut).toLocaleDateString()} au {new Date(res.dateFin).toLocaleDateString()}
                    </p>
                    <div className="ma-card-meta">
                      <span>📦 Quantité : {res.quantite}</span>
                      <span>💰 Total : {Number(res.prixTotal).toLocaleString('fr-FR')} Ar</span>
                    </div>
                    <div style={{ marginTop: 8 }}>{getStatusBadge(res.statut)}</div>
                  </div>
                  <div className="ma-card-actions">
                    {res.statut === 'EN_ATTENTE' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(res.id)}>
                        <img src={closeLineSvg} width={14} style={{ filter: 'brightness(0) invert(1)' }} /> Annuler
                      </button>
                    )}
                    <Link to={`/annonces`} className="btn btn-ghost btn-sm">Détails</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    
  );
}
