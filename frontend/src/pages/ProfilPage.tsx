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


import { ShieldCheck, Calendar, MessageSquare } from 'lucide-react';

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
        setProfil({ id: user.id, nom: user.nom, prenom: user.prenom, photo: user.photo, role: user.role, email: user.email });
      } else {
        // Mock fallback pour les autres profils (ex: admins créés par seeder)
        if (numericUserId === 999) {
          setProfil({ id: 999, nom: 'Loick', prenom: 'Joachim Super', role: 'SUPERADMIN', email: 'ra.joachimloick@gmail.com' });
        } else if (numericUserId === 998) {
          setProfil({ id: 998, nom: 'Loick', prenom: 'Joachim', role: 'ADMIN', email: 'joachimloick939@gmail.com' });
        } else {
          setProfil(null);
        }
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
    )}&background=4F46E5&color=fff&bold=true&size=128`;

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
    displayUser?.role === 'PROPRIETAIRE'
      ? 'Propriétaire'
      : displayUser?.role === 'ADMIN'
        ? 'Administrateur'
        : displayUser?.role === 'SUPERADMIN'
          ? 'Super Administrateur'
          : displayUser?.role === 'LOCATAIRE'
            ? 'Locataire'
            : 'Membre';

  const isPrivileged = displayUser?.role === 'ADMIN' || displayUser?.role === 'SUPERADMIN';

  return (
    <AppLayout>
      <div className="profile-page fade-in">
        <section className="profile-hero glass-card">
          <div className="profile-cover" />

          <div className="profile-head">
            <div className="profile-avatar-shell">
              <img
                src={avatarUrl(displayUser)}
                alt=""
                className="profile-avatar"
              />
              {isPrivileged && (
                <span className="profile-shield-icon" title="Compte Officiel Vérifié">
                  <ShieldCheck size={20} />
                </span>
              )}
            </div>

            <div className="profile-identity">
              <h1>{displayUser?.prenom} {displayUser?.nom}</h1>

              <div className="profile-meta-row">
                {displayUser?.role && (
                  <span className={`profile-role-chip ${
                    displayUser.role === 'SUPERADMIN' ? 'role-super' :
                    displayUser.role === 'ADMIN' ? 'role-adm' :
                    displayUser.role === 'PROPRIETAIRE' ? 'role-proprietaire' : 'role-locataire'
                  }`}>
                    {displayUser.role === 'PROPRIETAIRE' ? (
                      <img src={homeLineSvg} alt="" className="profile-chip-icon" />
                    ) : isPrivileged ? (
                      <img src={settingsLineSvg} alt="" className="profile-chip-icon" />
                    ) : (
                      <img src={userLineSvg} alt="" className="profile-chip-icon" />
                    )}
                    {roleLabel}
                  </span>
                )}

                <span className="profile-stat">
                  <MessageSquare size={16} style={{ marginRight: 6, opacity: 0.7 }} />
                  <strong>{publications.length}</strong>
                  &nbsp;publication{publications.length !== 1 ? 's' : ''}
                </span>

                <span className="profile-stat">
                  <Calendar size={16} style={{ marginRight: 6, opacity: 0.7 }} />
                  Inscrit en 2026
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
                  {!isPrivileged && (
                    <button
                      className="profile-action profile-action-muted"
                      onClick={() => switchRole()}
                    >
                      <img src={settingsLineSvg} alt="" />
                      Passer en {user?.role === 'PROPRIETAIRE' ? 'Locataire' : 'Propriétaire'}
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
            <h2>Publications récentes</h2>
            <span />
          </div>

          {publications.length === 0 && (
            <div className="profile-empty glass-card">
              <div className="profile-empty-icon">
                <img src={announcementLineSvg} alt="" />
              </div>
              <p>
                {isOwnProfile ? "Vous n'avez pas encore publié." : 'Aucune publication récente pour ce membre.'}
              </p>
              {isOwnProfile && (
                <button
                  className="profile-action profile-action-primary"
                  onClick={() => navigate('/feed')}
                >
                  Créer une publication
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
