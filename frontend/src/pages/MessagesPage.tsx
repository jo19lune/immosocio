import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { onNotification } from '../lib/websocket';
import './MessagesPage.css';

interface UserInfo {
  id: number;
  nom: string;
  prenom: string;
  photo?: string;
}

interface Message {
  id: number;
  contenu: string;
  mediaUrl?: string;
  lu: boolean;
  dateEnvoi: string;
  expediteur: UserInfo;
  destinataire: UserInfo;
}

interface Conversation {
  id: number;
  contenu: string;
  dateEnvoi: string;
  expediteur: UserInfo;
  destinataire: UserInfo;
  lu: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUser, setActiveUser] = useState<UserInfo | null>(null);
  const [text, setText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref pour accéder à l'utilisateur actif dans le callback WebSocket sans stale closure
  const activeUserRef = useRef<UserInfo | null>(null);
  activeUserRef.current = activeUser;

  // ── Réception en temps réel via WebSocket ────────────────────────────────
  useEffect(() => {
    const unsubscribe = onNotification((data: unknown) => {
      const payload = data as { type?: string; message?: Message };
      if (payload.type === 'NOUVEAU_MESSAGE' && payload.message) {
        const msg = payload.message;
        const isFromActiveConv =
          activeUserRef.current?.id === msg.expediteur.id ||
          activeUserRef.current?.id === msg.destinataire.id;
        if (isFromActiveConv) {
          setMessages((prev) => {
            // Eviter les doublons (le message qu'on vient d'envoyer est déjà ajouté)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
        // Rafraîchir la liste des conversations pour le badge non-lu
        fetchConversations();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (userId) {
      const numId = parseInt(userId);
      const found = conversations.find(
        (c) => c.expediteur.id === numId || c.destinataire.id === numId
      );
      if (found) {
        const other = found.expediteur.id === user?.id ? found.destinataire : found.expediteur;
        openConversation(other);
      } else if (numId) {
        // Ouvrir une nouvelle conversation
        setActiveUser({ id: numId, nom: '...', prenom: '' });
        fetchMessages(numId);
      }
    }
  }, [userId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data || []);
    } catch { /* silencieux */ }
    finally { setLoadingConvs(false); }
  };

  const fetchMessages = async (otherId: number) => {
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const { data } = await api.get(`/messages/${otherId}?page=0&size=50`);
      setMessages(data.content?.reverse() || []);
    } catch { /* silencieux */ }
    finally { setLoadingMsgs(false); }
  };

  const openConversation = (other: UserInfo) => {
    setActiveUser(other);
    navigate(`/messages/${other.id}`, { replace: true });
    fetchMessages(other.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeUser || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${activeUser.id}`, { contenu: text });
      setMessages((prev) => [...prev, data]);
      setText('');
      fetchConversations();
    } catch { /* silencieux */ }
    finally { setSending(false); }
  };

  const getOtherUser = (conv: Conversation): UserInfo =>
    conv.expediteur.id === user?.id ? conv.destinataire : conv.expediteur;

  const avatarOf = (u: UserInfo) =>
    u.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.prenom + '+' + u.nom)}&background=3B6CF8&color=fff&bold=true`;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 86400) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const filtered = conversations.filter((c) => {
    const other = getOtherUser(c);
    const name = `${other.prenom} ${other.nom}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <AppLayout>
      <div className="messages-page">
        {/* Liste des conversations */}
        <div className="conv-list">
          <div className="conv-list-header">
            <h2 className="conv-list-title">Messages</h2>
          </div>
          <div className="conv-search-wrap">
            <input
              className="form-input conv-search"
              placeholder="🔍 Rechercher une conversation…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loadingConvs && <div className="conv-loading"><div className="spinner" /></div>}

          {!loadingConvs && filtered.length === 0 && (
            <div className="conv-empty">
              <span>💬</span>
              <p>Aucune conversation</p>
            </div>
          )}

          <div className="conv-items">
            {filtered.map((conv) => {
              const other = getOtherUser(conv);
              const isActive = activeUser?.id === other.id;
              const isUnread = !conv.lu && conv.destinataire.id === user?.id;
              return (
                <div
                  key={conv.id}
                  className={`conv-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
                  onClick={() => openConversation(other)}
                >
                  <div className="conv-avatar-wrap">
                    <img src={avatarOf(other)} alt="" className="avatar" width={44} height={44} />
                    {isUnread && <span className="conv-unread-dot" />}
                  </div>
                  <div className="conv-item-info">
                    <div className="conv-item-name">
                      {other.prenom} {other.nom}
                    </div>
                    <div className="conv-item-preview">
                      {conv.expediteur.id === user?.id ? 'Vous: ' : ''}{conv.contenu}
                    </div>
                  </div>
                  <div className="conv-item-time">{formatTime(conv.dateEnvoi)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="chat-area">
          {!activeUser ? (
            <div className="chat-empty">
              <span style={{ fontSize: 56 }}>💬</span>
              <h3>Vos messages</h3>
              <p>Sélectionnez une conversation pour commencer</p>
            </div>
          ) : (
            <>
              {/* Header chat */}
              <div className="chat-header">
                <button className="chat-back" onClick={() => { setActiveUser(null); navigate('/messages'); }}>
                  ←
                </button>
                <img src={avatarOf(activeUser)} alt="" className="avatar" width={38} height={38} />
                <div>
                  <div className="chat-header-name">{activeUser.prenom} {activeUser.nom}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {loadingMsgs && <div className="conv-loading"><div className="spinner" /></div>}

                {!loadingMsgs && messages.length === 0 && (
                  <div className="chat-start">
                    <p>Commencez la conversation avec {activeUser.prenom} !</p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isMine = msg.expediteur.id === user?.id;
                  return (
                    <div key={msg.id} className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && (
                        <img src={avatarOf(msg.expediteur)} alt="" className="avatar msg-avatar"
                          width={28} height={28} />
                      )}
                      <div className="message-content">
                        {msg.mediaUrl && (
                          <img src={msg.mediaUrl} alt="" className="message-media" />
                        )}
                        <p>{msg.contenu}</p>
                        <span className="message-time">{formatTime(msg.dateEnvoi)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="chat-input-bar" onSubmit={handleSend}>
                <input
                  className="form-input chat-input"
                  placeholder={`Message à ${activeUser.prenom}…`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary chat-send-btn"
                  disabled={!text.trim() || sending}
                >
                  {sending ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '➤'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
