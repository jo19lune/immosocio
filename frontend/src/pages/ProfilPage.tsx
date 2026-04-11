import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PublicationCard from '../components/publications/PublicationCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import './ProfilPage.css';

export default function ProfilPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
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
                <span className="badge badge-primary profil-role">
                  {user.role === 'PROPRIETAIRE' ? '🏠 Propriétaire' : user.role === 'ADMIN' ? '⚙️ Admin' : '🔑 Locataire'}
                </span>
              )}
              <p className="profil-stats">
                <strong>{publications.length}</strong> publication{publications.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="profil-actions">
              {isOwnProfile ? (
                <button className="btn btn-ghost" onClick={() => navigate('/parametres')}>
                  ✏️ Modifier le profil
                </button>
              ) : user ? (
                <button className="btn btn-primary"
                  onClick={() => navigate(`/messages/${userId}`)}>
                  ✉️ Envoyer un message
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
              <span style={{ fontSize: 40 }}>📝</span>
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
