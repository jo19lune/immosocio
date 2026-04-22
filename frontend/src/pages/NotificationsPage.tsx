import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBell,
  faCalendarCheck,
  faCalendarXmark,
  faCommentDots,
  faHeart,
  faHouse,
  faMessage,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import { emitAppRefresh } from '../lib/appEvents';
import { onNotification } from '../lib/websocket';
import notificationLineSvg from '../assets/notification_line.svg';
import '../styles/pages/NotificationsPage.css';

interface Notification {
  id: number;
  message: string;
  type: string;
  lue: boolean;
  dateCreation: string;
  routeCible?: string;
}

const typeIcons: Record<string, IconDefinition> = {
  NOUVEAU_LIKE: faHeart,
  NOUVEAU_COMMENTAIRE: faCommentDots,
  MESSAGE: faMessage,
  NOUVEAU_MESSAGE: faMessage,
  RESERVATION_CONFIRMEE: faCalendarCheck,
  RESERVATION_CREEE: faCalendarCheck,
  NOUVELLE_RESERVATION: faCalendarCheck,
  RESERVATION_ANNULEE: faCalendarXmark,
  NOUVELLE_ANNONCE: faHouse,
  SYSTEME: faBell,
  VERIFICATION_EMAIL: faBell,
  REINITIALISATION_MDP: faBell,
};

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
          if (prev.some((notif) => notif.id === incoming.id)) {
            return prev;
          }
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
    if (diff < 60) return "A l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div className="notifs-page">
        <div className="notifs-header">
          <div>
            <h1 className="notifs-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="badge badge-danger">{unreadCount} non lues</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {loading && notifications.length === 0 && (
          <div className="notifs-loading">
            <div className="spinner" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="notifs-empty card">
            <img
              src={notificationLineSvg}
              alt=""
              width={56}
              height={56}
              style={{ opacity: 0.3, marginBottom: 12 }}
            />
            <h3>Aucune notification</h3>
            <p>Les messages, commentaires, suivis et reservations apparaissent ici.</p>
          </div>
        )}

        <div className="notifs-list">
          {notifications.map((notification) => {
            const icon = typeIcons[notification.type] || faBell;
            const tone = getNotificationTone(notification.type);
            return (
              <button
                key={notification.id}
                type="button"
                className={`notif-item card ${!notification.lue ? 'unread' : ''}`}
                onClick={() => openNotification(notification)}
              >
                <div className={`notif-icon ${tone}`}>
                  <FontAwesomeIcon icon={icon} />
                </div>
                <div className="notif-body">
                  <p className="notif-message">{notification.message}</p>
                  <div className="notif-meta">
                    <span className="notif-time">{formatDate(notification.dateCreation)}</span>
                    <span className="notif-link">
                      Ouvrir
                      <FontAwesomeIcon icon={faArrowRight} />
                    </span>
                  </div>
                </div>
                {!notification.lue && <div className="notif-unread-indicator" />}
              </button>
            );
          })}
        </div>

        {hasMore && !loading && (
          <button
            className="btn btn-ghost notifs-load-more"
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchNotifications(nextPage);
            }}
          >
            Charger plus
          </button>
        )}
      </div>
    </AppLayout>
  );
}
