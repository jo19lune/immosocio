import { useEffect, useState } from 'react';

import api from '../lib/api';
import announcementLineSvg from '../assets/announcement_line.svg';
import checkFillSvg from '../assets/checkbox_circle_fill.svg';
import closeLineSvg from '../assets/close_line.svg';
import messengerLineSvg from '../assets/messenger_line.svg';
import { Link } from 'react-router-dom';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import '../styles/pages/MesAnnoncesPage.css';

interface Reservation {
  id: number;
  dateDebut: string;
  dateFin: string;
  statut: string;
  quantite: number;
  prixTotal: number;
  message: string;
  locataire: {
    id: number;
    nom: string;
    prenom: string;
    photo?: string;
  };
  annonce: {
    id: number;
    titre: string;
    ville: string;
  };
}

export default function ReservationDemandsPage() {
  const [demandes, setDemandes] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reservations/demandes');
      setDemandes(data.content || []);
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  useAutoRefresh(fetchDemandes);

  const handleAction = async (id: number, action: 'confirmer' | 'annuler') => {
    if (!window.confirm(`Voulez-vous vraiment ${action} cette demande ?`)) return;
    try {
      await api.patch(`/reservations/${id}/${action}`);
      fetchDemandes();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur lors de l'action");
    }
  };

  return (
    
      <div className="mes-annonces-page">
        <div className="mes-annonces-header">
          <div>
            <h1 className="mes-annonces-title">Demandes reçues</h1>
            <p className="mes-annonces-subtitle">
              {loading ? 'Chargement...' : `${demandes.length} demande(s) au total`}
            </p>
          </div>
        </div>

        {loading && (
          <div className="mes-annonces-loading">
            <div className="spinner" />
            <span>Chargement...</span>
          </div>
        )}

        {!loading && demandes.length === 0 && (
          <div className="mes-annonces-empty card">
            <img src={announcementLineSvg} alt="" width={56} height={56} style={{ opacity: 0.35, marginBottom: 12 }} />
            <p>Vous n'avez reçu aucune demande de réservation pour le moment.</p>
          </div>
        )}

        <div className="mes-annonces-list">
          {demandes.map((dem) => (
            <div key={dem.id} className="ma-card card" style={{ borderLeft: dem.statut === 'EN_ATTENTE' ? '4px solid var(--primary)' : 'none' }}>
              <div className="ma-card-body" style={{ paddingLeft: '20px' }}>
                <div className="ma-card-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <img 
                      src={dem.locataire.photo || `https://ui-avatars.com/api/?name=${dem.locataire.prenom}+${dem.locataire.nom}&background=random`} 
                      className="avatar" width={40} height={40} alt=""
                    />
                    <div>
                      <p style={{ fontWeight: 600 }}>{dem.locataire.prenom} {dem.locataire.nom}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Souhaiterait réserver : {dem.annonce.titre}</p>
                    </div>
                  </div>
                  
                  <p>📅 <strong>Période :</strong> Du {new Date(dem.dateDebut).toLocaleDateString()} au {new Date(dem.dateFin).toLocaleDateString()}</p>
                  <p>📦 <strong>Quantité :</strong> {dem.quantite} unité(s)</p>
                  <p>💰 <strong>Revenu potentiel :</strong> {Number(dem.prixTotal).toLocaleString('fr-FR')} Ar</p>
                  {dem.message && (
                    <div style={{ marginTop: 12, padding: '10px', backgroundColor: 'var(--surface-50)', borderRadius: '6px', fontSize: 13, fontStyle: 'italic' }}>
                      "{dem.message}"
                    </div>
                  )}
                  <div style={{ marginTop: 12 }}>
                    {dem.statut === 'CONFIRMEE' && <span className="badge badge-success">Confirmée</span>}
                    {dem.statut === 'ANNULEE' && <span className="badge badge-danger">Annulée</span>}
                    {dem.statut === 'EN_ATTENTE' && <span className="badge badge-primary">En attente</span>}
                  </div>
                </div>

                <div className="ma-card-actions" style={{ flexDirection: 'column', gap: 8 }}>
                  {dem.statut === 'EN_ATTENTE' && (
                    <>
                      <button className="btn btn-primary btn-sm" style={{ width: '100%', backgroundColor: 'var(--success)' }} onClick={() => handleAction(dem.id, 'confirmer')}>
                        <img src={checkFillSvg} width={14} style={{ filter: 'brightness(0) invert(1)' }} /> Confirmer
                      </button>
                      <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => handleAction(dem.id, 'annuler')}>
                        <img src={closeLineSvg} width={14} style={{ filter: 'brightness(0) invert(1)' }} /> Refuser
                      </button>
                    </>
                  )}
                  <Link to={`/messages/${dem.locataire.id}`} className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
                    <img src={messengerLineSvg} width={14} /> Discuter
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    
  );
}
