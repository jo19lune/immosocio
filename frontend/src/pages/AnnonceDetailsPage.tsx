import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan,
  faBed,
  faCamera,
  faHeart,
  faHouse,
  faLocationDot,
  faMessage,
  faRulerCombined,
  faShareNodes,
} from '@fortawesome/free-solid-svg-icons';
import AppLayout from '../components/layout/AppLayout';
import PublicNavbar from '../components/layout/PublicNavbar';
import Lightbox from '../components/Lightbox';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { emitAppRefresh } from '../lib/appEvents';
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
  proprietaire: Owner;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-page">
      <PublicNavbar />
      <div className="annonce-public-shell">{children}</div>
    </div>
  );
}

export default function AnnonceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [updatingFollow, setUpdatingFollow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const Layout = user ? AppLayout : PublicLayout;

  const fetchAnnonce = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/annonces/${id}`);
      setAnnonce(data);
      setIsFollowing(Boolean(data?.suivi));
    } catch {
      navigate('/annonces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnonce();
  }, [id]);

  useEffect(() => {
    setIsFollowing(Boolean(annonce?.suivi));
  }, [annonce?.id, annonce?.suivi]);

  const handleShare = async () => {
    if (!annonce) {
      return;
    }

    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: annonce.titre,
          text: annonce.description,
          url,
        });
        return;
      }
    } catch {
      // fall through to clipboard copy
    }

    await navigator.clipboard.writeText(url);
    alert("Lien de l'annonce copie.");
  };

  const handleFollow = async () => {
    if (!annonce) {
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }

    setUpdatingFollow(true);
    try {
      const { data } = await api.post(`/annonces/${annonce.id}/suivre`);
      const nextValue = Boolean(data?.suivi);
      setIsFollowing(nextValue);
      setAnnonce((prev) =>
        prev
          ? {
              ...prev,
              suivi: nextValue,
              followerCount:
                typeof data?.followers === 'number' ? data.followers : prev.followerCount,
            }
          : prev
      );
      emitAppRefresh('annonces', {
        source: 'local',
        payload: { annonceId: annonce.id, suivi: nextValue },
      });
    } catch {
      alert("Impossible de mettre a jour le suivi pour l'instant.");
    } finally {
      setUpdatingFollow(false);
    }
  };

  if (loading) {
    return (
      <div className="annonce-details-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!annonce) {
    return null;
  }

  const photos = annonce.photos || [];
  const isUnavailable = annonce.statut !== 'DISPONIBLE' || annonce.quantiteDisponible <= 0;
  const canFollow = Boolean(user && user.id !== annonce.proprietaire.id);
  const canMessage = Boolean(user && user.id !== annonce.proprietaire.id);
  const canReserve = Boolean(user?.role === 'LOCATAIRE' && !isUnavailable);
  const ownerAvatar =
    annonce.proprietaire.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${annonce.proprietaire.prenom}+${annonce.proprietaire.nom}`
    )}&background=09244B&color=fff`;

  return (
    <Layout>
      <div className="annonce-details-page">
        <div className="annonce-details-shell">
          <div className="annonce-details-grid">
            <section className="annonce-gallery">
              <button
                type="button"
                className="annonce-hero-media card"
                onClick={() => photos.length > 0 && setShowLightbox(true)}
              >
                {photos.length > 0 ? (
                  <img
                    src={photos[activeImg]}
                    alt={`${annonce.titre} - photo ${activeImg + 1}`}
                    className="annonce-hero-image"
                  />
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
                  {annonce.ville}
                  {annonce.pays ? `, ${annonce.pays}` : ''}
                </p>

                <div className="annonce-price">
                  {Number(annonce.prix).toLocaleString('fr-FR')} <small>Ar</small>
                </div>

                <div className="annonce-metrics">
                  <div className="annonce-metric card">
                    <span>Surface</span>
                    <strong>
                      <FontAwesomeIcon icon={faRulerCombined} />
                      {annonce.superficie} m2
                    </strong>
                  </div>
                  <div className="annonce-metric card">
                    <span>Pieces</span>
                    <strong>
                      <FontAwesomeIcon icon={faBed} />
                      {annonce.nombrePieces}
                    </strong>
                  </div>
                </div>

                <div className="annonce-availability-card">
                  <span>Disponibilite actuelle</span>
                  <strong>{annonce.quantiteDisponible} unite(s) restantes</strong>
                  {typeof annonce.followerCount === 'number' && annonce.followerCount > 0 && (
                    <small>{annonce.followerCount} utilisateur(s) suivent cette annonce.</small>
                  )}
                </div>

                {isUnavailable && (
                  <div className="annonce-warning">
                    <FontAwesomeIcon icon={faBan} />
                    Cette annonce est suspendue. La reservation est desactivee jusqu'a son retour
                    en disponibilite.
                  </div>
                )}

                <div className="annonce-actions-stack">
                  <button
                    className="btn btn-primary btn-lg annonce-primary-action"
                    onClick={() =>
                      canReserve
                        ? navigate(`/reservations/nouvelle?annonceId=${annonce.id}`)
                        : !user
                          ? navigate('/login')
                          : undefined
                    }
                    disabled={Boolean(user) && !canReserve}
                  >
                    {user
                      ? canReserve
                        ? 'Reserver maintenant'
                        : 'Reservation indisponible'
                      : 'Connectez-vous pour reserver'}
                  </button>

                  <div className="annonce-secondary-actions">
                    {canFollow && (
                      <button
                        type="button"
                        className={`btn btn-ghost annonce-follow-btn ${isFollowing ? 'active' : ''}`}
                        onClick={handleFollow}
                        disabled={updatingFollow}
                      >
                        <FontAwesomeIcon icon={faHeart} />
                        {isFollowing ? 'Suivi actif' : 'Suivre'}
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

              <div className="card annonce-owner-card">
                <img src={ownerAvatar} alt="" className="avatar" width={52} height={52} />
                <div>
                  <div className="annonce-owner-label">Proprietaire</div>
                  <div className="annonce-owner-name">
                    {annonce.proprietaire.prenom} {annonce.proprietaire.nom}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <section className="card annonce-description-card">
            <h2>Description</h2>
            <p>{annonce.description}</p>
          </section>
        </div>

        {showLightbox && photos.length > 0 && (
          <Lightbox
            images={photos}
            currentIndex={activeImg}
            onClose={() => setShowLightbox(false)}
            onNext={() => setActiveImg((prev) => (prev + 1) % photos.length)}
            onPrev={() => setActiveImg((prev) => (prev - 1 + photos.length) % photos.length)}
          />
        )}
      </div>
    </Layout>
  );
}
