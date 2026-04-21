import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PublicationCard from '../components/publications/PublicationCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import homeLineSvg from '../assets/home_1_line.svg';
import settingsLineSvg from '../assets/settings_1_line.svg';
import messengerLineSvg from '../assets/messenger_line.svg';
import announcementLineSvg from '../assets/announcement_line.svg';
import userLineSvg from '../assets/user_1_line.svg';
import '../styles/pages/ProfilPage.css';

export default function ProfilPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [profil, setProfil] = useState<any>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?.id === Number(userId);

  useEffect(() => {
    fetchProfil();
  }, [userId]);

  const fetchProfil = async () => {
    setLoading(true);
    try {
      // On récupère les publications filtrées par auteur via le fil général
      const { data } = await api.get(`/publications?page=0&size=20`);
      const userPubs = (data.content || []).filter((p: any) => p.auteur?.id === Number(userId));
      setPublications(userPubs);
      if (userPubs.length > 0) {
        setProfil(userPubs[0].auteur);
      } else if (isOwnProfile && user) {
        setProfil({ id: user.id, nom: user.nom, prenom: user.prenom, photo: user.photo });
      }
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const avatarUrl = (p: any) =>
    p?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent((p?.prenom || '') + '+' + (p?.nom || ''))}&background=3B6CF8&color=fff&bold=true&size=128`;

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }

  const displayUser = profil || (isOwnProfile ? user : null);

  return (
    <AppLayout>
      <div className="profil-page">
        {/* Bannière profil */}
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
                <span className="badge badge-primary profil-role" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {user.role === 'PROPRIETAIRE' ? (
                    <><img src={homeLineSvg} alt="" width={14} height={14} style={{ filter: 'brightness(0) invert(1)' }} /> Propriétaire</>
                  ) : user.role === 'ADMIN' ? (
                    <><img src={settingsLineSvg} alt="" width={14} height={14} style={{ filter: 'brightness(0) invert(1)' }} /> Admin</>
                  ) : (
                    <><img src={userLineSvg} alt="" width={14} height={14} style={{ filter: 'brightness(0) invert(1)' }} /> Locataire</>
                  )}
                </span>
              )}
              <p className="profil-stats">
                <strong>{publications.length}</strong> publication{publications.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="profil-actions">
              {isOwnProfile ? (
                <>
                  <button className="btn btn-ghost" onClick={() => navigate('/parametres')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <img src={settingsLineSvg} alt="" width={16} height={16} /> Modifier le profil
                  </button>
                  {user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN' && (
                    <button className="btn btn-secondary" onClick={() => switchRole()} style={{ marginLeft: 8 }}>
                      🔄 Passer en {user?.role === 'PROPRIETAIRE' ? 'Locataire' : 'Propriétaire'}
                    </button>
                  )}
                </>
              ) : user ? (
                <button className="btn btn-primary"
                  onClick={() => navigate(`/messages/${userId}`)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <img src={messengerLineSvg} alt="" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} /> Envoyer un message
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Publications */}
        <div className="profil-publications">
          <h2 className="profil-pubs-title">Publications</h2>

          {publications.length === 0 && (
            <div className="profil-empty card">
              <img src={announcementLineSvg} alt="" width={48} height={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>{isOwnProfile ? 'Vous n\'avez pas encore publié.' : 'Aucune publication.'}</p>
              {isOwnProfile && (
                <button className="btn btn-primary" onClick={() => navigate('/feed')}>
                  Créer une publication
                </button>
              )}
            </div>
          )}

          {publications.map((pub) => (
            <PublicationCard
              key={pub.id}
              publication={pub}
              onDelete={(id) => setPublications((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
