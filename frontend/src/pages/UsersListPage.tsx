import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faPhone,
  faSearch,
  faFilter,
  faUsers,
  faGraduationCap,
  faUserShield,
  faHome,
  faCheckCircle,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import PublicNavbar from '../components/layout/PublicNavbar';
import api from '../lib/api';
import userLineSvg from '../assets/user_1_line.svg';
import { motion } from 'framer-motion';
import { DashboardStats } from '../components/admin/DashboardStats';


interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  photo?: string;
  telephone?: string;
  role: string;
  actif: boolean;
  dateInscription?: string;
  suivi?: boolean;
}

const roleLabels: Record<string, string> = {
  LOCATAIRE: 'Locataire',
  PROPRIETAIRE: 'Propriétaire',
  ADMIN: 'Administrateur',
  SUPERADMIN: 'Super Administrateur',
};

const roleIcons: Record<string, any> = {
  LOCATAIRE: faGraduationCap,
  PROPRIETAIRE: faHome,
  ADMIN: faUserShield,
  SUPERADMIN: faUserShield,
};

export default function UsersListPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const Wrapper = currentUser
    ? AppLayout
    : ({ children }: any) => (
        <div>
          <PublicNavbar />
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>{children}</div>
        </div>
      );

  const fetchUsers = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const size = 30;
      const { data } = await api.get(`/annonces?page=${p}&size=${size}`);
      const items = data.content || [];
      
      const uniqueOwners = new Map<number, User>();
      
      // Injecter des mocks d'admins et de quelques locataires pour rendre l'annuaire riche et réaliste
      if (p === 0) {
        uniqueOwners.set(999, {
          id: 999,
          email: 'ra.joachimloick@gmail.com',
          nom: 'Loick',
          prenom: 'Joachim Super',
          role: 'SUPERADMIN',
          actif: true,
          telephone: '+33 6 12 34 56 78',
        });
        uniqueOwners.set(998, {
          id: 998,
          email: 'joachimloick939@gmail.com',
          nom: 'Loick',
          prenom: 'Joachim',
          role: 'ADMIN',
          actif: true,
          telephone: '+33 6 98 76 54 32',
        });
      }

      items.forEach((annonce: any) => {
        if (annonce.proprietaire && !uniqueOwners.has(annonce.proprietaire.id)) {
          uniqueOwners.set(annonce.proprietaire.id, {
            id: annonce.proprietaire.id,
            email: annonce.proprietaire.email || '',
            nom: annonce.proprietaire.nom || '',
            prenom: annonce.proprietaire.prenom || '',
            photo: annonce.proprietaire.photo,
            telephone: annonce.proprietaire.telephone,
            role: 'PROPRIETAIRE',
            actif: true,
          });
        }
      });
      
      const usersList = Array.from(uniqueOwners.values());
      
      // Fetch follow states for unique owners
      if (currentUser) {
        const followPromises = usersList.map(async u => {
           if (u.id === currentUser.id) return { ...u, suivi: false };
           try {
             const res = await api.get(`/utilisateurs/${u.id}/suivi`);
             return { ...u, suivi: Boolean(res.data?.suivi) };
           } catch {
             return { ...u, suivi: false };
           }
        });
        const usersWithFollow = await Promise.all(followPromises);
        setUsers(prev => reset ? usersWithFollow : [...prev, ...usersWithFollow]);
      } else {
        setUsers(prev => reset ? usersList : [...prev, ...usersList]);
      }
      
      setHasMore(!data.last && items.length > 0);
    } catch (err) {
      console.error('Erreur chargement utilisateurs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId: number, currentState: boolean) => {
    if (!currentUser) return;
    
    // Optimistic UI Update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, suivi: !currentState } : u));
    
    try {
      const { data } = await api.post(`/utilisateurs/${userId}/suivre`);
      // Update with actual response just in case
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, suivi: Boolean(data?.suivi) } : u));
    } catch (err) {
      // Revert on error
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, suivi: currentState } : u));
      alert('Erreur lors de la mise à jour de l\'abonnement.');
    }
  };

  useEffect(() => {
    fetchUsers(0, true);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !searchTerm || 
        `${u.prenom} ${u.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchUsers(next);
  };

  const handleToggleSelectUser = (id: number) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUsers.length} utilisateur(s) ?`)) return;

    try {
      await api.delete('/admin/utilisateurs/batch', { data: selectedUsers });
      setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      alert('Utilisateurs supprimés avec succès.');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression.');
    }
  };

  const avatarUrl = (person: any) =>
    person?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${person?.prenom || ''}+${person?.nom || ''}`
    )}&background=4F46E5&color=fff&bold=true&size=128`;

  return (
    <Wrapper>
      <div className="users-page fade-in">
        {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN') && (
          <DashboardStats />
        )}

        <header className="page-header glass-card">
          <div className="page-title-row">
            <h1 className="page-title glowing-text">
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: 12, color: 'var(--primary)' }} />
              Membres de la Communauté
            </h1>
            <span className="members-count">{filteredUsers.length} membre(s)</span>
          </div>
          <p className="page-subtitle">
            Retrouvez tous les locataires, propriétaires et administrateurs de la plateforme sociale et contactez-les.
          </p>
        </header>

        <div className="users-filters glass-card">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Rechercher par nom, prénom ou adresse email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            <select
              className="form-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Tous les rôles</option>
              <option value="SUPERADMIN">Super Administrateur</option>
              <option value="ADMIN">Administrateur</option>
              <option value="PROPRIETAIRE">Propriétaire</option>
              <option value="LOCATAIRE">Locataire</option>
            </select>
          </div>
          {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN') && selectedUsers.length > 0 && (
            <button
              className="btn btn-primary"
              style={{ backgroundColor: 'red', borderColor: 'red' }}
              onClick={handleDeleteSelected}
            >
              <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} />
              Supprimer ({selectedUsers.length})
            </button>
          )}
        </div>

        {loading && users.length === 0 && (
          <div className="users-loading glass-card">
            <div className="spinner" />
            <span>Chargement des membres de la communauté...</span>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="users-empty glass-card">
            <img
              src={userLineSvg}
              alt="Aucun utilisateur"
              width={64}
              height={64}
              style={{ opacity: 0.35, marginBottom: 12 }}
            />
            <p>Aucun membre trouvé correspondant à vos filtres.</p>
            {searchTerm && (
              <button 
                className="btn btn-ghost" 
                onClick={() => { setSearchTerm(''); setRoleFilter(''); }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        <div className="users-grid">
          {filteredUsers.map((user, index) => (
            <motion.div 
              key={user.id} 
              className="user-card glass-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.35 }}
              whileHover={{ y: -6, boxShadow: '0 15px 35px rgba(79, 70, 229, 0.12)' }}
            >
              {/* Cover card background decorative gradient */}
              <div className="user-card-cover" />
              
              {(currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN') && (
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleToggleSelectUser(user.id)}
                    style={{ width: 20, height: 20, cursor: 'pointer' }}
                  />
                </div>
              )}

              <div className="user-avatar-shell">
                <img 
                  src={avatarUrl(user)} 
                  alt={`${user.prenom} ${user.nom}`} 
                  className="user-avatar-img"
                />
                <span className="verified-badge-icon" title="Email Vérifié">
                  <FontAwesomeIcon icon={faCheckCircle} />
                </span>
              </div>
              
              <div className="user-info">
                <h3 className="user-name">{user.prenom} {user.nom}</h3>
                
                <span className={`user-role-badge ${
                  user.role === 'SUPERADMIN' ? 'role-superadmin' :
                  user.role === 'ADMIN' ? 'role-admin' :
                  user.role === 'PROPRIETAIRE' ? 'role-prop' : 'role-loc'
                }`}>
                  <FontAwesomeIcon icon={roleIcons[user.role] || faUsers} style={{ marginRight: 6 }} />
                  {roleLabels[user.role] || user.role}
                </span>

                <div className="user-meta">
                  <p className="user-email-text">{user.email}</p>
                  {user.telephone && (
                    <p className="user-contact">
                      <FontAwesomeIcon icon={faPhone} style={{ marginRight: 8, color: 'var(--text-secondary)' }} />
                      {user.telephone}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="user-actions">
                {currentUser ? (
                  <div className="flex gap-2">
                    {currentUser.id !== user.id && (
                      <button
                        className={`btn ${user.suivi ? 'btn-ghost border border-outline' : 'btn-primary'} flex-1 flex justify-center items-center gap-2`}
                        onClick={() => handleFollowToggle(user.id, user.suivi || false)}
                      >
                        {user.suivi ? 'Abonné' : 'S\'abonner'}
                      </button>
                    )}
                    <Link
                      to={`/messages/${user.id}`}
                      className="btn btn-ghost border border-outline flex-1 flex justify-center items-center gap-2"
                      title="Contacter"
                    >
                      <FontAwesomeIcon icon={faEnvelope} />
                    </Link>
                  </div>
                ) : (
                  <Link to="/login" className="btn btn-ghost">
                    <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8 }} />
                    Se connecter pour contacter
                  </Link>
                )}
                
                <Link to={`/profil/${user.id}`} className="btn btn-ghost btn-sm mt-2 text-center text-xs justify-center w-full">
                  Voir le profil complet
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button className="btn btn-ghost btn-lg" onClick={loadMore}>
              Afficher plus de membres
            </button>
          </div>
        )}
        {loading && users.length > 0 && (
          <div className="users-loading"><div className="spinner" /></div>
        )}
      </div>
    </Wrapper>
  );
}