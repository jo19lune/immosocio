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
        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  const displayUser = profil || (isOwnProfile ? user : null);

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
        <div className="glass-card relative overflow-hidden rounded-3xl mb-8 p-0 border border-surface-variant/50 shadow-xl">
          {/* Banner Background */}
          <div className="h-40 md:h-48 w-full relative bg-gradient-to-br from-primary-container via-surface-variant to-background overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-12 px-6 pb-6 gap-6 relative z-10">
            {/* Avatar */}
            <div className="relative group">
              <img
                src={avatarUrl(displayUser)}
                alt=""
                className="w-32 h-32 rounded-full border-4 border-surface shadow-2xl object-cover bg-surface-container z-10 relative"
              />
              <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* User Info */}
            <div className="text-center md:text-left flex-1 mb-2 md:mb-0">
              <h1 className="text-3xl font-bold text-on-surface mb-2">
                {displayUser?.prenom} {displayUser?.nom}
              </h1>
              
              <div className="flex flex-col md:flex-row items-center md:items-center gap-3">
                {user?.role && isOwnProfile && (
                  <span className="bg-primary-container/80 backdrop-blur text-on-primary-container font-medium px-4 py-1.5 rounded-full text-sm inline-flex items-center gap-2 border border-primary/20">
                    {user.role === 'PROPRIETAIRE' ? (
                      <>
                        <img src={homeLineSvg} alt="" className="w-4 h-4 filter-invert opacity-80" />
                        Propriétaire
                      </>
                    ) : user.role === 'ADMIN' ? (
                      <>
                        <img src={settingsLineSvg} alt="" className="w-4 h-4 filter-invert opacity-80" />
                        Admin
                      </>
                    ) : (
                      <>
                        <img src={userLineSvg} alt="" className="w-4 h-4 filter-invert opacity-80" />
                        Locataire
                      </>
                    )}
                  </span>
                )}
                
                <p className="text-outline-variant text-sm font-medium">
                  <strong className="text-on-surface">{publications.length}</strong> publication{publications.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center md:justify-end gap-3 mt-4 md:mt-0 w-full md:w-auto">
              {isOwnProfile ? (
                <>
                  <button
                    className="bg-surface-container-high hover:bg-surface-bright text-on-surface font-medium px-5 py-2.5 rounded-full transition-colors flex items-center gap-2 border border-surface-variant hover:border-outline"
                    onClick={() => navigate('/parametres')}
                  >
                    <img src={settingsLineSvg} alt="" className="w-4 h-4 opacity-70 filter-invert" />
                    Modifier le profil
                  </button>
                  {user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN' && (
                    <button
                      className="bg-surface-variant hover:bg-surface-container-high text-on-surface font-medium px-5 py-2.5 rounded-full transition-colors flex items-center gap-2 border border-transparent"
                      onClick={() => switchRole()}
                    >
                      <img src={settingsLineSvg} alt="" className="w-4 h-4 opacity-50 filter-invert" />
                      Passer en {user?.role === 'PROPRIETAIRE' ? 'Locataire' : 'Propriétaire'}
                    </button>
                  )}
                </>
              ) : user ? (
                <button
                  className="bg-primary hover:bg-primary-container text-on-primary font-medium px-6 py-2.5 rounded-full transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                  onClick={() => navigate(`/messages/${userId}`)}
                >
                  <img src={messengerLineSvg} alt="" className="w-5 h-5 filter-invert" />
                  Envoyer un message
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8 border-b border-surface-variant/50 pb-4">
            <h2 className="text-xl font-bold text-on-surface">Publications</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-surface-variant to-transparent"></div>
          </div>

          {publications.length === 0 && (
            <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
                <img src={announcementLineSvg} alt="" className="w-8 h-8 opacity-40 filter-invert" />
              </div>
              <p className="text-outline mb-6 text-lg">
                {isOwnProfile ? "Vous n'avez pas encore publié." : 'Aucune publication.'}
              </p>
              {isOwnProfile && (
                <button 
                  className="bg-primary hover:bg-primary-container text-on-primary font-medium px-6 py-2.5 rounded-full transition-colors" 
                  onClick={() => navigate('/feed')}
                >
                  Créer une publication
                </button>
              )}
            </div>
          )}

          <div className="space-y-6">
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
      </div>
    </AppLayout>
  );
}
