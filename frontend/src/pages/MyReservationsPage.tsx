import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import homeLineSvg from '../assets/home_1_line.svg';
import closeLineSvg from '../assets/close_line.svg';

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
      case 'CONFIRMEE': return <span className="bg-success/20 text-success border border-success/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Confirmée</span>;
      case 'ANNULEE': return <span className="bg-error/20 text-error border border-error/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Annulée</span>;
      case 'EN_ATTENTE': return <span className="bg-primary-container/20 text-primary-container border border-primary-container/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">En attente</span>;
      default: return <span className="bg-surface-variant text-on-surface border border-outline px-3 py-1 rounded-full text-xs font-bold shadow-sm">{status}</span>;
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'CONFIRMEE': return 'border-l-success';
      case 'ANNULEE': return 'border-l-error';
      case 'EN_ATTENTE': return 'border-l-primary-container';
      default: return 'border-l-surface-variant';
    }
  };

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-white">
            Mes réservations
          </h1>
          <p className="text-outline-variant mt-2">
            {loading ? 'Chargement...' : `${reservations.length} réservation(s) effectuée(s)`}
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
            <span className="mt-4 text-outline font-medium">Chargement de vos réservations...</span>
          </div>
        )}

        {!loading && reservations.length === 0 && (
          <div className="glass-card flex flex-col items-center justify-center py-20 px-4 text-center max-w-2xl mx-auto mt-12 border-dashed border-2 border-surface-variant">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
              <img src={homeLineSvg} alt="" className="w-10 h-10 opacity-50 filter-invert" />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Aucune réservation</h2>
            <p className="text-outline mb-8 max-w-md">Vous n'avez pas encore effectué de réservation. Explorez les annonces disponibles.</p>
            <Link to="/annonces" className="bg-primary hover:bg-primary-container text-on-primary font-medium px-8 py-3 rounded-full transition-colors">
              Découvrir les annonces
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {reservations.map((res) => {
            const img = res.annonce.photos?.[0];
            return (
              <div key={res.id} className={`glass-card flex flex-col sm:flex-row overflow-hidden hover:border-outline transition-all group p-0 border-l-4 ${getBorderColor(res.statut)}`}>
                <div className="sm:w-48 h-48 sm:h-auto shrink-0 relative bg-surface-container-high overflow-hidden">
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src={homeLineSvg} className="w-12 h-12 opacity-20 filter-invert" />
                    </div>
                  )}
                  {/* Overlay for mobile readability if needed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 sm:hidden"></div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-xl font-bold text-on-surface line-clamp-1" title={res.annonce.titre}>
                      {res.annonce.titre}
                    </h3>
                    <div className="shrink-0">{getStatusBadge(res.statut)}</div>
                  </div>
                  
                  <p className="flex items-center text-sm text-outline-variant mb-4">
                    <img src={homeLineSvg} alt="" className="w-4 h-4 opacity-50 filter-invert mr-2" />
                    {res.annonce.ville} | Du <span className="text-on-surface ml-1">{new Date(res.dateDebut).toLocaleDateString()}</span> <span className="mx-1">au</span> <span className="text-on-surface">{new Date(res.dateFin).toLocaleDateString()}</span>
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mt-auto mb-4 bg-surface-container-low p-3 rounded-xl border border-surface-variant/50">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">📦</span>
                      <span className="text-sm text-outline">Quantité: <span className="font-bold text-on-surface">{res.quantite}</span></span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xl mr-2">💰</span>
                      <span className="text-sm text-outline">Total: <span className="font-bold text-primary-container">{Number(res.prixTotal).toLocaleString('fr-FR')} Ar</span></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 mt-2">
                    {res.statut === 'EN_ATTENTE' && (
                      <button 
                        className="bg-error/10 hover:bg-error/20 text-error font-medium px-4 py-2 rounded-full transition-colors flex items-center gap-2 text-sm border border-error/20" 
                        onClick={() => handleCancel(res.id)}
                      >
                        <img src={closeLineSvg} className="w-4 h-4 filter-invert" style={{ filter: 'brightness(0) saturate(100%) invert(43%) sepia(87%) saturate(2256%) hue-rotate(334deg) brightness(100%) contrast(97%)' }} /> 
                        Annuler
                      </button>
                    )}
                    <Link to={`/annonces`} className="bg-surface-variant hover:bg-surface-container-high text-on-surface font-medium px-4 py-2 rounded-full transition-colors text-sm border border-transparent">
                      Détails de l'annonce
                    </Link>
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
