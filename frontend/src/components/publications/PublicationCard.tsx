import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlobe,
  faLocationDot,
  faPaperPlane,
  faPenToSquare,
  faTrashCan,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
  faCommentDots as faCommentDotsRegular,
  faHeart as faHeartRegular,
} from '@fortawesome/free-regular-svg-icons';
import {
  faCommentDots as faCommentDotsSolid,
  faHeart as faHeartSolid,
  faHouse,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { emitAppRefresh } from '../../lib/appEvents';


interface Auteur {
  id: number;
  nom: string;
  prenom: string;
  photo?: string;
}

interface Publication {
  id: number;
  contenu: string;
  medias?: string[];
  visibilite: string;
  dateCreation: string;
  auteur: Auteur;
  likeCount?: number;
  commentCount?: number;
  liked?: boolean;
  annonce?: any;
}

interface Props {
  publication: Publication;
  onDelete?: (id: number) => void;
  onUpdate?: (pub: Publication) => void;
  domId?: string;
  highlighted?: boolean;
}

export default function PublicationCard({
  publication,
  onDelete,
  onUpdate,
  domId,
  highlighted = false,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(publication.likeCount || 0);
  const [liked, setLiked] = useState(publication.liked || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(publication.commentCount || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(publication.contenu);
  const [currentContenu, setCurrentContenu] = useState(publication.contenu);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    setLikeCount(publication.likeCount || 0);
    setLiked(publication.liked || false);
    setCommentCount(publication.commentCount || 0);
    setCurrentContenu(publication.contenu);
    setEditText(publication.contenu);
  }, [
    publication.id,
    publication.likeCount,
    publication.liked,
    publication.commentCount,
    publication.contenu,
  ]);

  const avatarUrl = (auteur: Auteur) =>
    auteur.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${auteur.prenom}+${auteur.nom}`
    )}&background=3B6CF8&color=fff&bold=true`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return "A l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (loadingLike) {
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;

    // Optimistic update
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setLoadingLike(true);

    try {
      const { data } = await api.post(`/publications/${publication.id}/like`);
      setLiked(data.liked);
      setLikeCount(data.total);
      emitAppRefresh(['publications', 'profile'], {
        source: 'local',
        payload: { publicationId: publication.id, liked: data.liked, likeCount: data.total },
      });
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      console.error('Like action failed:', error);
      alert('Erreur lors de l\'action J\'aime.');
    } finally {
      setLoadingLike(false);
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const { data } = await api.get(`/publications/${publication.id}/commentaires`);
        setComments(data.content || []);
      } catch {
        // silent background refresh
      } finally {
        setLoadingComments(false);
      }
    }

    setShowComments(!showComments);
  };

  const handleComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentText.trim()) {
      return;
    }

    const newCommentText = commentText.trim();
    setCommentText('');

    const tempId = Date.now();
    const tempComment = {
      id: tempId,
      contenu: newCommentText,
      dateCreation: new Date().toISOString(),
      auteur: { id: user.id, nom: user.nom, prenom: user.prenom, photo: user.photo }
    };

    setComments((prev) => [...prev, tempComment]);
    setCommentCount((prev) => prev + 1);

    try {
      const { data } = await api.post(`/publications/${publication.id}/commentaires`, {
        contenu: newCommentText,
      });
      setComments((prev) => prev.map((c) => c.id === tempId ? data : c));
      emitAppRefresh(['publications', 'profile'], {
        source: 'local',
        payload: { publicationId: publication.id, commentCount: commentCount + 1 },
      });
    } catch (error) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentCount((prev) => Math.max(0, prev - 1));
      setCommentText(newCommentText);
      console.error('Comment action failed:', error);
      alert('Erreur lors de l\'ajout du commentaire.');
    }
  };

  const canDelete = user && (user.id === publication.auteur.id || user.role === 'ADMIN');
  const canEdit = user && user.id === publication.auteur.id;

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette publication ?')) {
      return;
    }

    try {
      await api.delete(`/publications/${publication.id}`);
      onDelete?.(publication.id);
      emitAppRefresh(['publications', 'profile'], {
        source: 'local',
        payload: { publicationId: publication.id },
      });
    } catch {
      // silent background refresh
    }
  };

  const saveEdit = async () => {
    if (!editText.trim()) {
      return;
    }

    setSavingEdit(true);
    try {
      const { data } = await api.put(`/publications/${publication.id}`, { contenu: editText });
      setCurrentContenu(data.contenu);
      onUpdate?.({ ...publication, contenu: data.contenu });
      setEditing(false);
      emitAppRefresh(['publications', 'profile'], {
        source: 'local',
        payload: { publicationId: publication.id },
      });
    } catch {
      alert('Erreur lors de la modification.');
    } finally {
      setSavingEdit(false);
    }
  };

  const visibleMedias = publication.medias?.slice(0, 4) || [];
  const hiddenMediaCount = Math.max(0, (publication.medias?.length || 0) - visibleMedias.length);

  return (
    <article
      id={domId}
      className={`pub-card card fade-in ${highlighted ? 'highlighted' : ''}`}
    >
      <div className="pub-header">
        <Link to={`/profil/${publication.auteur.id}`} className="pub-author-link">
          <img
            src={avatarUrl(publication.auteur)}
            alt=""
            className="avatar"
            width={42}
            height={42}
          />
          <div>
            <div className="pub-author-name">
              {publication.auteur.prenom} {publication.auteur.nom}
            </div>
            <div className="pub-meta">
              <span>{formatDate(publication.dateCreation)}</span>
              <span className="pub-visibility">
                <FontAwesomeIcon
                  icon={publication.visibilite === 'PUBLIC' ? faGlobe : faUsers}
                />
                {publication.visibilite === 'PUBLIC' ? 'Public' : 'Membres'}
              </span>
            </div>
          </div>
        </Link>

        <div className="pub-header-actions">
          {canEdit && !editing && (
            <button className="pub-edit-btn" onClick={() => setEditing(true)} title="Modifier">
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          )}
          {canDelete && (
            <button className="pub-delete-btn" onClick={handleDelete} title="Supprimer">
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
          )}
        </div>
      </div>

      <div className="pub-content">
        {editing ? (
          <div className="pub-edit-area">
            <textarea
              className="form-input pub-edit-textarea"
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              rows={4}
              autoFocus
            />
            <div className="pub-edit-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(false)}
                disabled={savingEdit}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={saveEdit}
                disabled={savingEdit || !editText.trim()}
              >
                {savingEdit ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <p>{currentContenu}</p>
        )}
      </div>

      {visibleMedias.length > 0 && (
        <div className={`pub-medias count-${Math.min(visibleMedias.length, 4)}`}>
          {visibleMedias.map((url, index) => {
            const showMoreOverlay = index === visibleMedias.length - 1 && hiddenMediaCount > 0;
            return (
              <div key={`${publication.id}-${index}`} className="pub-media-tile">
                <img src={url} alt="" className="pub-media-img" />
                {showMoreOverlay && (
                  <span className="pub-media-more">+{hiddenMediaCount}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {publication.annonce && (
        <div
          className="pub-embedded-annonce"
          onClick={() => navigate(`/annonces/${publication.annonce.id}`)}
        >
          <div className="pub-embedded-img">
            {publication.annonce.photos && publication.annonce.photos.length > 0 ? (
              <img src={publication.annonce.photos[0]} alt="" />
            ) : (
              <div className="pub-embedded-placeholder">
                <FontAwesomeIcon icon={faHouse} />
              </div>
            )}
          </div>
          <div className="pub-embedded-body">
            <h4>{publication.annonce.titre}</h4>
            <p className="pub-embedded-location">
              <FontAwesomeIcon icon={faLocationDot} />
              {publication.annonce.ville}
            </p>
            <strong>{Number(publication.annonce.prix).toLocaleString('fr-FR')} Ar</strong>
          </div>
        </div>
      )}

      <div className="pub-actions">
        <button
          className={`pub-action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={loadingLike}
        >
          <FontAwesomeIcon
            icon={liked ? faHeartSolid : faHeartRegular}
            className={liked ? 'bounce-in' : ''}
          />
          <span>{likeCount > 0 ? `${likeCount} J'aime` : "J'aime"}</span>
        </button>
        <button className="pub-action-btn" onClick={toggleComments}>
          <FontAwesomeIcon icon={showComments ? faCommentDotsSolid : faCommentDotsRegular} />
          <span>{commentCount > 0 ? `${commentCount} Commentaires` : 'Commenter'}</span>
        </button>
      </div>

      {showComments && (
        <div className="pub-comments">
          {loadingComments && <div className="spinner" style={{ margin: '12px auto' }} />}

          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <img
                src={avatarUrl(comment.auteur)}
                alt=""
                className="avatar"
                width={32}
                height={32}
              />
              <div className="comment-bubble">
                <span className="comment-author">
                  {comment.auteur.prenom} {comment.auteur.nom}
                </span>
                <span className="comment-text">{comment.contenu}</span>
                <span className="comment-time">{formatDate(comment.dateCreation)}</span>
              </div>
            </div>
          ))}

          {user ? (
            <form className="comment-form" onSubmit={handleComment}>
              <img
                src={avatarUrl({
                  id: user.id,
                  nom: user.nom,
                  prenom: user.prenom,
                  photo: user.photo,
                })}
                alt=""
                className="avatar"
                width={32}
                height={32}
              />
              <input
                className="comment-input form-input"
                placeholder="Ecrire un commentaire..."
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm comment-send-btn"
                disabled={!commentText.trim()}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
          ) : (
            <p className="comment-login-hint">
              <Link to="/login">Connectez-vous</Link> pour commenter.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
