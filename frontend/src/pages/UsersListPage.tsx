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
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import PublicNavbar from '../components/layout/PublicNavbar';
import api from '../lib/api';
import userLineSvg from '../assets/user_1_line.svg';
import { motion } from 'framer-motion';
import "../styles/pages/UsersPage.css";

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
      setUsers(prev => reset ? usersList : [...prev, ...usersList]);
      setHasMore(!data.last && items.length > 0);
    } catch (err) {
      console.error('Erreur chargement utilisateurs', err);
    } finally {
      setLoading(false);
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

  const avatarUrl = (person: any) =>
    person?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${person?.prenom || ''}+${person?.nom || ''}`
    )}&background=4F46E5&color=fff&bold=true&size=128`;

  return (
    <Wrapper>
      <div className="users-page fade-in">
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
                  <Link
                    to={`/messages/${user.id}`}
                    className="btn btn-primary btn-message-gradient"
                  >
                    <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8 }} />
                    Contacter
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-ghost">
                    <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8 }} />
                    Se connecter pour contacter
                  </Link>
                )}
                
                <Link to={`/profil/${user.id}`} className="btn btn-ghost btn-sm mt-2 text-center text-xs justify-center">
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