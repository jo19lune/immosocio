import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan, faBed, faCamera, faHouse, faLocationDot, faMessage, faRulerCombined,
  faEllipsisV, faPencil, faTrash, faReply, faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import {
  faHeart as faHeartRegular,
  faCommentDots as faCommentDotsRegular,
} from '@fortawesome/free-regular-svg-icons';
import {
  faHeart as faHeartSolid,
  faShareNodes,
  faCommentDots as faCommentDotsSolid,
} from '@fortawesome/free-solid-svg-icons';


import Lightbox from '../components/Lightbox';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { emitAppRefresh } from '../lib/appEvents';
import followFillSvg from '../assets/follow_fill.svg';
import followLineSvg from '../assets/follow_line.svg';
import '../styles/pages/AnnonceDetailsPage.css';

interface Owner {
  id: number;
  nom: string;
  prenom: string;
  photo?: string;
}

interface Annonce {
  id: number;
  titre: string;
  description: string;
  ville: string;
  pays: string;
  prix: number;
  nombrePieces: number;
  superficie: number;
  typeLogement: string;
  photos: string[];
  statut: string;
  quantiteDisponible: number;
  suivi?: boolean;
  followerCount?: number;
  likeCount?: number;
  commentCount?: number;
  liked?: boolean;
  proprietaire: Owner;
}

interface Commentaire {
  id: number;
  contenu: string;
  dateCreation: string;
  dateModification?: string;
  auteur: { id: number; nom: string; prenom: string; photo?: string };
  parentId?: number | null;
  reponseCount?: number;
}



export default function AnnonceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [annonce, setAnnonce]     = useState<Annonce | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Follow annonce
  const [updatingFollow, setUpdatingFollow] = useState(false);
  const [isFollowing, setIsFollowing]       = useState(false);

  // Follow owner (compte propriétaire)
  const [followingOwner, setFollowingOwner]     = useState(false);
  const [loadingFollowOwner, setLoadingFollowOwner] = useState(false);

  // Like
  const [likeCount, setLikeCount]     = useState(0);
  const [liked, setLiked]             = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  // Comments
  const [showComments, setShowComments]       = useState(false);
  const [comments, setComments]               = useState<Commentaire[]>([]);
  const [commentText, setCommentText]         = useState('');
  const [commentCount, setCommentCount]       = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);

  // Comment edit / delete / reply
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editText, setEditText]     = useState('');
  const [replyToId, setReplyToId]   = useState<number | null>(null);
  const [replyText, setReplyText]   = useState('');
  const [replies, setReplies]       = useState<Record<number, Commentaire[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
  const [menuOpen, setMenuOpen]     = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const Layout = ({ children }: any) => <>{children}</>;

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchAnnonce = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/annonces/${id}`);
      setAnnonce(data);
      setIsFollowing(Boolean(data?.suivi));
      setLikeCount(data?.likeCount || 0);
      setLiked(Boolean(data?.liked));
      setCommentCount(data?.commentCount || 0);
    } catch {
      navigate('/annonces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnonce(); }, [id]);

  useEffect(() => {
    if (annonce) setIsFollowing(Boolean(annonce.suivi));
  }, [annonce?.id, annonce?.suivi]);

  // Check follow owner status
  useEffect(() => {
    if (!user || !annonce || user.id === annonce.proprietaire.id) return;
    api.get(`/utilisateurs/${annonce.proprietaire.id}/suivi`)
      .then(({ data }) => setFollowingOwner(Boolean(data?.suivi)))
      .catch(() => {});
  }, [user, annonce?.proprietaire.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!annonce) return;
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: annonce.titre, url }); return; }
    } catch { /* fall through */ }
    await navigator.clipboard.writeText(url);
    alert("Lien de l'annonce copié.");
  };

  const handleFollow = async () => {
    if (!annonce || !user) { navigate('/login'); return; }
    setUpdatingFollow(true);
    try {
      const { data } = await api.post(`/annonces/${annonce.id}/suivre`);
      const next = Boolean(data?.suivi);
      setIsFollowing(next);
      setAnnonce(prev => prev ? {
        ...prev,
        suivi: next,
        followerCount: typeof data?.followers === 'number' ? data.followers : prev.followerCount,
      } : prev);
      emitAppRefresh('annonces', { source: 'local', payload: { annonceId: annonce.id, suivi: next } });
    } catch {
      alert("Impossible de mettre à jour le suivi pour l'instant.");
    } finally {
      setUpdatingFollow(false);
    }
  };

  const handleFollowOwner = async () => {
    if (!annonce || !user) { navigate('/login'); return; }
    if (loadingFollowOwner) return;
    setLoadingFollowOwner(true);
    try {
      const { data } = await api.post(`/utilisateurs/${annonce.proprietaire.id}/suivre`);
      setFollowingOwner(Boolean(data?.suivi));
    } catch { /* silent */ } finally {
      setLoadingFollowOwner(false);
    }
  };

  const handleLike = async () => {
    if (!annonce) return;
    if (!user) { navigate('/login'); return; }
    if (loadingLike) return;
    // Optimistic update
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setLoadingLike(true);
    try {
      const { data } = await api.post(`/annonces/${annonce.id}/like`);
      setLiked(Boolean(data?.liked));
      setLikeCount(data?.total ?? prevCount);
      setAnnonce(prev => prev ? { ...prev, liked: Boolean(data?.liked), likeCount: data?.total } : prev);
      emitAppRefresh('annonces', { source: 'local', payload: { annonceId: annonce.id } });
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLoadingLike(false);
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const { data } = await api.get(`/annonces/${annonce!.id}/commentaires`);
        setComments(data.content || []);
      } catch { /* silent */ } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(s => !s);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/annonces/${annonce!.id}/commentaires`, { contenu: commentText });
      setComments(prev => [...prev, { ...data, reponseCount: 0 }]);
      setCommentCount(c => c + 1);
      setCommentText('');
      setAnnonce(prev => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
    } catch { /* silent */ }
  };

  const handleEditSave = async (commentaireId: number) => {
    if (!editText.trim()) return;
    try {
      const { data } = await api.put(`/annonces/${annonce!.id}/commentaires/${commentaireId}`, { contenu: editText });
      setComments(prev => prev.map(c =>
        c.id === commentaireId ? { ...c, contenu: data.contenu, dateModification: data.dateModification } : c
      ));
      setEditingId(null);
    } catch { /* silent */ }
  };

  const handleDelete = async (commentaireId: number) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      await api.delete(`/annonces/${annonce!.id}/commentaires/${commentaireId}`);
      setComments(prev => prev.filter(c => c.id !== commentaireId));
      setCommentCount(c => Math.max(0, c - 1));
      setAnnonce(prev => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 1) - 1) } : prev);
    } catch { /* silent */ }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const { data } = await api.post(`/annonces/${annonce!.id}/commentaires/${parentId}/reponses`, { contenu: replyText });
      setReplies(prev => ({ ...prev, [parentId]: [...(prev[parentId] || []), data] }));
      setComments(prev => prev.map(c => c.id === parentId ? { ...c, reponseCount: (c.reponseCount || 0) + 1 } : c));
      setReplyText('');
      setReplyToId(null);
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
    } catch { /* silent */ }
  };

  const loadReplies = async (parentId: number) => {
    if (expandedReplies[parentId]) {
      setExpandedReplies(prev => ({ ...prev, [parentId]: false }));
      return;
    }
    try {
      const { data } = await api.get(`/annonces/${annonce!.id}/commentaires/${parentId}/reponses`);
      setReplies(prev => ({ ...prev, [parentId]: data }));
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
    } catch { /* silent */ }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="annonce-details-loading"><div className="spinner" /></div>;
  }
  if (!annonce) return null;

  const photos = annonce.photos || [];
  const isUnavailable = annonce.statut !== 'DISPONIBLE' || annonce.quantiteDisponible <= 0;
  const canFollow     = Boolean(user && user.id !== annonce.proprietaire.id);
  const canMessage    = Boolean(user && user.id !== annonce.proprietaire.id);
  const canReserve    = Boolean(user?.role === 'LOCATAIRE' && !isUnavailable);
  const canFollowOwner = canFollow;

  const ownerAvatar = annonce.proprietaire.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${annonce.proprietaire.prenom}+${annonce.proprietaire.nom}`
    )}&background=09244B&color=fff`;

  return (
    <Layout>
      <div className="annonce-details-page">
        <div className="annonce-details-shell">
          <div className="annonce-details-grid">

            {/* Galerie */}
            <section className="annonce-gallery">
              <button
                type="button"
                className="annonce-hero-media card"
                onClick={() => photos.length > 0 && setShowLightbox(true)}
              >
                {photos.length > 0 ? (
                  <img src={photos[activeImg]} alt={`${annonce.titre} - photo ${activeImg + 1}`} className="annonce-hero-image" />
                ) : (
                  <div className="annonce-hero-placeholder">
                    <FontAwesomeIcon icon={faHouse} />
                    <span>Aucune photo</span>
                  </div>
                )}
                {photos.length > 0 && (
                  <span className="annonce-hero-count">
                    <FontAwesomeIcon icon={faCamera} />
                    {photos.length} photo{photos.length > 1 ? 's' : ''}
                  </span>
                )}
              </button>

              {photos.length > 1 && (
                <div className="annonce-thumbnails">
                  {photos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      className={`annonce-thumbnail ${index === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(index)}
                    >
                      <img src={photo} alt={`${annonce.titre} - miniature ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Infos */}
            <aside className="annonce-info-side">
              <div className="card annonce-details-card">
                <div className="annonce-heading-row">
                  <span className="badge badge-primary">{annonce.typeLogement}</span>
                  <span className={`annonce-status ${isUnavailable ? 'unavailable' : 'available'}`}>
                    {isUnavailable ? annonce.statut : 'Disponible'}
                  </span>
                </div>

                <h1 className="annonce-details-title">{annonce.titre}</h1>

                <p className="annonce-details-location">
                  <FontAwesomeIcon icon={faLocationDot} />
                  {annonce.ville}{annonce.pays ? `, ${annonce.pays}` : ''}
                </p>

                <div className="annonce-price">
                  {Number(annonce.prix).toLocaleString('fr-FR')} <small>Ar</small>
                </div>

                <div className="annonce-metrics">
                  <div className="annonce-metric card">
                    <span>Surface</span>
                    <strong><FontAwesomeIcon icon={faRulerCombined} /> {annonce.superficie} m²</strong>
                  </div>
                  <div className="annonce-metric card">
                    <span>Pièces</span>
                    <strong><FontAwesomeIcon icon={faBed} /> {annonce.nombrePieces}</strong>
                  </div>
                </div>

                <div className="annonce-availability-card">
                  <span>Disponibilité actuelle</span>
                  <strong>{annonce.quantiteDisponible} unité(s) restantes</strong>
                  {typeof annonce.followerCount === 'number' && annonce.followerCount > 0 && (
                    <small>{annonce.followerCount} utilisateur(s) suivent cette annonce.</small>
                  )}
                </div>

                {isUnavailable && (
                  <div className="annonce-warning">
                    <FontAwesomeIcon icon={faBan} />
                    Cette annonce est suspendue. La réservation est désactivée.
                  </div>
                )}

                <div className="annonce-actions-stack">
                  <button
                    className="btn btn-primary btn-lg annonce-primary-action"
                    onClick={() =>
                      canReserve
                        ? navigate(`/reservations/nouvelle?annonceId=${annonce.id}`)
                        : !user ? navigate('/login') : undefined
                    }
                    disabled={Boolean(user) && !canReserve}
                  >
                    {user
                      ? canReserve ? 'Réserver maintenant' : 'Réservation indisponible'
                      : 'Connectez-vous pour réserver'}
                  </button>

                  <div className="annonce-secondary-actions">
                    {/* Like — optimistic update, pas de reload */}
                    <button
                      type="button"
                      className={`btn btn-ghost annonce-like-btn ${liked ? 'active' : ''}`}
                      onClick={handleLike}
                      disabled={loadingLike}
                      title="J'aime"
                    >
                      <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartRegular} />
                      {likeCount > 0 && <span className="count">{likeCount}</span>}
                    </button>

                    {/* Commentaires */}
                    <button
                      type="button"
                      className={`btn btn-ghost annonce-comment-btn ${showComments ? 'active' : ''}`}
                      onClick={toggleComments}
                      title="Commentaires"
                    >
                      <FontAwesomeIcon icon={showComments ? faCommentDotsSolid : faCommentDotsRegular} />
                      {commentCount > 0 && <span className="count">{commentCount}</span>}
                    </button>

                    {/* Suivre annonce (dispo) */}
                    {canFollow && (
                      <button
                        type="button"
                        className={`btn btn-ghost annonce-follow-btn ${isFollowing ? 'active' : ''}`}
                        onClick={handleFollow}
                        disabled={updatingFollow}
                        title={isFollowing ? 'Ne plus suivre l\'annonce' : 'Suivre l\'annonce'}
                      >
                        <FontAwesomeIcon icon={faHeartSolid} />
                        {isFollowing ? 'Annonce suivie' : 'Suivre'}
                      </button>
                    )}

                    <button type="button" className="btn btn-ghost" onClick={handleShare}>
                      <FontAwesomeIcon icon={faShareNodes} />
                      Partager
                    </button>

                    {canMessage ? (
                      <Link
                        to={`/messages/${annonce.proprietaire.id}`}
                        className="btn btn-secondary annonce-contact-btn"
                      >
                        <FontAwesomeIcon icon={faMessage} />
                        Contacter
                      </Link>
                    ) : !user ? (
                      <button
                        type="button"
                        className="btn btn-secondary annonce-contact-btn"
                        onClick={() => navigate('/login')}
                      >
                        <FontAwesomeIcon icon={faMessage} />
                        Se connecter
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Propriétaire */}
              <div className="card annonce-owner-card">
                <img src={ownerAvatar} alt="" className="avatar" width={52} height={52} />
                <div className="annonce-owner-info">
                  <div className="annonce-owner-label">Propriétaire</div>
                  <div className="annonce-owner-name">
                    {annonce.proprietaire.prenom} {annonce.proprietaire.nom}
                  </div>
                </div>
                {/* Suivre le compte propriétaire */}
                {canFollowOwner && (
                  <button
                    className={`btn btn-sm ${followingOwner ? 'btn-primary' : 'btn-ghost'} follow-owner-btn`}
                    onClick={handleFollowOwner}
                    disabled={loadingFollowOwner}
                    title={followingOwner ? 'Ne plus suivre ce compte' : 'Suivre ce compte pour recevoir ses nouvelles annonces'}
                  >
                    <img
                      src={followingOwner ? followFillSvg : followLineSvg}
                      alt=""
                      width={14}
                      height={14}
                      style={{ display: 'inline', marginRight: 4 }}
                    />
                    {followingOwner ? 'Suivi' : 'Suivre le compte'}
                  </button>
                )}
              </div>
            </aside>
          </div>

          {/* Description */}
          <section className="card annonce-description-card">
            <h2>Description</h2>
            <p>{annonce.description}</p>
          </section>

          {/* ── Section commentaires ── */}
          {showComments && (
            <div className="annonce-comments card" onClick={e => e.stopPropagation()}>
              <div className="comments-header">
                <h4>Commentaires ({commentCount})</h4>
              </div>

              <div className="comments-list" ref={menuRef}>
                {loadingComments ? (
                  <div className="spinner" style={{ margin: '20px auto' }} />
                ) : comments.length === 0 ? (
                  <p className="no-comments">Aucun commentaire pour le moment.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="comment-item">
                      {/* En-tête */}
                      <div className="comment-header-row">
                        <div className="comment-author">
                          <strong>{c.auteur?.prenom} {c.auteur?.nom}</strong>
                          <small>{new Date(c.dateCreation).toLocaleDateString('fr-FR')}</small>
                          {c.dateModification && <small className="edited-label">(modifié)</small>}
                        </div>

                        {user && user.id === c.auteur?.id && (
                          <div className="comment-menu-wrapper" style={{ position: 'relative' }}>
                            <button
                              className="icon-btn-xs"
                              onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                            >
                              <FontAwesomeIcon icon={faEllipsisV} />
                            </button>
                            {menuOpen === c.id && (
                              <div className="comment-dropdown">
                                <button
                                  className="dropdown-item"
                                  onClick={() => { setEditingId(c.id); setEditText(c.contenu); setMenuOpen(null); }}
                                >
                                  <FontAwesomeIcon icon={faPencil} /> Modifier
                                </button>
                                <button
                                  className="dropdown-item danger"
                                  onClick={() => { handleDelete(c.id); setMenuOpen(null); }}
                                >
                                  <FontAwesomeIcon icon={faTrash} /> Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contenu / édition */}
                      {editingId === c.id ? (
                        <div className="comment-edit-form">
                          <input
                            className="comment-input"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            autoFocus
                          />
                          <div className="comment-edit-actions">
                            <button className="btn btn-primary btn-xs" onClick={() => handleEditSave(c.id)}>Enregistrer</button>
                            <button className="btn btn-ghost btn-xs" onClick={() => setEditingId(null)}>Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <p className="comment-content">{c.contenu}</p>
                      )}

                      {/* Répondre + voir réponses */}
                      <div className="comment-actions-row">
                        {user && (
                          <button
                            className="comment-reply-btn"
                            onClick={() => setReplyToId(replyToId === c.id ? null : c.id)}
                          >
                            <FontAwesomeIcon icon={faReply} /> Répondre
                          </button>
                        )}
                        {(c.reponseCount ?? 0) > 0 && (
                          <button
                            className="comment-show-replies-btn"
                            onClick={() => loadReplies(c.id)}
                          >
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              style={{ transform: expandedReplies[c.id] ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                            />
                            {expandedReplies[c.id] ? 'Masquer' : `${c.reponseCount} réponse${(c.reponseCount ?? 0) > 1 ? 's' : ''}`}
                          </button>
                        )}
                      </div>

                      {/* Formulaire réponse */}
                      {replyToId === c.id && user && (
                        <form className="reply-form" onSubmit={e => handleReplySubmit(e, c.id)}>
                          <input
                            className="comment-input"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder={`Répondre à ${c.auteur?.prenom}…`}
                            autoFocus
                          />
                          <button type="submit" className="btn btn-primary btn-xs" disabled={!replyText.trim()}>Envoyer</button>
                          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setReplyToId(null)}>Annuler</button>
                        </form>
                      )}

                      {/* Réponses imbriquées */}
                      {expandedReplies[c.id] && replies[c.id]?.length > 0 && (
                        <div className="replies-list">
                          {replies[c.id].map(r => (
                            <div key={r.id} className="comment-item reply-item">
                              <div className="comment-author">
                                <strong>{r.auteur?.prenom} {r.auteur?.nom}</strong>
                                <small>{new Date(r.dateCreation).toLocaleDateString('fr-FR')}</small>
                              </div>
                              <p className="comment-content">{r.contenu}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Nouveau commentaire */}
              {user ? (
                <form onSubmit={handleComment} className="comment-form">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Écrire un commentaire..."
                    className="comment-input"
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!commentText.trim()}>
                    Envoyer
                  </button>
                </form>
              ) : (
                <p className="login-prompt">
                  <Link to="/login">Connectez-vous</Link> pour commenter.
                </p>
              )}
            </div>
          )}
        </div>

        {showLightbox && photos.length > 0 && (
          <Lightbox
            images={photos}
            currentIndex={activeImg}
            onClose={() => setShowLightbox(false)}
            onNext={() => setActiveImg(prev => (prev + 1) % photos.length)}
            onPrev={() => setActiveImg(prev => (prev - 1 + photos.length) % photos.length)}
          />
        )}
      </div>
    </Layout>
  );
}
