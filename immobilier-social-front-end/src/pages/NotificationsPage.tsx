import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import './NotificationsPage.css';

interface Notification {
  id: number;
  message: string;
  type: string;
  lue: boolean;
  dateCreation: string;
}

const typeIcons: Record<string, string> = {
  NOUVEAU_LIKE: '❤️',
  NOUVEAU_COMMENTAIRE: '💬',
  NOUVEAU_MESSAGE: '✉️',
  RESERVATION_CONFIRMEE: '✅',
  RESERVATION_ANNULEE: '❌',
  NOUVELLE_ANNONCE: '🏠',
  SYSTEME: '🔔',
  VERIFICATION_EMAIL: '📧',
  REINITIALISATION_MDP: '🔑',
  MESSAGE: '✉️',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications(0, true);
  }, []);

  const fetchNotifications = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/notifications?page=${p}&size=20`);
      const items = data.content || [];
      setNotifications((prev) => reset ? items : [...prev, ...items]);
      setHasMore(!data.last);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/lire`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, lue: true } : n));
    } catch { /* silencieux */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/tout-lire');
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
    } catch { /* silencieux */ }
  };

  const unreadCount = notifications.filter((n) => !n.lue).length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
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
              ✓ Tout marquer comme lu
            </button>
          )}
        </div>

        {loading && notifications.length === 0 && (
          <div className="notifs-loading"><div className="spinner" /></div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="notifs-empty card">
            <span style={{ fontSize: 56 }}>🔔</span>
            <h3>Aucune notification</h3>
            <p>Vous serez notifié des likes, commentaires et messages.</p>
          </div>
        )}

        <div className="notifs-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-item card ${!notif.lue ? 'unread' : ''}`}
              onClick={() => !notif.lue && markRead(notif.id)}
            >
              <div className="notif-icon">
                {typeIcons[notif.type] || '🔔'}
              </div>
              <div className="notif-body">
                <p className="notif-message">{notif.message}</p>
                <span className="notif-time">{formatDate(notif.dateCreation)}</span>
              </div>
              {!notif.lue && <div className="notif-unread-indicator" />}
            </div>
          ))}
        </div>

        {hasMore && !loading && (
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
            onClick={() => { const next = page + 1; setPage(next); fetchNotifications(next); }}>
            Charger plus
          </button>
        )}
      </div>
    </AppLayout>
  );
}
