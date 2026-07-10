import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PublicationCard from '../components/publications/PublicationCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { ShieldCheck, Calendar, MessageSquare, Settings, Repeat, MessageCircle } from 'lucide-react';

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
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        <section className="card overflow-hidden">
          <div className="h-32 bg-surface-variant/50 w-full" />

          <div className="px-6 pb-6 pt-12 relative flex flex-col md:flex-row gap-6 md:items-start">
            <div className="absolute -top-16 left-6 relative-avatar">
              <div className="relative inline-block">
                <img
                  src={avatarUrl(displayUser)}
                  alt=""
                  className="w-32 h-32 rounded-full border-4 border-surface bg-surface object-cover shadow-sm"
                />
                {isPrivileged && (
                  <span className="absolute bottom-1 right-1 bg-primary text-on-primary p-1.5 rounded-full border-2 border-surface" title="Compte Officiel Vérifié">
                    <ShieldCheck size={16} />
                  </span>
                )}
              </div>
            </div>

            <div className="mt-16 md:mt-0 flex-1">
              <h1 className="text-2xl font-bold text-on-surface">{displayUser?.prenom} {displayUser?.nom}</h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-on-surface-variant">
                {displayUser?.role && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    displayUser.role === 'SUPERADMIN' ? 'bg-error/10 text-error' :
                    displayUser.role === 'ADMIN' ? 'bg-warning/10 text-warning' :
                    displayUser.role === 'PROPRIETAIRE' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'
                  }`}>
                    {roleLabel}
                  </span>
                )}

                <span className="flex items-center gap-1.5 font-medium">
                  <MessageSquare size={16} className="opacity-70" />
                  <strong>{publications.length}</strong>
                  &nbsp;publication{publications.length !== 1 ? 's' : ''}
                </span>

                <span className="flex items-center gap-1.5">
                  <Calendar size={16} className="opacity-70" />
                  Inscrit en 2026
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              {isOwnProfile ? (
                <>
                  <button
                    className="btn btn-ghost border border-outline flex items-center gap-2"
                    onClick={() => navigate('/parametres')}
                  >
                    <Settings size={18} />
                    Modifier
                  </button>
                  {!isPrivileged && (
                    <button
                      className="btn btn-ghost border border-outline flex items-center gap-2"
                      onClick={() => switchRole()}
                    >
                      <Repeat size={18} />
                      Passer en {user?.role === 'PROPRIETAIRE' ? 'Locataire' : 'Propriétaire'}
                    </button>
                  )}
                </>
              ) : user ? (
                <button
                  className="btn btn-primary flex items-center gap-2"
                  onClick={() => navigate(`/messages/${userId}`)}
                >
                  <MessageCircle size={18} />
                  Message
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-on-surface">Publications récentes</h2>
            <div className="h-px bg-outline flex-1" />
          </div>

          {publications.length === 0 && (
            <div className="card p-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-variant/30 flex items-center justify-center text-on-surface-variant">
                <MessageSquare size={32} />
              </div>
              <p className="text-on-surface-variant max-w-sm">
                {isOwnProfile ? "Vous n'avez pas encore publié." : 'Aucune publication récente pour ce membre.'}
              </p>
              {isOwnProfile && (
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => navigate('/feed')}
                >
                  Créer une publication
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-6">
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
