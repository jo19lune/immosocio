import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

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
  MAISON: 'Maison',
  APPARTEMENT: 'Appartement',
  STUDIO: 'Studio',
  VILLA: 'Villa',
  CHAMBRE: 'Chambre',
};

const statutStyles: Record<string, string> = {
  DISPONIBLE: 'bg-green-500/20 text-green-400 border-green-500/30',
  RESERVE: 'bg-primary-fixed-dim/20 text-primary-fixed-dim border-primary-fixed-dim/30',
  LOUE: 'bg-on-surface-variant/20 text-on-surface-variant border-on-surface-variant/30',
  SUSPENDU: 'bg-error/20 text-error border-error/30',
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
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface mb-1">Mes annonces</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {loading
                ? 'Chargement...'
                : `${annonces.length} annonce${annonces.length !== 1 ? 's' : ''} au total`}
            </p>
          </div>
          <Link
            to="/mes-annonces/nouvelle"
            className="flex items-center gap-2 bg-primary-fixed-dim text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary-fixed-dim/20"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nouvelle annonce
          </Link>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-container-low border border-surface-variant rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-surface-variant" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-surface-variant rounded w-3/4" />
                  <div className="h-4 bg-surface-variant rounded w-1/2" />
                  <div className="h-8 bg-surface-variant rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && annonces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-surface-container-low border border-surface-variant rounded-2xl">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 border border-surface-variant">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant opacity-50">
                campaign
              </span>
            </div>
            <h2 className="font-h3 text-h3 text-on-surface mb-2">Aucune annonce publiée</h2>
            <p className="text-on-surface-variant max-w-md mb-8">
              Vous n'avez pas encore publié d'annonce. Commencez dès maintenant à proposer
              vos biens sur la plateforme.
            </p>
            <Link
              to="/mes-annonces/nouvelle"
              className="flex items-center gap-2 bg-primary-fixed-dim text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Publier ma première annonce
            </Link>
          </div>
        )}

        {/* Annonces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {annonces.map((a) => {
            const img = a.photos?.[0];
            return (
              <div
                key={a.id}
                className="bg-surface-container-low border border-surface-variant rounded-2xl overflow-hidden hover:border-outline-variant transition-all group flex flex-col"
              >
                {/* Image */}
                <div className="relative h-48 w-full bg-surface-container overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={a.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container">
                      <span className="material-symbols-outlined text-[48px] text-on-surface-variant opacity-30">
                        home
                      </span>
                    </div>
                  )}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-80" />

                  {/* Type badge */}
                  <span className="absolute top-3 right-3 bg-surface-container/80 backdrop-blur-md border border-surface-variant text-xs font-semibold px-2.5 py-1 rounded-full text-on-surface">
                    {typeLabels[a.typeLogement] || a.typeLogement}
                  </span>

                  {/* Status badge */}
                  <span
                    className={`absolute top-3 left-3 border text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${
                      statutStyles[a.statut] || 'bg-surface-container/80 text-on-surface border-surface-variant'
                    }`}
                  >
                    {a.statut === 'DISPONIBLE'
                      ? 'Disponible'
                      : a.statut === 'RESERVE'
                      ? 'Réservé'
                      : a.statut === 'LOUE'
                      ? 'Loué'
                      : a.statut === 'SUSPENDU'
                      ? 'Suspendu'
                      : a.statut}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3
                      className="font-bold text-on-surface text-lg mb-2 line-clamp-1"
                      title={a.titre}
                    >
                      {a.titre}
                    </h3>

                    <p className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-3">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span className="line-clamp-1">
                        {a.ville}
                        {a.pays ? `, ${a.pays}` : ''}
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {a.nombrePieces ? (
                        <span className="flex items-center gap-1 text-xs font-medium bg-surface-container px-2.5 py-1 rounded-lg text-on-surface-variant border border-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">bed</span>
                          {a.nombrePieces} pièce{a.nombrePieces > 1 ? 's' : ''}
                        </span>
                      ) : null}
                      {a.superficie ? (
                        <span className="flex items-center gap-1 text-xs font-medium bg-surface-container px-2.5 py-1 rounded-lg text-on-surface-variant border border-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">square_foot</span>
                          {a.superficie} m²
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-surface-variant/50">
                    <p className="font-bold text-primary-fixed-dim text-lg">
                      {Number(a.prix).toLocaleString('fr-FR')} Ar
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        title="Voir le détail"
                        onClick={() => navigate(`/annonces/${a.id}`)}
                        className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-variant hover:border-outline transition-all flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      </button>
                      <button
                        title="Modifier"
                        onClick={() => navigate(`/mes-annonces/${a.id}/modifier`)}
                        className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-bright border border-surface-variant hover:border-outline transition-all flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        title="Supprimer"
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                        className="w-9 h-9 rounded-xl bg-surface-container hover:bg-error/20 border border-surface-variant hover:border-error/40 transition-all flex items-center justify-center text-on-surface-variant hover:text-error disabled:opacity-50"
                      >
                        {deletingId === a.id ? (
                          <div className="w-4 h-4 border-2 border-on-surface-variant border-t-error rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        )}
                      </button>
                    </div>
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
