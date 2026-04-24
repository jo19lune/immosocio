import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart as faHeartRegular,
  faCommentDots as faCommentDotsRegular,
} from '@fortawesome/free-regular-svg-icons';
import {
  faHeart as faHeartSolid,
  faCommentDots as faCommentDotsSolid,
  faShareNodes,
  faEllipsisV,
  faReply,
  faPencil,
  faTrash,
  faChevronDown,
  faSort,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';


import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { emitAppRefresh } from '../lib/appEvents';
import followFillSvg from '../assets/follow_fill.svg';
import followLineSvg from '../assets/follow_line.svg';
import homeLineSvg from '../assets/home_1_line.svg';
import '../styles/pages/AnnoncesPage.css';

interface Annonce {
  id: number;
  titre: string;
  description: string;
  adresse: string;
  ville: string;
  pays: string;
  prix: number;
  nombrePieces: number;
  superficie: number;
  typeLogement: string;
  photos: string[];
  statut: string;
  quantiteDisponible: number;
  dateCreation: string;
  suivi: boolean;
  likeCount?: number;
  commentCount?: number;
  liked?: boolean;
  proprietaire: { id: number; nom: string; prenom: string; photo?: string };
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

const typeLabels: Record<string, string> = {
  MAISON: 'Maison',
  APPARTEMENT: 'Appartement',
  STUDIO: 'Studio',
  VILLA: 'Villa',
  CHAMBRE: 'Chambre',
};

const sortOptions = [
  { value: 'DATE_DESC', label: 'Plus récentes' },
  { value: 'DATE_ASC',  label: 'Plus anciennes' },
  { value: 'PRIX_ASC',  label: 'Prix croissant' },
  { value: 'PRIX_DESC', label: 'Prix décroissant' },
];

export default function AnnoncesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    ville:   searchParams.get('ville')   || '',
    type:    searchParams.get('type')    || '',
    prixMin: searchParams.get('prixMin') || '',
    prixMax: searchParams.get('prixMax') || '',
  });

  const [tri, setTri] = useState(searchParams.get('tri') || 'DATE_DESC');

  const Wrapper = ({ children }: any) => <>{children}</>;

  const fetchAnnonces = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(searchParams);
      queryParams.set('page', String(p));
      queryParams.set('size', '12');
      queryParams.set('tri', tri);

      const isSearch = ['ville', 'type', 'prixMin', 'prixMax'].some(
        k => searchParams.get(k)
      );
      const endpoint = isSearch
        ? `/annonces/recherche?${queryParams}`
        : `/annonces?${queryParams}`;

      const { data } = await api.get(endpoint);
      const items = data.content || [];

      setAnnonces(prev => (reset ? items : [...prev, ...items]));
      setHasMore(!data.last);
      setPage(p);
    } catch (err) {
      console.error('Erreur chargement annonces', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnonces(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tri]);

  useAutoRefresh(() => {
    fetchAnnonces(0, true);
  }, ['annonces']);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams: Record<string, string> = {};
    if (filters.ville)   newParams.ville   = filters.ville;
    if (filters.type)    newParams.type    = filters.type;
    if (filters.prixMin) newParams.prixMin = filters.prixMin;
    if (filters.prixMax) newParams.prixMax = filters.prixMax;
    if (tri !== 'DATE_DESC') newParams.tri = tri;
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setFilters({ ville: '', type: '', prixMin: '', prixMax: '' });
    setTri('DATE_DESC');
    setSearchParams({});
  };

  return (
    <Wrapper>
      <div className="annonces-page fade-in">
        <header className="page-header">
          <h1 className="page-title">Découvrez nos annonces</h1>
          <p className="page-subtitle">Le logement de vos rêves n'est qu'à quelques clics.</p>
        </header>

        {/* Filtres */}
        <form className="filters-bar card" onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ville</label>
              <input
                className="form-input"
                placeholder="Ex: Antananarivo"
                value={filters.ville}
                onChange={e => setFilters(f => ({ ...f, ville: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={filters.type}
                onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
              >
                <option value="">Tous les types</option>
                {Object.entries(typeLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prix min (Ar)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={filters.prixMin}
                onChange={e => setFilters(f => ({ ...f, prixMin: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prix max (Ar)</label>
              <input
                type="number"
                className="form-input"
                placeholder="∞"
                value={filters.prixMax}
                onChange={e => setFilters(f => ({ ...f, prixMax: e.target.value }))}
              />
            </div>
            {/* Tri */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <FontAwesomeIcon icon={faSort} style={{ marginRight: 6 }} />
                Trier par
              </label>
              <select
                className="form-input"
                value={tri}
                onChange={e => setTri(e.target.value)}
              >
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">Rechercher</button>
            <button type="button" className="btn btn-ghost" onClick={resetFilters}>Réinitialiser</button>
          </div>
        </form>

        {/* Résultats */}
        <div className="annonces-header">
          <h2 className="annonces-count">
            {loading && annonces.length === 0
              ? 'Chargement…'
              : `${annonces.length} annonce${annonces.length !== 1 ? 's' : ''} trouvée${annonces.length !== 1 ? 's' : ''}`}
          </h2>
          {user?.role === 'PROPRIETAIRE' && (
            <Link to="/mes-annonces/nouvelle" className="btn btn-accent btn-sm">
              + Publier une annonce
            </Link>
          )}
        </div>

        {loading && annonces.length === 0 && (
          <div className="annonces-loading">
            <div className="spinner" />
            <span>Chargement des annonces…</span>
          </div>
        )}

        {!loading && annonces.length === 0 && (
          <div className="annonces-empty card">
            <img
              src={homeLineSvg}
              alt="Aucune annonce"
              width={56}
              height={56}
              style={{ opacity: 0.35, marginBottom: 12 }}
            />
            <p>Aucune annonce ne correspond à votre recherche.</p>
            <button className="btn btn-ghost" onClick={resetFilters}>Effacer les filtres</button>
          </div>
        )}

        <div className="annonces-grid">
          {annonces.map(a => (
            <AnnonceCard key={a.id} annonce={a} />
          ))}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button className="btn btn-ghost btn-lg" onClick={() => fetchAnnonces(page + 1, false)}>
              Voir plus d'annonces
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

// ─── AnnonceCard ──────────────────────────────────────────────────────────────

export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentImg, setCurrentImg] = useState(0);

  // Like state
  const [likeCount, setLikeCount]   = useState(annonce.likeCount || 0);
  const [liked, setLiked]           = useState(Boolean(annonce.liked));
  const [loadingLike, setLoadingLike] = useState(false);

  // Follow owner state
  const [followingOwner, setFollowingOwner]     = useState(false);
  const [loadingFollow, setLoadingFollow]       = useState(false);
  const canFollowOwner = Boolean(user && user.id !== annonce.proprietaire.id);

  // Comment state
  const [showComments, setShowComments]   = useState(false);
  const [comments, setComments]           = useState<Commentaire[]>([]);
  const [commentCount, setCommentCount]   = useState(annonce.commentCount || 0);
  const [commentText, setCommentText]     = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Comment edit
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editText, setEditText]       = useState('');
  // Comment reply
  const [replyToId, setReplyToId]     = useState<number | null>(null);
  const [replyText, setReplyText]     = useState('');
  // Replies map
  const [replies, setReplies]         = useState<Record<number, Commentaire[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
  const [menuOpen, setMenuOpen]       = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const photos = annonce.photos?.length > 0 ? annonce.photos : [];

  // Sync when annonce prop changes
  useEffect(() => {
    setLikeCount(annonce.likeCount || 0);
    setLiked(Boolean(annonce.liked));
    setCommentCount(annonce.commentCount || 0);
  }, [annonce.id, annonce.likeCount, annonce.liked, annonce.commentCount]);

  // Check follow owner status on mount
  useEffect(() => {
    if (!canFollowOwner) return;
    api.get(`/utilisateurs/${annonce.proprietaire.id}/suivi`)
      .then(({ data }) => setFollowingOwner(Boolean(data?.suivi)))
      .catch(() => {});
  }, [annonce.proprietaire.id, canFollowOwner]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Like ──────────────────────────────────────────────────────────────────
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (loadingLike) return;
    // Mise à jour optimiste
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setLoadingLike(true);
    try {
      const { data } = await api.post(`/annonces/${annonce.id}/like`);
      setLiked(Boolean(data?.liked));
      setLikeCount(data?.total ?? prevCount);
    } catch {
      // rollback
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLoadingLike(false);
    }
  };

  // ── Partager ──────────────────────────────────────────────────────────────
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    const contenu = window.prompt('Ajoutez un texte à votre partage :', "Découvrez cette excellente annonce !");
    if (contenu === null) return;
    try {
      await api.post('/publications', { contenu, annonceId: annonce.id, visibilite: 'PUBLIC' });
      emitAppRefresh(['publications', 'profile'], { source: 'local' });
      alert('Annonce partagée avec succès !');
    } catch {
      alert('Erreur lors du partage.');
    }
  };

  // ── Suivre propriétaire ───────────────────────────────────────────────────
  const handleFollowOwner = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (loadingFollow) return;
    setLoadingFollow(true);
    try {
      const { data } = await api.post(`/utilisateurs/${annonce.proprietaire.id}/suivre`);
      setFollowingOwner(Boolean(data?.suivi));
    } catch {
      // silent
    } finally {
      setLoadingFollow(false);
    }
  };

  // ── Commentaires ──────────────────────────────────────────────────────────
  const toggleComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const { data } = await api.get(`/annonces/${annonce.id}/commentaires`);
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
      const { data } = await api.post(`/annonces/${annonce.id}/commentaires`, { contenu: commentText });
      setComments(prev => [...prev, { ...data, reponseCount: 0 }]);
      setCommentCount(c => c + 1);
      setCommentText('');
    } catch { /* silent */ }
  };

  const handleEditSave = async (commentaireId: number) => {
    if (!editText.trim()) return;
    try {
      const { data } = await api.put(`/annonces/${annonce.id}/commentaires/${commentaireId}`, { contenu: editText });
      setComments(prev => prev.map(c => c.id === commentaireId ? { ...c, contenu: data.contenu, dateModification: data.dateModification } : c));
      setEditingId(null);
    } catch { /* silent */ }
  };

  const handleDelete = async (e: React.MouseEvent, commentaireId: number) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      await api.delete(`/annonces/${annonce.id}/commentaires/${commentaireId}`);
      setComments(prev => prev.filter(c => c.id !== commentaireId));
      setCommentCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const { data } = await api.post(`/annonces/${annonce.id}/commentaires/${parentId}/reponses`, { contenu: replyText });
      setReplies(prev => ({ ...prev, [parentId]: [...(prev[parentId] || []), data] }));
      setComments(prev => prev.map(c => c.id === parentId ? { ...c, reponseCount: (c.reponseCount || 0) + 1 } : c));
      setReplyText('');
      setReplyToId(null);
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
    } catch { /* silent */ }
  };

  const loadReplies = async (e: React.MouseEvent, parentId: number) => {
    e.stopPropagation();
    const alreadyOpen = expandedReplies[parentId];
    if (alreadyOpen) {
      setExpandedReplies(prev => ({ ...prev, [parentId]: false }));
      return;
    }
    try {
      const { data } = await api.get(`/annonces/${annonce.id}/commentaires/${parentId}/reponses`);
      setReplies(prev => ({ ...prev, [parentId]: data }));
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
    } catch { /* silent */ }
  };

  const isIndisponible = annonce.statut !== 'DISPONIBLE' || annonce.quantiteDisponible <= 0;

  return (
    <div
      className="annonce-card card"
      onClick={() => navigate(`/annonces/${annonce.id}`)}
      style={{ cursor: 'pointer' }}
    >
      {/* Image carousel */}
      <div className="annonce-card-img">
        {photos.length > 0 ? (
          <>
            <img src={photos[currentImg]} alt={annonce.titre} className="fade-in" key={currentImg} />
            {photos.length > 1 && (
              <>
                <button
                  className="carousel-btn prev"
                  onClick={e => { e.stopPropagation(); setCurrentImg(p => (p - 1 + photos.length) % photos.length); }}
                >‹</button>
                <button
                  className="carousel-btn next"
                  onClick={e => { e.stopPropagation(); setCurrentImg(p => (p + 1) % photos.length); }}
                >›</button>
                <div className="carousel-dots" onClick={e => e.stopPropagation()}>
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={`dot ${i === currentImg ? 'active' : ''}`}
                      onClick={e => { e.stopPropagation(); setCurrentImg(i); }}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>
              </>
            )}
            <span className="photos-count">
              <img src={homeLineSvg} alt="" width={12} style={{ filter: 'invert(1)', marginRight: 4 }} />
              {photos.length}
            </span>
          </>
        ) : (
          <div className="annonce-img-placeholder">
            <img src={homeLineSvg} alt="" width={40} height={40} style={{ opacity: 0.35 }} />
          </div>
        )}
        <span className="annonce-type-badge">{typeLabels[annonce.typeLogement] || annonce.typeLogement}</span>
        {isIndisponible && <span className="badge-overlay">{annonce.statut}</span>}
      </div>

      {/* Body */}
      <div className="annonce-card-body">
        <div className="annonce-card-header">
          <h3 className="annonce-card-title">{annonce.titre}</h3>
          <span className="annonce-card-prix">
            {Number(annonce.prix).toLocaleString('fr-FR')} <small>Ar</small>
          </span>
        </div>

        <p className="annonce-card-location">
          <img src={homeLineSvg} alt="" width={14} style={{ opacity: 0.5, marginRight: 4 }} />
          {annonce.ville}{annonce.pays ? `, ${annonce.pays}` : ''}
        </p>

        <div className="annonce-card-meta">
          {annonce.nombrePieces && (
            <div className="meta-item">
              <span className="meta-val">{annonce.nombrePieces}</span>
              <span className="meta-label">Pièces</span>
            </div>
          )}
          {annonce.superficie && (
            <div className="meta-item">
              <span className="meta-val">{annonce.superficie}</span>
              <span className="meta-label">m²</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-val">{annonce.quantiteDisponible}</span>
            <span className="meta-label">Dispo</span>
          </div>
        </div>

        <p className="annonce-card-desc">
          {annonce.description?.slice(0, 80)}{annonce.description?.length > 80 ? '…' : ''}
        </p>

        {/* Footer actions */}
        <div className="annonce-card-footer">
          <div className="footer-actions">
            {/* Like — FIX: mise à jour locale uniquement, pas de refetch complet */}
            <button
              onClick={handleLike}
              className={`icon-btn ${liked ? 'active' : ''}`}
              title="J'aime"
              disabled={loadingLike}
            >
              <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartRegular} />
              {likeCount > 0 && <span className="count">{likeCount}</span>}
            </button>

            {/* Commentaires */}
            <button
              onClick={toggleComments}
              className={`icon-btn ${showComments ? 'active' : ''}`}
              title="Commenter"
            >
              <FontAwesomeIcon icon={showComments ? faCommentDotsSolid : faCommentDotsRegular} />
              {commentCount > 0 && <span className="count">{commentCount}</span>}
            </button>

            {/* Partager */}
            <button onClick={handleShare} className="icon-btn" title="Partager">
              <FontAwesomeIcon icon={faShareNodes} />
            </button>

            {/* Suivre propriétaire */}
            {canFollowOwner && (
              <button
                onClick={handleFollowOwner}
                className={`icon-btn ${followingOwner ? 'active' : ''}`}
                title={followingOwner ? 'Ne plus suivre ce propriétaire' : 'Suivre ce propriétaire'}
                disabled={loadingFollow}
              >
                <img
                  src={followingOwner ? followFillSvg : followLineSvg}
                  alt=""
                  width={16}
                  height={16}
                  style={{ display: 'block' }}
                />
              </button>
            )}
          </div>

          <div className="footer-main-btn">
            {user ? (
              <Link
                to={`/messages/${annonce.proprietaire.id}`}
                className="btn btn-primary btn-sm"
                onClick={e => e.stopPropagation()}
              >
                Contacter
              </Link>
            ) : (
              <Link
                to={`/annonces/${annonce.id}`}
                className="btn btn-ghost btn-sm"
                onClick={e => e.stopPropagation()}
              >
                Détails
              </Link>
            )}
            {!isIndisponible && user?.role === 'LOCATAIRE' && (
              <Link
                to={`/reservations/nouvelle?annonceId=${annonce.id}`}
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: 'var(--success)' }}
                onClick={e => e.stopPropagation()}
              >
                Réserver
              </Link>
            )}
          </div>
        </div>

        {/* Section commentaires */}
        {showComments && (
          <div className="annonce-comments card" onClick={e => e.stopPropagation()}>
            <div className="comments-header">
              <h4>Commentaires ({commentCount})</h4>
            </div>

            <div className="comments-list" ref={menuRef as any}>
              {loadingComments ? (
                <div className="spinner" style={{ margin: '20px auto' }} />
              ) : comments.length === 0 ? (
                <p className="no-comments">Aucun commentaire pour le moment.</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="comment-item">
                    {/* En-tête du commentaire */}
                    <div className="comment-header-row">
                      <div className="comment-author">
                        <strong>{c.auteur?.prenom} {c.auteur?.nom}</strong>
                        <small>{new Date(c.dateCreation).toLocaleDateString('fr-FR')}</small>
                        {c.dateModification && <small className="edited-label">(modifié)</small>}
                      </div>

                      {/* Menu actions (auteur ou proprio) */}
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
                                onClick={e => { handleDelete(e, c.id); setMenuOpen(null); }}
                              >
                                <FontAwesomeIcon icon={faTrash} /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contenu ou formulaire d'édition */}
                    {editingId === c.id ? (
                      <div className="comment-edit-form">
                        <input
                          className="comment-input"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          autoFocus
                        />
                        <div className="comment-edit-actions">
                          <button className="btn btn-primary btn-xs" onClick={() => handleEditSave(c.id)}>
                            Enregistrer
                          </button>
                          <button className="btn btn-ghost btn-xs" onClick={() => setEditingId(null)}>
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-content">{c.contenu}</p>
                    )}

                    {/* Actions répondre + voir réponses */}
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
                          onClick={e => loadReplies(e, c.id)}
                        >
                          <FontAwesomeIcon icon={faChevronDown} style={{ transform: expandedReplies[c.id] ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                          {expandedReplies[c.id] ? 'Masquer' : `${c.reponseCount} réponse${(c.reponseCount ?? 0) > 1 ? 's' : ''}`}
                        </button>
                      )}
                    </div>

                    {/* Formulaire de réponse */}
                    {replyToId === c.id && user && (
                      <form className="reply-form" onSubmit={e => handleReplySubmit(e, c.id)}>
                        <input
                          className="comment-input"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder={`Répondre à ${c.auteur?.prenom}…`}
                          autoFocus
                        />
                        <button type="submit" className="btn btn-primary btn-xs" disabled={!replyText.trim()}>
                          Envoyer
                        </button>
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => setReplyToId(null)}>
                          Annuler
                        </button>
                      </form>
                    )}

                    {/* Réponses imbriquées */}
                    {expandedReplies[c.id] && replies[c.id] && replies[c.id].length > 0 && (
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

            {/* Formulaire nouveau commentaire */}
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
    </div>
  );
}
