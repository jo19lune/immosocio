import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PublicationCard from '../components/publications/PublicationCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import homeLineSvg from '../assets/home_1_line.svg';
import settingsLineSvg from '../assets/settings_1_line.svg';
import messengerLineSvg from '../assets/messenger_line.svg';
import announcementLineSvg from '../assets/announcement_line.svg';
import userLineSvg from '../assets/user_1_line.svg';
import '../styles/components/publications/PublicationCard.css';
import '../styles/pages/ProfilPage.css';

export default function ProfilPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [profil, setProfil] = useState<any>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const numericUserId = Number(userId);
  const focusedPublicationId = Number(searchParams.get('publicationId') || 0);
  const isOwnProfile = user?.id === numericUserId;

  const fetchProfil = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/publications?page=0&size=20');
      const userPublications = (data.content || []).filter(
        (publication: any) => publication.auteur?.id === numericUserId
      );
      setPublications(userPublications);

      if (userPublications.length > 0) {
        setProfil(userPublications[0].auteur);
      } else if (isOwnProfile && user) {
        setProfil({ id: user.id, nom: user.nom, prenom: user.prenom, photo: user.photo });
      } else {
        setProfil(null);
      }
    } catch {
      // silent background refresh
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfil();
  }, [userId]);

  useAutoRefresh(fetchProfil, ['publications', 'profile']);

  useEffect(() => {
    if (!focusedPublicationId || publications.length === 0) {
      return;
    }

    const target = document.getElementById(`publication-${focusedPublicationId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedPublicationId, publications]);

  const avatarUrl = (person: any) =>
    person?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${person?.prenom || ''}+${person?.nom || ''}`
    )}&background=3B6CF8&color=fff&bold=true&size=128`;

  if (loading) {
    return (
      <AppLayout>
        <div className="profile-loading">
          <div className="profile-spinner" />
        </div>
      </AppLayout>
    );
  }

  const displayUser = profil || (isOwnProfile ? user : null);
  const roleLabel =
    user?.role === 'PROPRIETAIRE'
      ? 'Proprietaire'
      : user?.role === 'ADMIN'
        ? 'Admin'
        : user?.role === 'SUPERADMIN'
          ? 'Superadmin'
          : 'Locataire';

  return (
    <AppLayout>
      <div className="profile-page">
        <section className="profile-hero glass-card">
          <div className="profile-cover" />

          <div className="profile-head">
            <div className="profile-avatar-shell">
              <img
                src={avatarUrl(displayUser)}
                alt=""
                className="profile-avatar"
              />
            </div>

            <div className="profile-identity">
              <h1>{displayUser?.prenom} {displayUser?.nom}</h1>

              <div className="profile-meta-row">
                {user?.role && isOwnProfile && (
                  <span className="profile-role-chip">
                    {user.role === 'PROPRIETAIRE' ? (
                      <img src={homeLineSvg} alt="" className="profile-chip-icon" />
                    ) : user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? (
                      <img src={settingsLineSvg} alt="" className="profile-chip-icon" />
                    ) : (
                      <img src={userLineSvg} alt="" className="profile-chip-icon" />
                    )}
                    {roleLabel}
                  </span>
                )}

                <span className="profile-stat">
                  <strong>{publications.length}</strong>
                  publication{publications.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="profile-actions">
              {isOwnProfile ? (
                <>
                  <button
                    className="profile-action profile-action-secondary"
                    onClick={() => navigate('/parametres')}
                  >
                    <img src={settingsLineSvg} alt="" />
                    Modifier le profil
                  </button>
                  {user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN' && (
                    <button
                      className="profile-action profile-action-muted"
                      onClick={() => switchRole()}
                    >
                      <img src={settingsLineSvg} alt="" />
                      Passer en {user?.role === 'PROPRIETAIRE' ? 'Locataire' : 'Proprietaire'}
                    </button>
                  )}
                </>
              ) : user ? (
                <button
                  className="profile-action profile-action-primary"
                  onClick={() => navigate(`/messages/${userId}`)}
                >
                  <img src={messengerLineSvg} alt="" />
                  Envoyer un message
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="profile-publications">
          <div className="profile-section-title">
            <h2>Publications</h2>
            <span />
          </div>

          {publications.length === 0 && (
            <div className="profile-empty glass-card">
              <div className="profile-empty-icon">
                <img src={announcementLineSvg} alt="" />
              </div>
              <p>
                {isOwnProfile ? "Vous n'avez pas encore publie." : 'Aucune publication.'}
              </p>
              {isOwnProfile && (
                <button
                  className="profile-action profile-action-primary"
                  onClick={() => navigate('/feed')}
                >
                  Creer une publication
                </button>
              )}
            </div>
          )}

          <div className="profile-feed">
            {publications.map((publication) => (
              <PublicationCard
                key={publication.id}
                domId={`publication-${publication.id}`}
                highlighted={publication.id === focusedPublicationId}
                publication={publication}
                onDelete={(id) => setPublications((prev) => prev.filter((item) => item.id !== id))}
              />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
