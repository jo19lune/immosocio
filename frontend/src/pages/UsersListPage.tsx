import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faPhone,
  faUser,
  faSearch,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';

import api from '../lib/api';
import userLineSvg from '../assets/user_1_line.svg';
import '../styles/pages/UsersPage.css';

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  photo?: string;
  telephone?: string;
  role: string;
  roleLabel?: string;
  actif: boolean;
}

const roleLabels: Record<string, string> = {
  LOCATAIRE: 'Locataire',
  PROPRIETAIRE: 'Propriétaire',
  ADMIN: 'Administrateur',
  SUPERADMIN: 'Super Administrateur',
};

export default function UsersListPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const Wrapper = ({ children }: any) => <>{children}</>;

  const fetchUsers = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const size = 20;
      const { data } = await api.get(`/annonces?page=${p}&size=${size}`);
      const items = data.content || [];
      
      const uniqueOwners = new Map<number, User>();
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

  return (
    <Wrapper>
      <div className="users-page fade-in">
        <header className="page-header">
          <h1 className="page-title">
            <FontAwesomeIcon icon={faUser} style={{ marginRight: 12 }} />
            Propriétaires
          </h1>
          <p className="page-subtitle">
            D��couvrez les propriétaires et contactez-les directement.
          </p>
        </header>

        <div className="users-filters card">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Rechercher par nom ou email..."
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
              <option value="PROPRIETAIRE">Propriétaire</option>
              <option value="LOCATAIRE">Locataire</option>
            </select>
          </div>
        </div>

        {loading && users.length === 0 && (
          <div className="users-loading">
            <div className="spinner" />
            <span>Chargement des utilisateurs...</span>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="users-empty card">
            <img
              src={userLineSvg}
              alt="Aucun utilisateur"
              width={56}
              height={56}
              style={{ opacity: 0.35, marginBottom: 12 }}
            />
            <p>Aucun utilisateur trouvé.</p>
            {searchTerm && (
              <button className="btn btn-ghost" onClick={() => { setSearchTerm(''); setRoleFilter(''); }}>
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        <div className="users-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card card">
              <div className="user-avatar">
                {user.photo ? (
                  <img src={user.photo} alt={`${user.prenom} ${user.nom}`} />
                ) : (
                  <img src={userLineSvg} alt="" width={40} height={40} style={{ opacity: 0.5 }} />
                )}
              </div>
              <div className="user-info">
                <h3 className="user-name">{user.prenom} {user.nom}</h3>
                <span className="user-role badge badge-primary">
                  {roleLabels[user.role] || user.role}
                </span>
                {user.telephone && (
                  <p className="user-contact">
                    <FontAwesomeIcon icon={faPhone} style={{ marginRight: 6 }} />
                    {user.telephone}
                  </p>
                )}
              </div>
              <div className="user-actions">
                {currentUser ? (
                  <Link
                    to={`/messages/${user.id}`}
                    className="btn btn-primary"
                  >
                    <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8 }} />
                    Contacter
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-ghost">
                    <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 8 }} />
                    Contacter
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button className="btn btn-ghost btn-lg" onClick={loadMore}>
              Voir plus
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