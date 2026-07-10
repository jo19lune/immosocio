import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { emitAppRefresh } from '../lib/appEvents';
import { onNotification } from '../lib/websocket';

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
  
  // Mobile UI state
  const [showChatList, setShowChatList] = useState(!userId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeUserRef = useRef<UserInfo | null>(null);

  activeUserRef.current = activeUser;

  const getOtherUser = (conversation: Conversation): UserInfo =>
    conversation.expediteur.id === user?.id ? conversation.destinataire : conversation.expediteur;

  const avatarOf = (person: UserInfo) =>
    person.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${person.prenom}+${person.nom}`
    )}&background=fabd00&color=000&bold=true`;

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
          if (!prev) return resolvedUser;
          if (prev.id !== resolvedUser.id) return prev;
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

  const markNotificationsAsRead = async (otherId: number) => {
    try {
      await api.patch('/api/notifications/marquer-lus-par-route', { 
        params: { routeCible: `/messages/${otherId}` } 
      });
      // Optimistically update local conversation state
      markConversationAsReadLocally(otherId);
      emitAppRefresh(['notifications', 'layout'], { source: 'local' });
    } catch (error) {
      console.warn('Failed to mark notifications as read:', error);
    }
  };

  const openConversation = (other: UserInfo) => {
    markNotificationsAsRead(other.id);
    setActiveUser(other);
    setShowChatList(false);
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
        markNotificationsAsRead(otherParticipant.id);
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
    if (!user?.id) return;

    const refreshVisibleData = () => {
      if (document.visibilityState !== 'visible') return;
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
      setShowChatList(true);
      return;
    }

    const numericUserId = parseInt(userId, 10);
    if (Number.isNaN(numericUserId)) return;

    // If already viewing this user, do nothing (avoid re-fetching on every render)
    if (activeUser?.id === numericUserId && messages.length > 0) return;

    const existingConversation = conversations.find((conversation) => {
      const other = getOtherUser(conversation);
      return other.id === numericUserId;
    });

    if (existingConversation) {
      const other = getOtherUser(existingConversation);
      // Only switch if different user
      if (activeUser?.id !== other.id) {
        markNotificationsAsRead(other.id);
        setActiveUser(other);
        setShowChatList(false);
        setMessages([]);
        fetchMessages(other.id);
      }
      return;
    }

    setActiveUser({ id: numericUserId, nom: '...', prenom: '' });
    setShowChatList(false);
    fetchMessages(numericUserId);
  }, [userId, conversations.length, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !activeUser || sending) return;

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
      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] w-full overflow-hidden bg-background">
        
        {/* Left Column: Chat List */}
        <div className={`w-full md:w-1/3 lg:w-1/4 h-full border-r border-surface-variant bg-surface flex flex-col z-10 md:z-auto ${!showChatList ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Chat List Header & Search */}
          <div className="p-6 border-b border-surface-variant">
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-h2 text-h2 text-on-surface">Messages</h1>
              <button className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors">
                <span className="material-symbols-outlined">edit_square</span>
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
              <input
                className="w-full bg-surface-container text-on-surface font-body-sm text-body-sm rounded-lg pl-10 pr-4 py-2 border border-surface-variant focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim outline-none transition-all placeholder:text-on-surface-variant"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Chat List Items */}
          <div className="flex-1 overflow-y-auto space-y-1 p-3 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
            {loadingConvs && (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-surface-variant border-t-primary-fixed-dim rounded-full animate-spin"></div>
              </div>
            )}

            {!loadingConvs && filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-60">
                <span className="material-symbols-outlined text-[48px] mb-4">chat_bubble_outline</span>
                <p>Aucune conversation</p>
              </div>
            )}

            {filteredConversations.map((conversation) => {
              const other = getOtherUser(conversation);
              const isActive = activeUser?.id === other.id;
              const isUnread = !conversation.lu && conversation.destinataire.id === user?.id;

              return (
                <div
                  key={conversation.id}
                  className={`flex items-center p-3 gap-3 rounded-lg cursor-pointer transition-colors group relative overflow-hidden ${isActive ? 'bg-surface-container border border-surface-variant' : 'hover:bg-surface-container/50 border border-transparent'}`}
                  onClick={() => openConversation(other)}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-fixed-dim"></div>}
                  <div className="relative">
                    <img src={avatarOf(other)} alt="" className={`w-12 h-12 rounded-full object-cover border border-surface-variant transition-opacity ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`font-body-md text-body-md text-on-surface truncate ${isUnread || isActive ? 'font-bold' : 'font-medium opacity-90 group-hover:opacity-100'}`}>
                        {other.prenom} {other.nom}
                      </h3>
                      <span className={`font-body-sm text-xs ${isUnread ? 'text-primary-fixed-dim font-bold' : 'text-on-surface-variant'}`}>
                        {formatTime(conversation.dateEnvoi)}
                      </span>
                    </div>
                    <p className={`font-body-sm text-body-sm truncate ${isUnread ? 'text-on-surface font-semibold' : 'text-on-surface-variant opacity-70'}`}>
                      {conversation.expediteur.id === user?.id ? 'Vous: ' : ''}
                      {conversation.contenu}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="w-3 h-3 bg-primary-fixed-dim rounded-full flex-shrink-0"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Chat Area */}
        <div className={`flex-1 flex flex-col h-full bg-background relative ${showChatList ? 'hidden md:flex' : 'flex'}`}>
          {!activeUser ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant bg-surface-container-low/30">
              <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">question_answer</span>
              <h3 className="font-h3 text-h3 text-on-surface mb-2">Vos messages</h3>
              <p>Sélectionnez une conversation pour commencer.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-20 border-b border-surface-variant bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 z-20 sticky top-0">
                <div className="flex items-center gap-4">
                  <button 
                    className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors"
                    onClick={() => { setActiveUser(null); setShowChatList(true); navigate('/messages'); }}
                  >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                  </button>
                  <div className="relative">
                    <img src={avatarOf(activeUser)} alt="" className="w-10 h-10 rounded-full object-cover border border-surface-variant" />
                  </div>
                  <div>
                    <h2 className="font-h3 text-[18px] font-bold text-on-surface leading-none mb-1">{activeUser.prenom} {activeUser.nom}</h2>
                    <span className="font-body-sm text-xs text-on-surface-variant">Actif récemment</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-full border border-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary-fixed-dim transition-all">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </button>
                  <button className="w-10 h-10 rounded-full border border-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary-fixed-dim transition-all">
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                  </button>
                  <button className="w-10 h-10 rounded-full border border-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary-fixed-dim transition-all">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Message Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col relative z-0 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
                
                {loadingMsgs && (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-surface-variant border-t-primary-fixed-dim rounded-full animate-spin"></div>
                  </div>
                )}

                {!loadingMsgs && messages.length === 0 && (
                  <div className="flex justify-center my-6">
                    <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-4 py-1.5 rounded-full uppercase">
                      Commencez la conversation avec {activeUser.prenom}
                    </span>
                  </div>
                )}

                {messages.map((message, index) => {
                  const isMine = message.expediteur.id === user?.id;
                  const showDate = index === 0 || new Date(message.dateEnvoi).toDateString() !== new Date(messages[index - 1].dateEnvoi).toDateString();
                  
                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="font-label-caps text-[10px] text-on-surface-variant bg-surface-container px-3 py-1 rounded-full uppercase">
                            {new Date(message.dateEnvoi).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex items-end gap-3 w-full max-w-3xl ${isMine ? 'ml-auto justify-end' : ''}`}>
                        {!isMine && (
                          <img src={avatarOf(message.expediteur)} alt="" className="w-8 h-8 rounded-full object-cover mb-1 opacity-80 border border-surface-variant" />
                        )}
                        
                        <div className={`flex flex-col gap-1 max-w-[75%] md:max-w-[70%] ${isMine ? 'items-end' : ''}`}>
                          <div className={`font-body-md text-sm p-3 md:p-4 rounded-2xl ${isMine ? 'bg-primary-fixed-dim text-black rounded-br-sm shadow-sm' : 'bg-surface-container text-on-surface rounded-bl-sm border border-surface-variant'}`}>
                            {message.mediaUrl && (
                              <img src={message.mediaUrl} alt="" className="max-w-full rounded-lg mb-2" />
                            )}
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.contenu}</p>
                          </div>
                          <span className={`font-label-caps text-[10px] text-on-surface-variant flex items-center gap-1 ${isMine ? 'mr-1' : 'ml-1'}`}>
                            {new Date(message.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {isMine && <span className="material-symbols-outlined text-[12px] text-primary-fixed-dim">done_all</span>}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-surface border-t border-surface-variant sticky bottom-0 z-20">
                <form 
                  onSubmit={handleSend}
                  className="max-w-4xl mx-auto flex items-end gap-2 bg-surface-container border border-surface-variant rounded-xl p-2 focus-within:border-primary-fixed-dim focus-within:ring-1 focus-within:ring-primary-fixed-dim transition-all"
                >
                  <button type="button" className="p-2 text-on-surface-variant hover:text-primary-fixed-dim transition-colors rounded-lg hover:bg-surface-variant hidden md:block">
                    <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                  </button>
                  <button type="button" className="p-2 text-on-surface-variant hover:text-primary-fixed-dim transition-colors rounded-lg hover:bg-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>
                  
                  <textarea
                    className="flex-1 bg-transparent border-none text-on-surface font-body-md text-body-md resize-none max-h-32 focus:ring-0 px-2 py-2 placeholder:text-on-surface-variant/60 focus:outline-none"
                    placeholder="Écrivez un message..."
                    rows={1}
                    style={{ minHeight: '40px' }}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    autoFocus
                  />
                  
                  <button type="button" className="p-2 text-on-surface-variant hover:text-primary-fixed-dim transition-colors rounded-lg hover:bg-surface-variant mr-1 hidden md:block">
                    <span className="material-symbols-outlined text-[20px]">mood</span>
                  </button>
                  
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="bg-primary-fixed-dim text-black p-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm disabled:opacity-50 disabled:bg-surface-variant disabled:text-on-surface-variant"
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    )}
                  </button>
                </form>
                <div className="text-center mt-2 hidden md:block">
                  <span className="font-label-caps text-[10px] text-on-surface-variant">Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
