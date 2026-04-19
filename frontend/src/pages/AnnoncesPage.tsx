import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import PublicNavbar from '../components/layout/PublicNavbar';
import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import shareForwardLineSvg  from '../assets/share_forward_line.svg';
import thumbUpLineSvg       from '../assets/thumb_up_line.svg';
import thumbUpFillSvg       from '../assets/thumb_up_fill.svg';
import homeLineSvg          from '../assets/home_1_line.svg';
import announcementLineSvg  from '../assets/announcement_line.svg';
import './AnnoncesPage.css';

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
  proprietaire: { id: number; nom: string; prenom: string; photo?: string };
}

const typeLabels: Record<string, string> = {
  MAISON:       'Maison',
  APPARTEMENT:  'Appartement',
  STUDIO:       'Studio',
  VILLA:        'Villa',
  CHAMBRE:      'Chambre',
};

export default function AnnoncesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Local form state for filters
  const [filters, setFilters] = useState({
    ville: searchParams.get('ville') || '',
    type: searchParams.get('type') || '',
    prixMin: searchParams.get('prixMin') || '',
    prixMax: searchParams.get('prixMax') || '',
  });

  const Wrapper = user ? AppLayout : ({ children }: any) => (
    <div>
      <PublicNavbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>{children}</div>
    </div>
  );

  const fetchAnnonces = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(searchParams);
      queryParams.set('page', String(p));
      queryParams.set('size', '12');

      const isSearch = Array.from(searchParams.keys()).some(k => ['ville', 'type', 'prixMin', 'prixMax'].includes(k) && searchParams.get(k));
      const endpoint = isSearch ? `/annonces/recherche?${queryParams}` : `/annonces?${queryParams}`;

      const { data } = await api.get(endpoint);
      const items = data.content || [];

      setAnnonces((prev) => reset ? items : [...prev, ...items]);
      setHasMore(!data.last);
      setPage(p);
    } catch (err) {
      console.error("Erreur chargement annonces", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when URL parameters change
  useEffect(() => {
    fetchAnnonces(0, true);
  }, [searchParams]);

  useAutoRefresh(() => {
    fetchAnnonces(0, true);
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams: Record<string, string> = {};
    if (filters.ville) newParams.ville = filters.ville;
    if (filters.type) newParams.type = filters.type;
    if (filters.prixMin) newParams.prixMin = filters.prixMin;
    if (filters.prixMax) newParams.prixMax = filters.prixMax;
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    const empty = { ville: '', type: '', prixMin: '', prixMax: '' };
    setFilters(empty);
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
              <input className="form-input" placeholder="Ex: Antananarivo"
                value={filters.ville} onChange={(e) => setFilters(f => ({ ...f, ville: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Type</label>
              <select className="form-input" value={filters.type}
                onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
                <option value="">Tous les types</option>
                {Object.entries(typeLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prix min (Ar)</label>
              <input type="number" className="form-input" placeholder="0"
                value={filters.prixMin} onChange={(e) => setFilters(f => ({ ...f, prixMin: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prix max (Ar)</label>
              <input type="number" className="form-input" placeholder="∞"
                value={filters.prixMax} onChange={(e) => setFilters(f => ({ ...f, prixMax: e.target.value }))} />
            </div>
          </div>
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">🔍 Rechercher</button>
            <button type="button" className="btn btn-ghost" onClick={resetFilters}>Réinitialiser</button>
          </div>
        </form>

        {/* Résultats */}
        <div className="annonces-header">
          <h2 className="annonces-count">
            {loading && annonces.length === 0 ? 'Chargement…' : `${annonces.length} annonce${annonces.length !== 1 ? 's' : ''} trouvée${annonces.length !== 1 ? 's' : ''}`}
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
            <img src={homeLineSvg} alt="Aucune annonce" width={56} height={56} style={{ opacity: 0.35, marginBottom: 12 }} />
            <p>Aucune annonce ne correspond à votre recherche.</p>
            <button className="btn btn-ghost" onClick={resetFilters}>Effacer les filtres</button>
          </div>
        )}

        <div className="annonces-grid">
          {annonces.map((a) => (
            <AnnonceCard key={a.id} annonce={a} onToggleSuivre={() => fetchAnnonces(0, true)} />
          ))}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button className="btn btn-ghost btn-lg"
              onClick={() => fetchAnnonces(page + 1, false)}>
              Voir plus d'annonces
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

export function AnnonceCard({ annonce, onToggleSuivre }: { annonce: Annonce, onToggleSuivre?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const imgUrl = annonce.photos?.[0];

  const handleShare = async () => {
    if (!user) { navigate('/login'); return; }
    const contenu = window.prompt("Ajoutez un texte à votre partage :", "Découvrez cette excellente annonce !");
    if (contenu === null) return;
    try {
      await api.post('/publications', { contenu, annonceId: annonce.id, visibilite: 'PUBLIC' });
      alert("Annonce partagée avec succès dans le fil d'actualité !");
    } catch {
      alert("Erreur lors du partage de l'annonce.");
    }
  };

  const handleSuivre = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post(`/annonces/${annonce.id}/suivre`);
      if (onToggleSuivre) onToggleSuivre();
    } catch {
      alert("Erreur lors de l'action suivre.");
    }
  };

  const isIndisponible = annonce.statut !== 'DISPONIBLE' || annonce.quantiteDisponible <= 0;

  return (
    <div className="annonce-card card">
      <div className="annonce-card-img">
        {imgUrl ? (
          <img src={imgUrl} alt={annonce.titre} />
        ) : (
          <div className="annonce-img-placeholder">
            <img src={homeLineSvg} alt="" width={40} height={40} style={{ opacity: 0.35 }} />
          </div>
        )}
        <span className="annonce-type-badge">
          {typeLabels[annonce.typeLogement] || annonce.typeLogement}
        </span>
        {isIndisponible && (
          <span className="badge badge-danger" style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
            {annonce.statut}
          </span>
        )}
      </div>

      <div className="annonce-card-body">
        <h3 className="annonce-card-title">{annonce.titre}</h3>
        <p className="annonce-card-location">📍 {annonce.ville}{annonce.pays ? `, ${annonce.pays}` : ''}</p>

        <div className="annonce-card-meta">
          {annonce.nombrePieces && (
            <span>🛏 {annonce.nombrePieces} pièce{annonce.nombrePieces > 1 ? 's' : ''}</span>
          )}
          {annonce.superficie && (
            <span>📐 {annonce.superficie} m²</span>
          )}
          <span>📦 {annonce.quantiteDisponible} dispo</span>
        </div>

        <p className="annonce-card-desc">{annonce.description?.slice(0, 90)}{annonce.description?.length > 90 ? '…' : ''}</p>

        <div className="annonce-card-footer">
          <span className="annonce-card-prix">
            {Number(annonce.prix).toLocaleString('fr-FR')} Ar
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleShare} className="btn btn-ghost btn-sm" title="Partager l'annonce" style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <img src={shareForwardLineSvg} alt="" width={14} height={14} /> Partager
            </button>
            {user ? (
              <Link to={`/messages/${annonce.proprietaire.id}`} className="btn btn-primary btn-sm">
                Contacter
              </Link>
            ) : (
              <Link to="/login" className="btn btn-ghost btn-sm">Contacter</Link>
            )}
            {isIndisponible && (
              <button onClick={handleSuivre} className="btn btn-accent btn-sm">
                <img src={announcementLineSvg} alt="" width={13} height={13} style={{ marginRight: 2 }} /> Suivre
              </button>
            )}
            {!isIndisponible && user && user.role === 'LOCATAIRE' && (
               <Link to={`/reservations/nouvelle?annonceId=${annonce.id}`} className="btn btn-primary btn-sm" style={{backgroundColor: 'var(--success)'}}>
                 Réserver
               </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
