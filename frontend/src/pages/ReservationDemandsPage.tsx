import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import announcementLineSvg from '../assets/announcement_line.svg';
import checkFillSvg from '../assets/checkbox_circle_fill.svg';
import closeLineSvg from '../assets/close_line.svg';
import messengerLineSvg from '../assets/messenger_line.svg';
import { Link } from 'react-router-dom';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMEE': return <span className="bg-success/20 text-success border border-success/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Confirmée</span>;
      case 'ANNULEE': return <span className="bg-error/20 text-error border border-error/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Refusée</span>;
      case 'EN_ATTENTE': return <span className="bg-primary-container/20 text-primary-container border border-primary-container/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Nouvelle demande</span>;
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
            Demandes reçues
          </h1>
          <p className="text-outline-variant mt-2">
            {loading ? 'Chargement...' : `${demandes.length} demande(s) au total`}
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
            <span className="mt-4 text-outline font-medium">Chargement des demandes...</span>
          </div>
        )}

        {!loading && demandes.length === 0 && (
          <div className="glass-card flex flex-col items-center justify-center py-20 px-4 text-center max-w-2xl mx-auto mt-12 border-dashed border-2 border-surface-variant">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
              <img src={announcementLineSvg} alt="" className="w-10 h-10 opacity-50 filter-invert" />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Aucune demande reçue</h2>
            <p className="text-outline max-w-md">Vous n'avez reçu aucune demande de réservation pour vos biens immobiliers pour le moment.</p>
          </div>
        )}

        <div className="space-y-4">
          {demandes.map((dem) => (
            <div key={dem.id} className={`glass-card flex flex-col md:flex-row overflow-hidden hover:border-outline-variant transition-all group border-l-4 ${getBorderColor(dem.statut)}`}>
              <div className="flex-1 flex flex-col p-2">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={dem.locataire.photo || `https://ui-avatars.com/api/?name=${dem.locataire.prenom}+${dem.locataire.nom}&background=random`} 
                      className="w-12 h-12 rounded-full border-2 border-surface-variant object-cover" 
                      alt=""
                    />
                    <div>
                      <p className="font-bold text-on-surface text-lg leading-tight">{dem.locataire.prenom} {dem.locataire.nom}</p>
                      <p className="text-sm text-outline-variant mt-0.5">Veut réserver : <span className="font-medium text-outline">{dem.annonce.titre}</span></p>
                    </div>
                  </div>
                  <div className="shrink-0 hidden sm:block">
                    {getStatusBadge(dem.statut)}
                  </div>
                </div>
                
                <div className="sm:hidden mb-4">
                  {getStatusBadge(dem.statut)}
                </div>
                
                <div className="bg-surface-container-low rounded-xl border border-surface-variant/50 p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-outline-variant mb-1 uppercase tracking-wider font-bold">Période</p>
                    <p className="text-sm text-on-surface font-medium">{new Date(dem.dateDebut).toLocaleDateString()} <span className="text-outline mx-1">au</span> {new Date(dem.dateFin).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-outline-variant mb-1 uppercase tracking-wider font-bold">Détails financiers</p>
                    <p className="text-sm font-medium">
                      <span className="text-on-surface">{dem.quantite} unité(s)</span>
                      <span className="text-outline mx-2">•</span>
                      <span className="text-primary-container font-bold">{Number(dem.prixTotal).toLocaleString('fr-FR')} Ar</span>
                    </p>
                  </div>
                </div>
                
                {dem.message && (
                  <div className="bg-surface-container-high/40 rounded-xl p-4 border border-surface-variant relative mt-auto">
                    <div className="absolute top-2 left-2 text-2xl text-surface-variant leading-none">"</div>
                    <p className="text-sm italic text-outline relative z-10 pl-4">{dem.message}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-row md:flex-col gap-3 p-2 md:w-48 shrink-0 md:border-l border-surface-variant/50 md:pl-6 mt-4 md:mt-0 justify-center">
                {dem.statut === 'EN_ATTENTE' && (
                  <>
                    <button 
                      className="bg-success hover:bg-success/90 text-on-primary font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-success/20 flex-1 md:flex-none" 
                      onClick={() => handleAction(dem.id, 'confirmer')}
                    >
                      <img src={checkFillSvg} className="w-4 h-4 filter-invert" /> 
                      Confirmer
                    </button>
                    <button 
                      className="bg-error/10 hover:bg-error/20 text-error font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-error/20 flex-1 md:flex-none" 
                      onClick={() => handleAction(dem.id, 'annuler')}
                    >
                      <img src={closeLineSvg} className="w-4 h-4 filter-invert" style={{ filter: 'brightness(0) saturate(100%) invert(43%) sepia(87%) saturate(2256%) hue-rotate(334deg) brightness(100%) contrast(97%)' }} /> 
                      Refuser
                    </button>
                  </>
                )}
                <Link 
                  to={`/messages/${dem.locataire.id}`} 
                  className="bg-surface-variant hover:bg-surface-container-high text-on-surface font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-transparent flex-1 md:flex-none md:mt-auto"
                >
                  <img src={messengerLineSvg} className="w-4 h-4 filter-invert opacity-70" /> 
                  Discuter
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
