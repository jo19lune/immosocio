import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import { emitAppRefresh } from '../lib/appEvents';
import { onNotification } from '../lib/websocket';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

interface Notification {
  id: number;
  message: string;
  type: string;
  lue: boolean;
  dateCreation: string;
  routeCible?: string;
}

const fallbackRoutes: Record<string, string> = {
  NOUVEAU_LIKE: '/feed',
  NOUVEAU_COMMENTAIRE: '/feed',
  MESSAGE: '/messages',
  NOUVEAU_MESSAGE: '/messages',
  RESERVATION_CONFIRMEE: '/mes-reservations',
  RESERVATION_CREEE: '/mes-reservations',
  NOUVELLE_RESERVATION: '/demandes-reservations',
  RESERVATION_ANNULEE: '/mes-reservations',
  NOUVELLE_ANNONCE: '/annonces',
  SYSTEME: '/notifications',
  VERIFICATION_EMAIL: '/parametres',
  REINITIALISATION_MDP: '/parametres',
};

function getNotificationTone(type: string) {
  if (type.includes('MESSAGE')) return 'message';
  if (type.includes('LIKE') || type.includes('COMMENTAIRE')) return 'social';
  if (type.includes('RESERVATION')) return 'reservation';
  if (type.includes('ANNONCE')) return 'housing';
  return 'system';
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNextPage = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  }, [page, hasMore, loading]);

  const { ref: loadMoreRef } = useIntersectionObserver(fetchNextPage);

  useEffect(() => {
    fetchNotifications(0, true);
  }, []);

  useEffect(() => {
    const unsubscribe = onNotification((data: unknown) => {
      const payload = data as {
        type?: string;
        notificationType?: string;
        message?: string;
        id?: number;
        dateCreation?: string;
        routeCible?: string;
      };
      const notificationType = payload.notificationType ?? payload.type;
      if (notificationType && payload.message) {
        const incoming: Notification = {
          id: payload.id ?? Date.now(),
          message: payload.message,
          type: notificationType,
          lue: false,
          dateCreation: payload.dateCreation ?? new Date().toISOString(),
          routeCible: payload.routeCible,
        };
        setNotifications((prev) => {
          if (prev.some((notif) => notif.id === incoming.id)) return prev;
          return [incoming, ...prev];
        });
      }
    });
    return unsubscribe;
  }, []);

  const fetchNotifications = async (nextPage: number, reset = false) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/notifications?page=${nextPage}&size=20`);
      const items = data.content || [];
      setNotifications((prev) => (reset ? items : [...prev, ...items]));
      setHasMore(!data.last);
    } catch {
      // silent background refresh
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/lire`);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, lue: true } : notif))
      );
      emitAppRefresh(['notifications', 'layout'], {
        source: 'local',
        payload: { notificationId: id },
      });
    } catch {
      // silent background refresh
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/tout-lire');
      setNotifications((prev) => prev.map((notif) => ({ ...notif, lue: true })));
      emitAppRefresh(['notifications', 'layout'], { source: 'local' });
    } catch {
      // silent background refresh
    }
  };

  const getNotificationRoute = (notification: Notification) =>
    notification.routeCible || fallbackRoutes[notification.type] || '/notifications';

  const openNotification = async (notification: Notification) => {
    try {
      if (!notification.lue) {
        await markRead(notification.id);
      }
    } finally {
      navigate(getNotificationRoute(notification));
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.lue).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.max(0, (now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toneIconMap: Record<string, string> = {
    message: 'chat_bubble',
    social: 'favorite',
    reservation: 'event_available',
    housing: 'home',
    system: 'notifications',
  };

  const toneColorMap: Record<string, string> = {
    message: 'text-primary-fixed-dim',
    social: 'text-error',
    reservation: 'text-primary-fixed-dim',
    housing: 'text-primary',
    system: 'text-on-surface-variant',
  };

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8">

        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface mb-2">Notifications</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {unreadCount > 0 ? (
                <span className="text-primary-fixed-dim font-semibold">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              ) : (
                'Restez informé de vos propriétés et connexions.'
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-body-sm text-body-sm"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && notifications.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-container border border-surface-variant rounded-xl p-6 flex gap-4 animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-surface-variant flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-surface-variant rounded w-3/4" />
                  <div className="h-3 bg-surface-variant rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 border border-surface-variant">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant opacity-50">
                notifications_off
              </span>
            </div>
            <h3 className="font-h3 text-h3 text-on-surface mb-2">Aucune notification</h3>
            <p className="text-on-surface-variant max-w-sm">
              Les messages, commentaires, suivis et réservations apparaissent ici.
            </p>
          </div>
        )}

        {/* Notifications List */}
        {notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const tone = getNotificationTone(notification.type);
              const iconName = toneIconMap[tone] || 'notifications';
              const iconColor = toneColorMap[tone] || 'text-on-surface-variant';

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={`w-full text-left bg-surface-container-low border rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-start transition-all hover:border-outline-variant group relative overflow-hidden ${
                    !notification.lue
                      ? 'border-surface-container-high'
                      : 'border-surface-variant/50'
                  }`}
                >
                  {/* Unread left accent */}
                  {!notification.lue && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-fixed-dim rounded-l-xl" />
                  )}

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-surface-variant ${iconColor}`}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {iconName}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pl-1 sm:pl-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <p
                        className={`font-body-md text-body-md leading-relaxed ${
                          !notification.lue
                            ? 'text-on-surface font-semibold'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {notification.message}
                      </p>
                      <span className="font-label-caps text-label-caps text-on-surface-variant shrink-0 uppercase">
                        {formatDate(notification.dateCreation)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant group-hover:text-primary-fixed-dim transition-colors">
                      <span className="font-label-caps text-label-caps uppercase">Voir</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notification.lue && (
                    <div className="w-2.5 h-2.5 bg-primary-fixed-dim rounded-full flex-shrink-0 mt-1 hidden sm:block" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Load More Sentinel */}
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center py-8 mt-8">
          {loading && <div className="w-8 h-8 border-4 border-surface-variant border-t-primary-fixed rounded-full animate-spin" />}
        </div>
      </div>
    </AppLayout>
  );
}
