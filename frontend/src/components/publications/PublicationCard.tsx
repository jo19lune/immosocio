import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import './PublicationCard.css';

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
}

export default function PublicationCard({ publication, onDelete, onUpdate }: Props) {
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

  // ── Édition inline
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(publication.contenu);
  const [currentContenu, setCurrentContenu] = useState(publication.contenu);
  const [savingEdit, setSavingEdit] = useState(false);

  const avatarUrl = (auteur: Auteur) =>
    auteur.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(auteur.prenom + '+' + auteur.nom)}&background=3B6CF8&color=fff&bold=true`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    if (loadingLike) return;
    setLoadingLike(true);
    try {
      const { data } = await api.post(`/publications/${publication.id}/like`);
      setLiked(data.liked);
      setLikeCount(data.total);
    } catch { /* silencieux */ }
    finally { setLoadingLike(false); }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const { data } = await api.get(`/publications/${publication.id}/commentaires`);
        setComments(data.content || []);
      } catch { /* silencieux */ }
      finally { setLoadingComments(false); }
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/publications/${publication.id}/commentaires`, {
        contenu: commentText,
      });
      setComments((prev) => [...prev, data]);
      setCommentCount((c) => c + 1);
      setCommentText('');
    } catch { /* silencieux */ }
  };

  const canDelete = user && (user.id === publication.auteur.id || user.role === 'ADMIN');
  const canEdit = user && user.id === publication.auteur.id;

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette publication ?')) return;
    try {
      await api.delete(`/publications/${publication.id}`);
      onDelete?.(publication.id);
    } catch { /* silencieux */ }
  };

  const startEdit = () => {
    setEditText(currentContenu);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      const { data } = await api.put(`/publications/${publication.id}`, { contenu: editText });
      setCurrentContenu(data.contenu);
      onUpdate?.({ ...publication, contenu: data.contenu });
      setEditing(false);
    } catch {
      alert('Erreur lors de la modification.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <article className="pub-card card fade-in">
      {/* Header */}
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
                {publication.visibilite === 'PUBLIC' ? '🌍 Public' : '👥 Membres'}
              </span>
            </div>
          </div>
        </Link>
        <div className="pub-header-actions">
          {canEdit && !editing && (
            <button className="pub-edit-btn" onClick={startEdit} title="Modifier">✏️</button>
          )}
          {canDelete && (
            <button className="pub-delete-btn" onClick={handleDelete} title="Supprimer">✕</button>
          )}
        </div>
      </div>

      {/* Contenu / Édition inline */}
      <div className="pub-content">
        {editing ? (
          <div className="pub-edit-area">
            <textarea
              className="form-input pub-edit-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="pub-edit-actions">
              <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={savingEdit}>
                Annuler
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={saveEdit}
                disabled={savingEdit || !editText.trim()}
              >
                {savingEdit ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <p>{currentContenu}</p>
        )}
      </div>

      {/* Médias */}
      {publication.medias && publication.medias.length > 0 && (
        <div className={`pub-medias count-${Math.min(publication.medias.length, 4)}`}>
          {publication.medias.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="pub-media-img" />
          ))}
        </div>
      )}

      {/* Annonce intégrée */}
      {publication.annonce && (
        <div className="pub-embedded-annonce" onClick={() => navigate('/annonces')}>
          <div className="pub-embedded-img">
            {publication.annonce.photos && publication.annonce.photos.length > 0 ? (
              <img src={publication.annonce.photos[0]} alt="" />
            ) : (
              <div className="pub-embedded-placeholder">🏠</div>
            )}
          </div>
          <div className="pub-embedded-body">
            <h4>{publication.annonce.titre}</h4>
            <p>📍 {publication.annonce.ville}</p>
            <strong>{Number(publication.annonce.prix).toLocaleString('fr-FR')} Ar</strong>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pub-actions">
        <button
          className={`pub-action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={loadingLike}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likeCount > 0 ? likeCount : ''} J'aime</span>
        </button>
        <button className="pub-action-btn" onClick={toggleComments}>
          <span>💬</span>
          <span>{commentCount > 0 ? commentCount : ''} Commenter</span>
        </button>
      </div>

      {/* Section commentaires */}
      {showComments && (
        <div className="pub-comments">
          {loadingComments && <div className="spinner" style={{ margin: '12px auto' }} />}

          {comments.map((c) => (
            <div key={c.id} className="comment">
              <img
                src={avatarUrl(c.auteur)}
                alt=""
                className="avatar"
                width={32}
                height={32}
              />
              <div className="comment-bubble">
                <span className="comment-author">
                  {c.auteur.prenom} {c.auteur.nom}
                </span>
                <span className="comment-text">{c.contenu}</span>
                <span className="comment-time">{formatDate(c.dateCreation)}</span>
              </div>
            </div>
          ))}

          {user ? (
            <form className="comment-form" onSubmit={handleComment}>
              <img
                src={avatarUrl({ id: user.id, nom: user.nom, prenom: user.prenom, photo: user.photo })}
                alt=""
                className="avatar"
                width={32}
                height={32}
              />
              <input
                className="comment-input form-input"
                placeholder="Écrire un commentaire…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!commentText.trim()}>
                ➤
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
