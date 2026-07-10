import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import PublicNavbar from '../components/layout/PublicNavbar';
import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import { StateManager } from '../components/ui/state';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

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
  images?: any[];
  statut: string;
  quantiteDisponible: number;
  dateCreation: string;
  suivi: boolean;
  likeCount?: number;
  commentCount?: number;
  liked?: boolean;
  typeTransaction?: string;
  localisation?: string;
  surface?: number;
  proprietaire: { id: number; nom: string; prenom: string; photo?: string };
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
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    ville:   searchParams.get('ville')   || '',
    type:    searchParams.get('type')    || '',
    prixMin: searchParams.get('prixMin') || '',
    prixMax: searchParams.get('prixMax') || '',
  });

  const [tri, setTri] = useState(searchParams.get('tri') || 'DATE_DESC');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setShowFilters(window.innerWidth >= 1280);
    const handleResize = () => setShowFilters(window.innerWidth >= 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const Wrapper = user ? AppLayout : ({ children }: any) => (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased">
      <PublicNavbar />
      <main className="flex-grow pt-20 w-full">
        {children}
      </main>
    </div>
  );

  const fetchNextPage = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAnnonces(nextPage, false);
  }, [page, hasMore, loading, tri, searchParams]);

  const { ref: loadMoreRef } = useIntersectionObserver(fetchNextPage);

  const fetchAnnonces = async (p: number, reset = false) => {
    setLoading(true);
    if (reset) setError(null);
    try {
      const queryParams = new URLSearchParams(searchParams);
      queryParams.set('page', String(p));
      queryParams.set('size', '12');
      queryParams.set('tri', tri);

      const isSearch = ['ville', 'type', 'prixMin', 'prixMax'].some(k => searchParams.get(k));
      const endpoint = isSearch ? `/annonces/recherche?${queryParams}` : `/annonces?${queryParams}`;

      const { data } = await api.get(endpoint);
      const items = data.content || [];

      setAnnonces(prev => (reset ? items : [...prev, ...items]));
      setHasMore(!data.last);
      setPage(p);
    } catch (err: any) {
      console.error('Erreur chargement annonces', err);
      if (reset) setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnonces(0, true);
  }, [searchParams, tri]);

  useAutoRefresh(() => fetchAnnonces(0, true), ['annonces']);

  const applyFilters = (newFilters: typeof filters, newTri: string) => {
    const newParams: Record<string, string> = {};
    if (newFilters.ville)   newParams.ville   = newFilters.ville;
    if (newFilters.type)    newParams.type    = newFilters.type;
    if (newFilters.prixMin) newParams.prixMin = newFilters.prixMin;
    if (newFilters.prixMax) newParams.prixMax = newFilters.prixMax;
    if (newTri !== 'DATE_DESC') newParams.tri = newTri;
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: string) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    applyFilters(updatedFilters, tri);
  };

  const handleTriChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTri(e.target.value);
    applyFilters(filters, e.target.value);
  };

  const isLoadingDelayed = useDelayedLoading(loading && annonces.length === 0);

  return (
    <Wrapper>
      {/* Sticky Filter Bar */}
      <div className={`sticky ${user ? 'top-0' : 'top-20'} z-30 bg-background/90 backdrop-blur-xl border-b border-surface-variant px-4 md:px-lg py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 transition-all duration-300`}>
        <div className="flex items-center gap-3 flex-shrink-0 w-full xl:w-auto">
          <h1 className="font-h2 text-h2 text-on-surface tracking-tight flex-1">Explorer les biens</h1>
          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden bg-surface-container px-4 py-2 rounded-xl border border-surface-variant hover:bg-surface-container-high text-on-surface font-label-caps text-label-caps transition-all"
            >
              <span className="material-symbols-outlined mr-1">tune</span>
              Filtres
            </button>
          )}
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-5xl overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-[500px] md:max-h-none opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'}`}>
          {/* Ville */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] group-focus-within:text-primary transition-colors">location_on</span>
            <input
              type="text"
              placeholder="Ville..."
              value={filters.ville}
              onChange={(e) => setFilters({...filters, ville: e.target.value})}
              onBlur={() => applyFilters(filters, tri)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters(filters, tri)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-sm font-medium text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Type */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] group-focus-within:text-primary transition-colors">home</span>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              aria-label="Type de logement"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-sm font-medium text-on-surface appearance-none"
            >
              <option value="">Tous les types</option>
              {Object.entries(typeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Prix Min */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] group-focus-within:text-primary transition-colors">payments</span>
            <input
              type="number"
              placeholder="Prix min..."
              value={filters.prixMin}
              onChange={(e) => setFilters({...filters, prixMin: e.target.value})}
              onBlur={() => applyFilters(filters, tri)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters(filters, tri)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-sm font-medium text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Prix Max */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] group-focus-within:text-primary transition-colors">sell</span>
            <input
              type="number"
              placeholder="Prix max..."
              value={filters.prixMax}
              onChange={(e) => setFilters({...filters, prixMax: e.target.value})}
              onBlur={() => applyFilters(filters, tri)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters(filters, tri)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-sm font-medium text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Tri */}
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] group-focus-within:text-primary transition-colors">sort</span>
            <select
              value={tri}
              onChange={handleTriChange}
              aria-label="Trier par"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-variant bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-body-sm font-medium text-on-surface appearance-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        {showFilters && (
          <button
            onClick={() => setShowFilters(false)}
            className="md:hidden self-end mt-2 text-primary text-sm font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Masquer
          </button>
        )}
      </div>

      <div className="p-6 pb-24 lg:pb-6">
        <StateManager
          isLoading={isLoadingDelayed}
          isError={!!error}
          isEmpty={!loading && annonces.length === 0}
          errorProps={{ onRetry: () => fetchAnnonces(0, true) }}
          emptyProps={{
            title: "Aucun résultat",
            description: "Nous n'avons trouvé aucune annonce correspondant à vos critères de recherche.",
            icon: "search_off",
            action: (
              <button onClick={() => applyFilters({ville: '', type: '', prixMin: '', prixMax: ''}, 'DATE_DESC')} className="px-6 py-2 bg-primary-container text-on-primary-container rounded-lg font-label-caps uppercase transition-colors hover:bg-primary-fixed mt-4">
                Effacer les filtres
              </button>
            )
          }}
        >
        {/* Property Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-lg max-w-container-max mx-auto">
            {annonces.map(a => <AnnonceCard key={a.id} annonce={a} />)}
          </div>
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center py-8">
            {loading && annonces.length > 0 && <div className="w-8 h-8 border-4 border-surface-variant border-t-primary rounded-full animate-spin" />}
          </div>
        </div>
        </StateManager>
      </div>
    </Wrapper>
  );
}

// Export the Card Component
export function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [likeCount, setLikeCount] = useState(annonce.likeCount || 0);
  const [liked, setLiked] = useState(Boolean(annonce.liked));
  const [loadingLike, setLoadingLike] = useState(false);

  // Backend returns photos: string[] — support both for compatibility
  const images = annonce.photos?.length ? annonce.photos : (annonce.images?.length ? annonce.images.map((i: any) => i?.url ?? i) : []);
  const coverImg = images.length > 0 ? images[0] : null;
  
  const isIndisponible = annonce.statut !== 'DISPONIBLE' || annonce.quantiteDisponible <= 0;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (loadingLike) return;
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
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLoadingLike(false);
    }
  };

  return (
    <article className="bg-surface-container-low rounded-xl border border-surface-variant overflow-hidden group hover:border-outline-variant transition-all duration-300 flex flex-col shadow-lg shadow-black/40">
      <Link to={`/annonces/${annonce.id}`} className="flex flex-col h-full">
        <div className="h-64 overflow-hidden relative group">
          {coverImg ? (
            <img 
              alt={annonce.titre}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ${isIndisponible ? 'grayscale opacity-70' : ''}`}
              src={coverImg}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container">
              <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20">home</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
          
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-4 py-1.5 rounded-full font-label-caps text-[11px] uppercase tracking-widest font-bold shadow-lg backdrop-blur-md ${
              annonce.typeTransaction === 'VENTE' 
                ? 'bg-primary text-black' 
                : 'bg-white/90 text-black border border-white/20'
            }`}>
              {annonce.typeTransaction === 'VENTE' ? 'À Vendre' : 'À Louer'}
            </span>
          </div>
          
          <button
            onClick={handleLike}
            disabled={loadingLike}
            className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all ${liked ? 'text-primary' : 'text-white hover:scale-110'}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}>{liked ? 'favorite' : 'favorite'}</span>
          </button>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-3">
            <h2 className="font-h3 text-h3 text-primary font-bold">
              {annonce.prix >= 1000000 ? (annonce.prix/1000000).toFixed(1) + 'M' : annonce.prix.toLocaleString('fr-FR')} Ar
            </h2>
            <span className="font-label-caps text-[10px] text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">
              {typeLabels[annonce.typeLogement] || annonce.typeLogement}
            </span>
          </div>
          
          <h3 className="font-body-md text-body-md text-on-surface font-bold truncate mb-1 group-hover:text-primary transition-colors">
            {annonce.titre}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 mb-5 truncate">
            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span> 
            {annonce.localisation || annonce.ville || 'Non spécifié'}
          </p>
          
          <div className="flex items-center gap-6 py-4 border-y border-surface-variant/50 mb-5">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-[20px]">meeting_room</span>
              <span className="font-label-caps text-[12px] font-semibold">{annonce.nombrePieces || '-'} <span className="hidden sm:inline">Pièces</span></span>
            </div>
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-[20px]">square_foot</span>
              <span className="font-label-caps text-[12px] font-semibold">{annonce.superficie || annonce.surface || '-'} <span className="hidden sm:inline">m²</span></span>
            </div>
          </div>
          
          {/* Footer Info */}
          <div className="mt-auto flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-surface-variant overflow-hidden bg-surface-container flex items-center justify-center shadow-sm">
                {annonce.proprietaire?.photo ? (
                  <img src={annonce.proprietaire.photo} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-xs font-bold text-on-surface-variant">
                    {annonce.proprietaire?.prenom?.[0]}{annonce.proprietaire?.nom?.[0]}
                  </span>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-label-caps text-[12px] text-on-surface font-bold truncate max-w-[140px] leading-tight">{annonce.proprietaire?.prenom} {annonce.proprietaire?.nom}</p>
                <p className="font-body-sm text-on-surface-variant text-[11px] mt-0.5">{new Date(annonce.dateCreation).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            
            <div className="flex gap-4 text-on-surface-variant">
              <div className="flex items-center gap-1.5" title="J'aime">
                <span className={`material-symbols-outlined text-[18px] ${liked ? 'text-primary' : ''}`}>favorite</span>
                <span className="font-label-caps text-[11px] font-bold">{likeCount}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Commentaires">
                <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                <span className="font-label-caps text-[11px] font-bold">{annonce.commentCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
