import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PublicNavbar from '../components/layout/PublicNavbar';
import Lightbox from '../components/Lightbox';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { emitAppRefresh } from '../lib/appEvents';

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

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden min-h-screen">
      <PublicNavbar />
      <main className="pt-20 pb-12 w-full">{children}</main>
    </div>
  );
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
  const [comments, setComments]               = useState<Commentaire[]>([]);
  const [commentText, setCommentText]         = useState('');
  const [commentCount, setCommentCount]       = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded]   = useState(false);

  // Comment edit / delete / reply
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editText, setEditText]     = useState('');
  const [replyToId, setReplyToId]   = useState<number | null>(null);
  const [replyText, setReplyText]   = useState('');
  const [replies, setReplies]       = useState<Record<number, Commentaire[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({});
  const [menuOpen, setMenuOpen]     = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const Layout = user ? AppLayout : PublicLayout;

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
  
  // Load comments automatically when viewing page
  useEffect(() => {
    if (!annonce || commentsLoaded) return;
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const { data } = await api.get(`/annonces/${annonce.id}/commentaires`);
        setComments(data.content || []);
        setCommentsLoaded(true);
      } catch { /* silent */ } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [annonce, commentsLoaded]);

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
    return (
      <Layout>
        <div className="flex justify-center items-center py-32">
          <div className="w-12 h-12 border-4 border-surface-variant border-t-primary-fixed-dim rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
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
    )}&background=fabd00&color=000&bold=true`;
    
  const typeLabels: Record<string, string> = {
    MAISON: 'Maison', APPARTEMENT: 'Appartement', STUDIO: 'Studio', VILLA: 'Villa', CHAMBRE: 'Chambre',
  };

  return (
    <Layout>
      <div className="p-4 md:p-lg lg:p-xl max-w-container-max mx-auto space-y-xl">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
          <Link to="/annonces" className="hover:text-primary-container transition-colors">Annonces</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface truncate max-w-[250px]">{annonce.titre}</span>
        </div>
        
        {/* Dynamic Gallery */}
        <div className={`grid gap-sm ${
          photos.length === 0 ? 'grid-cols-1' :
          photos.length === 1 ? 'grid-cols-1' :
          photos.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-3'
        } h-[400px] md:h-[500px]`}>
          
          {/* Main Photo / Placeholder */}
          <div 
            className={`${photos.length >= 3 ? 'md:col-span-2' : ''} rounded-2xl overflow-hidden relative group cursor-pointer border border-surface-variant bg-surface-container`}
            onClick={() => photos.length > 0 && setShowLightbox(true)}
          >
            {photos.length > 0 ? (
              <img 
                src={photos[0]} 
                alt="Main" 
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isUnavailable ? 'grayscale opacity-70' : ''}`} 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/40">
                <span className="material-symbols-outlined text-[64px] mb-4">home_work</span>
                <span className="font-h3">Aucune photo disponible</span>
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-4 left-4 bg-surface/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-surface-variant shadow-sm">
              <span className="font-label-caps text-[12px] text-primary font-bold uppercase tracking-widest">
                {annonce.statut === 'DISPONIBLE' ? 'Disponible' : 'Indisponible'}
              </span>
            </div>

            {isUnavailable && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-error text-on-error font-h2 px-8 py-4 rounded-2xl -rotate-6 border-2 border-on-error shadow-2xl uppercase font-bold tracking-tighter">Indisponible</span>
              </div>
            )}
          </div>
          
          {/* Side Photos (only for 2 or 3+ photos) */}
          {photos.length >= 2 && (
            <div className={`flex ${photos.length === 2 ? 'flex-col' : 'flex-col'} gap-sm`}>
              <div 
                className={`flex-1 rounded-2xl overflow-hidden relative group cursor-pointer border border-surface-variant bg-surface-container`}
                onClick={() => { setActiveImg(1); setShowLightbox(true); }}
              >
                <img src={photos[1]} alt="Gallery 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              
              {photos.length >= 3 && (
                <div 
                  className={`flex-1 rounded-2xl overflow-hidden relative group cursor-pointer border border-surface-variant bg-surface-container`}
                  onClick={() => { setActiveImg(2); setShowLightbox(true); }}
                >
                  <img src={photos[2]} alt="Gallery 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  {/* View all overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="font-label-caps text-white flex items-center gap-2 uppercase font-bold tracking-wider">
                      <span className="material-symbols-outlined">photo_library</span>
                      {photos.length} Photos
                    </span>
                  </div>
                  
                  {/* Small badge if not hovered */}
                  {photos.length > 3 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[11px] font-bold group-hover:opacity-0 transition-opacity">
                      +{photos.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-lg">
            {/* Header & Price */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-h1 text-h1 text-on-surface mb-2">{annonce.titre}</h1>
                <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">location_on</span>
                  <span>{annonce.ville}{annonce.pays ? `, ${annonce.pays}` : ''}</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">Prix demandé</span>
                <div className="font-h2 text-h2 text-primary-fixed-dim">{Number(annonce.prix).toLocaleString('fr-FR')} Ar</div>
              </div>
            </div>
            
            {/* Features Row */}
            <div className="flex flex-wrap gap-4 py-6 border-y border-surface-variant">
              <div className="flex items-center gap-3 bg-surface-container px-4 py-3 rounded-lg border border-surface-variant">
                <span className="material-symbols-outlined text-on-surface-variant text-[24px]">house</span>
                <div>
                  <span className="font-h3 text-h3 text-on-surface block leading-none">{typeLabels[annonce.typeLogement] || annonce.typeLogement}</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Type</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface-container px-4 py-3 rounded-lg border border-surface-variant">
                <span className="material-symbols-outlined text-on-surface-variant text-[24px]">bed</span>
                <div>
                  <span className="font-h3 text-h3 text-on-surface block leading-none">{annonce.nombrePieces}</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Pièces</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface-container px-4 py-3 rounded-lg border border-surface-variant">
                <span className="material-symbols-outlined text-on-surface-variant text-[24px]">straighten</span>
                <div>
                  <span className="font-h3 text-h3 text-on-surface block leading-none">{annonce.superficie}</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">m²</span>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <h2 className="font-h2 text-h2 text-on-surface mb-4">À propos de ce bien</h2>
              <div className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {annonce.description}
              </div>
            </div>
            
            {/* Availability */}
            <div className="bg-surface-container-low border border-surface-variant rounded-xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="font-body-md text-on-surface font-semibold">Disponibilité</p>
                <p className="text-on-surface-variant text-sm mt-1">{annonce.quantiteDisponible} unité(s) restante(s)</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleLike}
                  disabled={loadingLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border border-surface-variant transition-colors ${liked ? 'bg-primary-fixed-dim/10 text-primary-fixed-dim border-primary-fixed-dim/30' : 'hover:bg-surface-container text-on-surface'}`}
                >
                  <span className="material-symbols-outlined" style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                  <span className="font-label-caps">{likeCount}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-surface-variant hover:bg-surface-container text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">share</span>
                  <span className="font-label-caps uppercase">Partager</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-lg">
            
            {/* Action Card */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-surface-variant shadow-lg sticky top-24">
              {/* Owner Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-variant">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-surface-container-highest">
                  <img src={ownerAvatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-h3 text-[18px] text-on-surface truncate">{annonce.proprietaire.prenom} {annonce.proprietaire.nom}</h3>
                  <div className="flex items-center gap-1 text-primary-fixed-dim font-label-caps text-label-caps mt-1 uppercase">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Propriétaire
                  </div>
                </div>
              </div>
              
              {/* Follow Owner */}
              {canFollowOwner && (
                <div className="mb-6">
                  <button
                    onClick={handleFollowOwner}
                    disabled={loadingFollowOwner}
                    className={`w-full py-2 rounded-lg font-label-caps uppercase transition-colors border ${followingOwner ? 'bg-surface-container border-primary-fixed-dim text-primary-fixed-dim' : 'border-surface-variant text-on-surface hover:bg-surface-container'}`}
                  >
                    {followingOwner ? 'Abonné' : "S'abonner au compte"}
                  </button>
                </div>
              )}
              
              {/* Actions */}
              <div className="space-y-4">
                <button
                  onClick={() => canReserve ? navigate(`/reservations/nouvelle?annonceId=${annonce.id}`) : (!user ? navigate('/login') : undefined)}
                  disabled={Boolean(user) && !canReserve}
                  className={`w-full font-label-caps text-label-caps py-4 rounded-lg uppercase flex justify-center items-center gap-2 transition-colors ${canReserve ? 'bg-primary-container text-on-primary-container hover:bg-primary-fixed' : (user ? 'bg-surface-container text-on-surface-variant cursor-not-allowed' : 'bg-primary-container text-on-primary-container hover:bg-primary-fixed')}`}
                >
                  <span className="material-symbols-outlined">calendar_month</span>
                  {user ? (canReserve ? 'Réserver une visite' : 'Indisponible') : 'Connexion pour réserver'}
                </button>
                
                <button
                  onClick={() => canMessage ? navigate(`/messages/${annonce.proprietaire.id}`) : (!user ? navigate('/login') : undefined)}
                  className="w-full bg-transparent border border-surface-variant text-on-surface font-label-caps text-label-caps py-4 rounded-lg uppercase hover:bg-surface-container transition-colors flex justify-center items-center gap-2"
                >
                  <span className="material-symbols-outlined">mail</span>
                  Contacter le propriétaire
                </button>
                
                {canFollow && (
                  <button
                    onClick={handleFollow}
                    disabled={updatingFollow}
                    className="w-full bg-transparent border border-surface-variant text-on-surface font-label-caps text-label-caps py-4 rounded-lg uppercase hover:bg-surface-container transition-colors flex justify-center items-center gap-2 mt-2"
                  >
                    <span className="material-symbols-outlined" style={isFollowing ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span>
                    {isFollowing ? 'Annonce sauvegardée' : 'Sauvegarder l\'annonce'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Community Section */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-surface-variant">
              <h3 className="font-h3 text-h3 text-on-surface text-xl mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">forum</span>
                Discussion ({commentCount})
              </h3>
              
              <div className="space-y-6 mb-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
                {loadingComments ? (
                  <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-surface-variant border-t-primary-fixed-dim rounded-full animate-spin"></div></div>
                ) : comments.length === 0 ? (
                  <p className="text-on-surface-variant font-body-sm text-center py-4">Soyez le premier à poser une question.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-4">
                      <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-surface-variant">
                        {c.auteur?.photo ? (
                          <img src={c.auteur.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-surface flex items-center justify-center text-on-surface text-xs uppercase font-bold">
                            {c.auteur?.prenom?.[0]}{c.auteur?.nom?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-body-sm text-body-sm font-semibold text-on-surface">{c.auteur?.prenom} {c.auteur?.nom}</span>
                            {c.auteur?.id === annonce.proprietaire.id && (
                              <span className="font-label-caps text-[10px] text-primary-fixed-dim bg-primary-fixed-dim/10 px-2 py-0.5 rounded uppercase">Proprio</span>
                            )}
                            <span className="font-label-caps text-label-caps text-on-surface-variant font-normal lowercase">{new Date(c.dateCreation).toLocaleDateString('fr-FR')}</span>
                            {c.dateModification && <span className="text-[10px] text-on-surface-variant italic">(modifié)</span>}
                          </div>
                          
                          {/* Menu (Edit/Delete) */}
                          {user && user.id === c.auteur?.id && (
                            <div className="relative" ref={menuRef}>
                              <button onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-[16px]">more_vert</span>
                              </button>
                              {menuOpen === c.id && (
                                <div className="absolute right-0 top-6 bg-surface-container border border-surface-variant rounded-lg shadow-lg py-1 z-10 w-32">
                                  <button onClick={() => { setEditingId(c.id); setEditText(c.contenu); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">edit</span> Modifier
                                  </button>
                                  <button onClick={() => { handleDelete(c.id); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">delete</span> Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {editingId === c.id ? (
                          <div className="mt-2">
                            <input
                              className="w-full bg-surface border border-surface-variant rounded p-2 text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button className="text-xs bg-primary-container text-on-primary-container px-3 py-1 rounded" onClick={() => handleEditSave(c.id)}>Enregistrer</button>
                              <button className="text-xs text-on-surface-variant px-3 py-1" onClick={() => setEditingId(null)}>Annuler</button>
                            </div>
                          </div>
                        ) : (
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{c.contenu}</p>
                        )}
                        
                        <div className="flex gap-4 mt-2">
                          {user && (
                            <button onClick={() => setReplyToId(replyToId === c.id ? null : c.id)} className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 font-label-caps text-label-caps uppercase">
                              <span className="material-symbols-outlined text-[14px]">reply</span> Répondre
                            </button>
                          )}
                          {(c.reponseCount ?? 0) > 0 && (
                            <button onClick={() => loadReplies(c.id)} className="text-primary-fixed-dim hover:text-primary-container flex items-center gap-1 font-label-caps text-label-caps uppercase">
                              <span className="material-symbols-outlined text-[14px] transition-transform" style={{ transform: expandedReplies[c.id] ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                              {expandedReplies[c.id] ? 'Masquer' : `${c.reponseCount} réponse${(c.reponseCount ?? 0) > 1 ? 's' : ''}`}
                            </button>
                          )}
                        </div>
                        
                        {/* Reply Form */}
                        {replyToId === c.id && user && (
                          <form className="mt-3 flex gap-2" onSubmit={e => handleReplySubmit(e, c.id)}>
                            <input
                              className="flex-1 bg-surface border border-surface-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim"
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder={`Répondre à ${c.auteur?.prenom}...`}
                              autoFocus
                            />
                            <button type="submit" disabled={!replyText.trim()} className="bg-surface-container-high text-on-surface hover:bg-surface-variant px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                              <span className="material-symbols-outlined text-[16px]">send</span>
                            </button>
                          </form>
                        )}
                        
                        {/* Nested Replies */}
                        {expandedReplies[c.id] && replies[c.id]?.length > 0 && (
                          <div className="mt-4 space-y-4 pl-4 border-l-2 border-surface-variant">
                            {replies[c.id].map(r => (
                              <div key={r.id} className="flex gap-3">
                                <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 border border-surface-variant">
                                  {r.auteur?.photo ? (
                                    <img src={r.auteur.photo} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-surface flex items-center justify-center text-on-surface text-[10px] uppercase font-bold">
                                      {r.auteur?.prenom?.[0]}{r.auteur?.nom?.[0]}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-baseline gap-2 mb-0.5">
                                    <span className="font-body-sm text-xs font-semibold text-on-surface">{r.auteur?.prenom} {r.auteur?.nom}</span>
                                    {r.auteur?.id === annonce.proprietaire.id && (
                                      <span className="font-label-caps text-[8px] text-primary-fixed-dim bg-primary-fixed-dim/10 px-1.5 py-0.5 rounded uppercase">Proprio</span>
                                    )}
                                    <span className="font-label-caps text-[10px] text-on-surface-variant font-normal lowercase">{new Date(r.dateCreation).toLocaleDateString('fr-FR')}</span>
                                  </div>
                                  <p className="font-body-sm text-xs text-on-surface-variant">{r.contenu}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Input for new comment */}
              <div className="pt-4 border-t border-surface-variant">
                {user ? (
                  <form className="flex gap-3 items-start" onSubmit={handleComment}>
                    <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-surface-variant bg-surface-container">
                      <img src={user.photo || `https://ui-avatars.com/api/?name=${user.prenom}+${user.nom}&background=fabd00&color=000&bold=true`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-surface border border-surface-variant rounded-lg p-2 focus-within:border-primary-fixed-dim transition-colors">
                        <textarea 
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          className="w-full bg-transparent border-none text-body-sm text-on-surface focus:outline-none p-1 placeholder-on-surface-variant resize-none h-12" 
                          placeholder="Ajouter un commentaire ou poser une question..."
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <button type="submit" disabled={!commentText.trim() || loadingComments} className="bg-primary-container text-on-primary-container font-bold hover:bg-primary-fixed font-label-caps text-label-caps uppercase px-6 py-2 rounded-lg transition-colors disabled:opacity-50">
                          Publier
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4 bg-surface rounded-lg border border-surface-variant">
                    <p className="text-on-surface-variant text-sm mb-2">Connectez-vous pour participer à la discussion.</p>
                    <Link to="/login" className="inline-block bg-primary-container text-on-primary-container font-label-caps px-4 py-2 rounded uppercase font-bold text-xs">
                      Se connecter
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
          </div>
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
