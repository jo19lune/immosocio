import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faMagnifyingGlass,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { emitAppRefresh } from '../lib/appEvents';
import { onNotification } from '../lib/websocket';
import messengerLineSvg from '../assets/messenger_line.svg';
import '../styles/pages/MessagesPage.css';

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

function sortMessages(items: Message[]) {
  return [...items].sort(
    (left, right) => new Date(left.dateEnvoi).getTime() - new Date(right.dateEnvoi).getTime()
  );
}

function mergeMessages(existing: Message[], incoming: Message[]) {
  const byId = new Map<number, Message>();
  existing.forEach((message) => byId.set(message.id, message));
  incoming.forEach((message) => byId.set(message.id, message));
  return sortMessages(Array.from(byId.values()));
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
  const activeUserRef = useRef<UserInfo | null>(null);

  activeUserRef.current = activeUser;

  const getOtherUser = (conversation: Conversation): UserInfo =>
    conversation.expediteur.id === user?.id ? conversation.destinataire : conversation.expediteur;

  const avatarOf = (person: UserInfo) =>
    person.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${person.prenom}+${person.nom}`
    )}&background=3B6CF8&color=fff&bold=true`;

  const markConversationAsReadLocally = (otherId: number) => {
    setConversations((prev) => {
      let changed = false;
      const next = prev.map((conversation) => {
        const other = getOtherUser(conversation);
        if (other.id === otherId && !conversation.lu) {
          changed = true;
          return { ...conversation, lu: true };
        }
        return conversation;
      });
      return changed ? next : prev;
    });
  };

  const fetchConversations = async (options?: { showLoader?: boolean }) => {
    const showLoader = options?.showLoader ?? true;
    if (showLoader) {
      setLoadingConvs(true);
    }
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data || []);
    } catch {
      // silent background refresh
    } finally {
      if (showLoader) {
        setLoadingConvs(false);
      }
    }
  };

  const fetchMessages = async (
    otherId: number,
    options?: { replace?: boolean; showLoader?: boolean }
  ) => {
    const replace = options?.replace ?? true;
    const showLoader = options?.showLoader ?? true;
    if (showLoader) {
      setLoadingMsgs(true);
    }
    if (replace) {
      setMessages([]);
    }
    try {
      const { data } = await api.get(`/messages/${otherId}?page=0&size=50`);
      const nextMessages = sortMessages(data.content || []);
      if (nextMessages.length > 0) {
        const lastMessage = nextMessages[nextMessages.length - 1];
        const resolvedUser =
          lastMessage.expediteur.id === user?.id
            ? lastMessage.destinataire
            : lastMessage.expediteur;
        setActiveUser((prev) => {
          if (!prev) {
            return resolvedUser;
          }
          if (prev.id !== resolvedUser.id) {
            return prev;
          }
          return resolvedUser;
        });
      }
      setMessages((prev) => (replace ? nextMessages : mergeMessages(prev, nextMessages)));
      markConversationAsReadLocally(otherId);
      emitAppRefresh(['messages', 'layout'], { source: 'local', payload: { otherId } });
    } catch {
      // silent background refresh
    } finally {
      if (showLoader) {
        setLoadingMsgs(false);
      }
    }
  };

  const openConversation = (other: UserInfo) => {
    setActiveUser(other);
    navigate(`/messages/${other.id}`, { replace: true });
    fetchMessages(other.id);
  };

  useEffect(() => {
    const unsubscribe = onNotification((data: unknown) => {
      const payload = data as { type?: string; messagePayload?: Message };
      if (payload.type !== 'NOUVEAU_MESSAGE' || !payload.messagePayload) {
        return;
      }

      const message = payload.messagePayload;
      const otherParticipant =
        message.expediteur.id === user?.id ? message.destinataire : message.expediteur;
      const activeConversationId = activeUserRef.current?.id;

      if (activeConversationId === otherParticipant.id) {
        setMessages((prev) => mergeMessages(prev, [message]));
        markConversationAsReadLocally(otherParticipant.id);
        if (message.expediteur.id !== user?.id) {
          api.patch(`/messages/${otherParticipant.id}/lu`).catch(() => undefined);
        }
      }

      fetchConversations({ showLoader: false });
      emitAppRefresh(['messages', 'notifications', 'layout'], {
        source: 'websocket',
        payload,
      });
    });

    return unsubscribe;
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const refreshVisibleData = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      fetchConversations({ showLoader: false });
      if (activeUserRef.current) {
        fetchMessages(activeUserRef.current.id, { replace: false, showLoader: false });
      }
    };

    const conversationsTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchConversations({ showLoader: false });
      }
    }, 12000);

    const messagesTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && activeUserRef.current) {
        fetchMessages(activeUserRef.current.id, { replace: false, showLoader: false });
      }
    }, 5000);

    window.addEventListener('focus', refreshVisibleData);
    document.addEventListener('visibilitychange', refreshVisibleData);

    return () => {
      window.clearInterval(conversationsTimer);
      window.clearInterval(messagesTimer);
      window.removeEventListener('focus', refreshVisibleData);
      document.removeEventListener('visibilitychange', refreshVisibleData);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const numericUserId = parseInt(userId, 10);
    if (Number.isNaN(numericUserId) || activeUser?.id === numericUserId) {
      return;
    }

    const existingConversation = conversations.find((conversation) => {
      const other = getOtherUser(conversation);
      return other.id === numericUserId;
    });

    if (existingConversation) {
      openConversation(getOtherUser(existingConversation));
      return;
    }

    setActiveUser({ id: numericUserId, nom: '...', prenom: '' });
    fetchMessages(numericUserId);
  }, [userId, conversations, activeUser?.id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !activeUser || sending) {
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post(`/messages/${activeUser.id}`, { contenu: text });
      setMessages((prev) => mergeMessages(prev, [data]));
      setText('');
      fetchConversations({ showLoader: false });
      emitAppRefresh(['messages', 'layout'], {
        source: 'local',
        payload: { otherId: activeUser.id },
      });
    } catch {
      // silent background refresh
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 86400) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter((conversation) => {
    const other = getOtherUser(conversation);
    const fullName = `${other.prenom} ${other.nom}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <AppLayout>
      <div className={`messages-page ${activeUser ? 'chat-open' : ''}`}>
        <div className="conv-list">
          <div className="conv-list-header">
            <h2 className="conv-list-title">Messages</h2>
          </div>

          <div className="conv-search-wrap">
            <div className="conv-search-field">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="conv-search-icon" />
              <input
                className="form-input conv-search"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          {loadingConvs && (
            <div className="conv-loading">
              <div className="spinner" />
            </div>
          )}

          {!loadingConvs && filteredConversations.length === 0 && (
            <div className="conv-empty">
              <img
                src={messengerLineSvg}
                alt=""
                width={48}
                height={48}
                style={{ opacity: 0.3, marginBottom: 8 }}
              />
              <p>Aucune conversation</p>
            </div>
          )}

          <div className="conv-items">
            {filteredConversations.map((conversation) => {
              const other = getOtherUser(conversation);
              const isActive = activeUser?.id === other.id;
              const isUnread = !conversation.lu && conversation.destinataire.id === user?.id;

              return (
                <div
                  key={conversation.id}
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
                      {conversation.expediteur.id === user?.id ? 'Vous: ' : ''}
                      {conversation.contenu}
                    </div>
                  </div>
                  <div className="conv-item-time">{formatTime(conversation.dateEnvoi)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chat-area">
          {!activeUser ? (
            <div className="chat-empty">
              <img
                src={messengerLineSvg}
                alt=""
                width={64}
                height={64}
                style={{ opacity: 0.3, marginBottom: 16 }}
              />
              <h3>Vos messages</h3>
              <p>Selectionnez une conversation pour commencer.</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <button
                  className="chat-back"
                  onClick={() => {
                    setActiveUser(null);
                    navigate('/messages');
                  }}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <img src={avatarOf(activeUser)} alt="" className="avatar" width={38} height={38} />
                <div>
                  <div className="chat-header-name">
                    {activeUser.prenom} {activeUser.nom}
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {loadingMsgs && (
                  <div className="conv-loading">
                    <div className="spinner" />
                  </div>
                )}

                {!loadingMsgs && messages.length === 0 && (
                  <div className="chat-start">
                    <p>Commencez la conversation avec {activeUser.prenom || 'cet utilisateur'}.</p>
                  </div>
                )}

                {messages.map((message) => {
                  const isMine = message.expediteur.id === user?.id;
                  return (
                    <div key={message.id} className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && (
                        <img
                          src={avatarOf(message.expediteur)}
                          alt=""
                          className="avatar msg-avatar"
                          width={28}
                          height={28}
                        />
                      )}
                      <div className="message-content">
                        {message.mediaUrl && (
                          <img src={message.mediaUrl} alt="" className="message-media" />
                        )}
                        <p>{message.contenu}</p>
                        <span className="message-time">{formatTime(message.dateEnvoi)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-bar" onSubmit={handleSend}>
                <input
                  className="form-input chat-input"
                  placeholder={`Message a ${activeUser.prenom || '...'}`}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary chat-send-btn"
                  disabled={!text.trim() || sending}
                  aria-label="Envoyer le message"
                >
                  {sending ? (
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} className="chat-send-icon" />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
