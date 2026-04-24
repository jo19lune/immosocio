import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import PublicationCard from '../components/publications/PublicationCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import homeLineSvg from '../assets/home_1_line.svg';
import settingsLineSvg from '../assets/settings_1_line.svg';
import messengerLineSvg from '../assets/messenger_line.svg';
import announcementLineSvg from '../assets/announcement_line.svg';
import userLineSvg from '../assets/user_1_line.svg';
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
      
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" />
        </div>
      
    );
  }

  const displayUser = profil || (isOwnProfile ? user : null);

  return (
    
      <div className="profil-page">
        <div className="profil-banner card">
          <div className="profil-banner-bg" />
          <div className="profil-info">
            <img
              src={avatarUrl(displayUser)}
              alt=""
              className="profil-avatar"
              width={96}
              height={96}
            />

            <div className="profil-meta">
              <h1 className="profil-name">
                {displayUser?.prenom} {displayUser?.nom}
              </h1>
              {user?.role && isOwnProfile && (
                <span
                  className="badge badge-primary profil-role"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {user.role === 'PROPRIETAIRE' ? (
                    <>
                      <img
                        src={homeLineSvg}
                        alt=""
                        width={14}
                        height={14}
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                      Proprietaire
                    </>
                  ) : user.role === 'ADMIN' ? (
                    <>
                      <img
                        src={settingsLineSvg}
                        alt=""
                        width={14}
                        height={14}
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                      Admin
                    </>
                  ) : (
                    <>
                      <img
                        src={userLineSvg}
                        alt=""
                        width={14}
                        height={14}
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                      Locataire
                    </>
                  )}
                </span>
              )}
              <p className="profil-stats">
                <strong>{publications.length}</strong> publication
                {publications.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="profil-actions">
              {isOwnProfile ? (
                <>
                  <button
                    className="btn btn-ghost"
                    onClick={() => navigate('/parametres')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <img src={settingsLineSvg} alt="" width={16} height={16} />
                    Modifier le profil
                  </button>
                  {user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => switchRole()}
                      style={{ marginLeft: 8 }}
                    >
                      Passer en {user?.role === 'PROPRIETAIRE' ? 'Locataire' : 'Proprietaire'}
                    </button>
                  )}
                </>
              ) : user ? (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/messages/${userId}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <img
                    src={messengerLineSvg}
                    alt=""
                    width={18}
                    height={18}
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                  Envoyer un message
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="profil-publications">
          <h2 className="profil-pubs-title">Publications</h2>

          {publications.length === 0 && (
            <div className="profil-empty card">
              <img
                src={announcementLineSvg}
                alt=""
                width={48}
                height={48}
                style={{ opacity: 0.3, marginBottom: 12 }}
              />
              <p>{isOwnProfile ? "Vous n'avez pas encore publie." : 'Aucune publication.'}</p>
              {isOwnProfile && (
                <button className="btn btn-primary" onClick={() => navigate('/feed')}>
                  Creer une publication
                </button>
              )}
            </div>
          )}

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
      </div>
    
  );
}
