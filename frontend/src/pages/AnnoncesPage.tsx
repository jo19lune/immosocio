import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import PublicNavbar from '../components/layout/PublicNavbar';
import api from '../lib/api';
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
  dateCreation: string;
  proprietaire: { id: number; nom: string; prenom: string; photo?: string };
}

const typeLabels: Record<string, string> = {
  MAISON: '🏠 Maison',
  APPARTEMENT: '🏢 Appartement',
  STUDIO: '🏪 Studio',
  VILLA: '🏡 Villa',
  CHAMBRE: '🛏️ Chambre',
};

export default function AnnoncesPage() {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    ville: '', type: '', prixMin: '', prixMax: '',
  });
  const [applied, setApplied] = useState(filters);

  const Wrapper = user ? AppLayout : ({ children }: any) => (
    <div>
      <PublicNavbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>{children}</div>
    </div>
  );

  useEffect(() => {
    fetchAnnonces(0, true, applied);
  }, [applied]);

  const fetchAnnonces = async (p: number, reset = false, f = applied) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p), size: '12',
        ...(f.ville && { ville: f.ville }),
        ...(f.type && { type: f.type }),
        ...(f.prixMin && { prixMin: f.prixMin }),
        ...(f.prixMax && { prixMax: f.prixMax }),
      });
      const endpoint = (f.ville || f.type || f.prixMin || f.prixMax)
        ? `/annonces/recherche?${params}`
        : `/annonces?${params}`;
      const { data } = await api.get(endpoint);
      const items = data.content || [];
      setAnnonces((prev) => reset ? items : [...prev, ...items]);
      setHasMore(!data.last);
      setPage(p);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied(filters);
  };

  const resetFilters = () => {
    const empty = { ville: '', type: '', prixMin: '', prixMax: '' };
    setFilters(empty);
    setApplied(empty);
  };

  return (
    <Wrapper>
      <div className="annonces-page">
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
            {loading ? 'Chargement…' : `${annonces.length} annonce${annonces.length !== 1 ? 's' : ''}`}
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
            <span style={{ fontSize: 48 }}>🏚️</span>
            <p>Aucune annonce ne correspond à votre recherche.</p>
            <button className="btn btn-ghost" onClick={resetFilters}>Effacer les filtres</button>
          </div>
        )}

        <div className="annonces-grid">
          {annonces.map((a) => (
            <AnnonceCard key={a.id} annonce={a} />
          ))}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
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

function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const { user } = useAuth();
  const imgUrl = annonce.photos?.[0];

  return (
    <div className="annonce-card card">
      <div className="annonce-card-img">
        {imgUrl ? (
          <img src={imgUrl} alt={annonce.titre} />
        ) : (
          <div className="annonce-img-placeholder">🏠</div>
        )}
        <span className="annonce-type-badge">
          {typeLabels[annonce.typeLogement] || annonce.typeLogement}
        </span>
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
        </div>

        <p className="annonce-card-desc">{annonce.description?.slice(0, 90)}{annonce.description?.length > 90 ? '…' : ''}</p>

        <div className="annonce-card-footer">
          <span className="annonce-card-prix">
            {Number(annonce.prix).toLocaleString('fr-FR')} Ar
          </span>
          {user ? (
            <Link to={`/messages/${annonce.proprietaire.id}`} className="btn btn-primary btn-sm">
              Contacter
            </Link>
          ) : (
            <Link to="/login" className="btn btn-ghost btn-sm">Contacter</Link>
          )}
        </div>
      </div>
    </div>
  );
}
