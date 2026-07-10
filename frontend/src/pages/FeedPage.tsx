import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import { StateManager } from '../components/ui/state';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

// Helper: get first photo URL from annonce (supports both `photos: string[]` and `images: {url}[]`)
function getFirstPhoto(annonce: any): string | null {
  if (annonce.photos && annonce.photos.length > 0) return annonce.photos[0];
  if (annonce.images && annonce.images.length > 0) return annonce.images[0]?.url ?? annonce.images[0];
  return null;
}

function getOwnerAvatar(proprietaire: any): string {
  if (proprietaire?.photo) return proprietaire.photo;
  const name = encodeURIComponent(`${proprietaire?.prenom ?? ''}+${proprietaire?.nom ?? ''}`);
  return `https://ui-avatars.com/api/?name=${name}&background=fabd00&color=000&bold=true`;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNextPage = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAnnonces(nextPage, false);
  }, [page, hasMore, loading]);

  const { ref: loadMoreRef } = useIntersectionObserver(fetchNextPage);

  const fetchAnnonces = async (p: number, reset = false) => {
    setLoading(true);
    if (reset) setError(null);
    try {
      const { data } = await api.get(`/annonces?page=${p}&size=10`);
      const items = data.content || [];
      setAnnonces((prev) => (reset ? items : [...prev, ...items]));
      setHasMore(!data.last);
    } catch (err: any) {
      if (reset) setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWidgets = async () => {
    try {
      const [resData, notifData] = await Promise.all([
        api.get('/reservations/mes-reservations?page=0&size=3').catch(() => ({ data: { content: [] } })),
        api.get('/notifications?page=0&size=3').catch(() => ({ data: { content: [] } })),
      ]);
      // Handle paginated and non-paginated responses
      const resItems = resData.data?.content ?? (Array.isArray(resData.data) ? resData.data : []);
      const notifItems = notifData.data?.content ?? (Array.isArray(notifData.data) ? notifData.data : []);
      setReservations(resItems.slice(0, 3));
      setNotifications(notifItems.slice(0, 5));
    } catch {
      // ignore
    }
  };

  const fetchPosts = () => {
    fetchAnnonces(0, true);
    fetchWidgets();
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useAutoRefresh(fetchPosts, ['annonces', 'notifications', 'reservations']);

  // Remove old loadMore function - replaced by observer

  const isLoadingDelayed = useDelayedLoading(loading && annonces.length === 0);

  return (
    <AppLayout>
      <StateManager 
        isLoading={isLoadingDelayed}
        isError={!!error}
        errorProps={{ onRetry: fetchPosts }}
      >
        <div className="p-4 md:p-6 space-y-6 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* Left Column: Social Feed */}
            <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-h2 text-h2 text-on-surface">Fil d'actualité</h2>
              <Link
                to="/annonces"
                className="text-primary-fixed-dim font-label-caps text-label-caps hover:opacity-80 transition-opacity uppercase flex items-center gap-1"
              >
                Voir tout
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {loading && annonces.length === 0 && (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-surface-container border border-surface-variant rounded-xl overflow-hidden animate-pulse">
                    <div className="p-4 flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-surface-variant" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-surface-variant rounded w-1/3" />
                        <div className="h-3 bg-surface-variant rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-64 bg-surface-variant" />
                  </div>
                ))}
              </div>
            )}

            {!loading && annonces.length === 0 && (
              <div className="bg-surface-container rounded-xl border border-surface-variant p-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 block">dynamic_feed</span>
                <h3 className="font-h3 text-h3 text-on-surface mb-2">Rien à voir ici</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                  Aucune annonce pour le moment. Soyez le premier à en publier !
                </p>
                <Link
                  to="/mes-annonces/nouvelle"
                  className="inline-block bg-primary-fixed-dim text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Créer une annonce
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {annonces.map((annonce) => {
                const photo = getFirstPhoto(annonce);
                const ownerAvatar = getOwnerAvatar(annonce.proprietaire);
                return (
                  <article
                    key={annonce.id}
                    className="bg-surface-container rounded-xl border border-surface-variant overflow-hidden hover:border-outline-variant transition-colors group"
                  >
                    {/* Post Header */}
                    <div className="p-4 border-b border-surface-variant flex items-center gap-3">
                      <img
                        src={ownerAvatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-surface-variant"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body-md text-body-md font-semibold text-on-surface">
                          {annonce.proprietaire?.prenom} {annonce.proprietaire?.nom}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Nouvelle annonce • {new Date(annonce.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>
                    </div>

                    {/* Post Image */}
                    <Link to={`/annonces/${annonce.id}`} className="block relative h-64 sm:h-80 w-full overflow-hidden">
                      {photo ? (
                        <img
                          alt={annonce.titre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          src={photo}
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-[64px] text-on-surface-variant opacity-30">home</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 px-3 py-1 bg-primary-fixed-dim text-black font-label-caps text-label-caps rounded-full shadow-lg uppercase font-bold text-xs">
                        {annonce.typeTransaction === 'VENTE' ? 'À vendre' : 'À louer'}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                        <p className="font-bold text-white text-lg leading-tight">{annonce.titre}</p>
                        <p className="font-body-sm text-sm text-gray-300 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {annonce.ville || annonce.localisation || 'Non spécifié'}
                        </p>
                      </div>
                    </Link>

                    {/* Post Footer */}
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex gap-4">
                        <Link
                          to={`/annonces/${annonce.id}`}
                          className="flex items-center gap-2 text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                          <span className="font-body-sm text-body-sm">Voir</span>
                        </Link>
                        <Link
                          to={`/messages/${annonce.proprietaire?.id}`}
                          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                          <span className="font-body-sm text-body-sm">Contacter</span>
                        </Link>
                      </div>
                      <p className="font-bold text-primary-fixed-dim text-lg">
                        {annonce.prix?.toLocaleString('fr-FR')} Ar
                      </p>
                    </div>
                  </article>
                );
              })}
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                {loading && <div className="w-6 h-6 border-2 border-surface-variant border-t-primary-fixed-dim rounded-full animate-spin" />}
              </div>
            </div>

              {loading && annonces.length === 0 && !isLoadingDelayed && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-surface-variant border-t-primary-fixed-dim rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Right Column: Widgets */}
          <div className="xl:col-span-4 flex flex-col gap-6">

            {/* Quick Actions */}
            <section className="bg-surface-container rounded-xl border border-surface-variant p-5">
              <h3 className="font-h3 text-[16px] font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">bolt</span>
                Actions rapides
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/annonces"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-surface-variant hover:border-primary-fixed-dim hover:bg-surface-container-high transition-all group"
                >
                  <span className="material-symbols-outlined text-[24px] text-primary-fixed-dim group-hover:scale-110 transition-transform">search</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant text-center">Explorer</span>
                </Link>
                <Link
                  to="/messages"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-container-low border border-surface-variant hover:border-primary-fixed-dim hover:bg-surface-container-high transition-all group"
                >
                  <span className="material-symbols-outlined text-[24px] text-on-surface-variant group-hover:text-primary-fixed-dim group-hover:scale-110 transition-all">forum</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant text-center">Messages</span>
                </Link>
                {user?.role === 'PROPRIETAIRE' && (
                  <Link
                    to="/mes-annonces/nouvelle"
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary-fixed-dim/10 border border-primary-fixed-dim/30 hover:bg-primary-fixed-dim/20 transition-all group col-span-2"
                  >
                    <span className="material-symbols-outlined text-[24px] text-primary-fixed-dim group-hover:scale-110 transition-transform">add_home</span>
                    <span className="font-label-caps text-label-caps text-primary-fixed-dim text-center">Publier une annonce</span>
                  </Link>
                )}
              </div>
            </section>

            {/* Reservations Widget */}
            <section className="bg-surface-container rounded-xl border border-surface-variant p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[16px] text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">event_available</span>
                  Mes Réservations
                </h3>
                <Link
                  to="/mes-reservations"
                  className="font-label-caps text-label-caps text-primary-fixed-dim hover:underline uppercase text-[11px]"
                >
                  Tout voir
                </Link>
              </div>
              <div className="space-y-3">
                {reservations.length === 0 ? (
                  <p className="text-on-surface-variant font-body-sm text-sm text-center py-4">
                    Aucune réservation récente.
                  </p>
                ) : (
                  reservations.map((res: any, idx) => (
                    <div
                      key={res.id ?? idx}
                      className="bg-surface-container-low p-3 rounded-lg border border-surface-variant flex gap-3 items-start"
                    >
                      <div className="bg-surface-container-high p-2 rounded-lg text-center min-w-[44px]">
                        <p className="font-label-caps text-[9px] text-on-surface-variant uppercase">
                          {new Date(res.dateVisite || res.dateDebut).toLocaleString('fr-FR', { month: 'short' })}
                        </p>
                        <p className="font-bold text-on-surface text-lg leading-none">
                          {new Date(res.dateVisite || res.dateDebut).getDate()}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface text-sm truncate">
                          {res.annonce?.titre || 'Visite'}
                        </p>
                        <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {new Date(res.dateVisite || res.dateDebut).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-surface-container rounded-xl border border-surface-variant p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-surface-variant pb-3">
                <h3 className="font-bold text-[16px] text-on-surface">Activité Récente</h3>
                <Link to="/notifications" className="font-label-caps text-label-caps text-primary-fixed-dim hover:underline uppercase text-[11px]">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-on-surface-variant font-body-sm text-sm text-center py-4">
                    Pas d'activité récente.
                  </p>
                ) : (
                  notifications.map((notif: any, idx) => (
                    <Link to="/notifications" key={notif.id ?? idx} className="flex gap-3 items-start group cursor-pointer">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.lue ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary-fixed-dim/20 text-primary-fixed-dim'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {notif.type?.includes('MESSAGE') ? 'forum' : notif.type?.includes('LIKE') ? 'favorite' : 'notifications'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm group-hover:text-primary-fixed-dim transition-colors line-clamp-2 ${notif.lue ? 'text-on-surface-variant' : 'text-on-surface font-semibold'}`}>
                          {notif.message ?? notif.contenu}
                        </p>
                        <p className="font-label-caps text-[10px] text-on-surface-variant mt-0.5 uppercase">
                          {new Date(notif.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
      </StateManager>
    </AppLayout>
  );
}
