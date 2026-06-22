import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Users, Home as HomeIcon, Settings, Activity, 
  Search, ShieldCheck, AlertTriangle, 
  Trash2, Globe, Server, CheckCircle2, Lock, Unlock
} from 'lucide-react';
import toast from 'react-hot-toast';


interface MockUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN' | 'SUPERADMIN';
  actif: boolean;
  emailVerifie: boolean;
  dateInscription: string;
}

interface MockReport {
  id: number;
  annonceTitle: string;
  auteurName: string;
  signalePar: string;
  motif: string;
  statut: 'EN_ATTENTE' | 'RESOLU' | 'REJETE';
  dateSignalement: string;
}

export default function SuperadminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'config'>('dashboard');

  // Stats du tableau de bord
  const stats = [
    { label: 'Utilisateurs Totaux', value: '1,234', icon: <Users size={24} />, color: '#4F46E5', desc: '+12% ce mois-ci' },
    { label: 'Annonces Actives', value: '456', icon: <HomeIcon size={24} />, color: '#10B981', desc: '+8% cette semaine' },
    { label: 'Signalements Actifs', value: '7', icon: <ShieldAlert size={24} />, color: '#EF4444', desc: '4 en attente' },
    { label: 'Performance Système', value: '99.9%', icon: <Activity size={24} />, color: '#F59E0B', desc: 'Temps de réponse 120ms' },
  ];

  // Mock data pour la gestion des utilisateurs
  const [usersList, setUsersList] = useState<MockUser[]>([
    { id: 1, nom: 'Loick', prenom: 'Joachim', email: 'joachimloick939@gmail.com', role: 'ADMIN', actif: true, emailVerifie: true, dateInscription: '2026-05-10' },
    { id: 2, nom: 'Loick', prenom: 'Joachim Super', email: 'ra.joachimloick@gmail.com', role: 'SUPERADMIN', actif: true, emailVerifie: true, dateInscription: '2026-05-01' },
    { id: 3, nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@example.com', role: 'PROPRIETAIRE', actif: true, emailVerifie: true, dateInscription: '2026-05-15' },
    { id: 4, nom: 'Martin', prenom: 'Alice', email: 'alice.martin@example.com', role: 'LOCATAIRE', actif: true, emailVerifie: false, dateInscription: '2026-05-20' },
    { id: 5, nom: 'Leroy', prenom: 'Pierre', email: 'pierre.leroy@example.com', role: 'PROPRIETAIRE', actif: false, emailVerifie: true, dateInscription: '2026-05-12' },
  ]);

  // Mock data pour les signalements
  const [reportsList, setReportsList] = useState<MockReport[]>([
    { id: 101, annonceTitle: 'Studio meublé proche campus', auteurName: 'Jean Dupont', signalePar: 'Marie Curie', motif: 'Description trompeuse et fausses photos', statut: 'EN_ATTENTE', dateSignalement: '2026-05-28' },
    { id: 102, annonceTitle: 'Chambre chez l\'habitant calme', auteurName: 'Pierre Leroy', signalePar: 'Marc Vales', motif: 'Loyer abusif non conforme à la charte', statut: 'EN_ATTENTE', dateSignalement: '2026-05-29' },
    { id: 103, annonceTitle: 'T2 Lumineux moderne', auteurName: 'Julie Verne', signalePar: 'Superadmin', motif: 'Spam publicitaire répété', statut: 'RESOLU', dateSignalement: '2026-05-25' },
  ]);

  // State pour la recherche
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Config globale
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicRegister, setPublicRegister] = useState(true);
  const [maxUploadSize, setMaxUploadSize] = useState('10');

  // Actions Utilisateurs
  const handleToggleActif = (userId: number, currentStatus: boolean) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, actif: !currentStatus } : u));
    toast.success(currentStatus ? 'Utilisateur désactivé avec succès' : 'Utilisateur réactivé avec succès');
  };

  const handleVerifyEmail = (userId: number) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, emailVerifie: true } : u));
    toast.success('Email marqué comme vérifié');
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      setUsersList(prev => prev.filter(u => u.id !== userId));
      toast.success('Utilisateur supprimé définitivement');
    }
  };

  const handleChangeRole = (userId: number, newRole: any) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`Rôle mis à jour : ${newRole}`);
  };

  // Actions Signalements
  const handleResolveReport = (reportId: number, status: 'RESOLU' | 'REJETE') => {
    setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, statut: status } : r));
    toast.success(status === 'RESOLU' ? 'Signalement marqué comme résolu' : 'Signalement rejeté');
  };

  // Filtrage des utilisateurs
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = `${u.prenom} ${u.nom}`.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AppLayout>
      <motion.div 
        className="superadmin-dashboard fade-in"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="dashboard-header glass-card">
          <div className="header-text-container">
            <h1 className="glowing-text">Console d'Administration</h1>
            <p>Pilotez l'ensemble des modules, gérez la modération et configurez les variables globales.</p>
          </div>
          <div className="admin-status-badge">
            <ShieldCheck size={18} />
            <span>Mode Admin Actif</span>
          </div>
        </div>

        {/* Onglets Premium */}
        <div className="dashboard-navigation glass-card">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} />
            <span>Statistiques</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Utilisateurs</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <ShieldAlert size={18} />
            <span>Signalements</span>
            {reportsList.filter(r => r.statut === 'EN_ATTENTE').length > 0 && (
              <span className="notif-badge">{reportsList.filter(r => r.statut === 'EN_ATTENTE').length}</span>
            )}
          </button>
          <button 
            className={`nav-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings size={18} />
            <span>Configuration</span>
          </button>
        </div>

        {/* Contenu des Onglets */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {/* Grille de stats animée */}
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={stat.label}
                    className="stat-card glass-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(79, 70, 229, 0.15)' }}
                  >
                    <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div className="stat-info">
                      <h3>{stat.value}</h3>
                      <span className="stat-label">{stat.label}</span>
                      <span className="stat-change" style={{ color: stat.label.includes('Performance') || stat.label.includes('Totaux') || stat.label.includes('Annonces') ? '#10B981' : '#EF4444' }}>{stat.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Sections d'activité récente */}
              <div className="dashboard-sections">
                <div className="section-card glass-card">
                  <div className="section-header">
                    <Activity size={20} className="section-icon" />
                    <h2>Activités Récentes du Serveur</h2>
                  </div>
                  <div className="activity-timeline">
                    <div className="timeline-item">
                      <div className="timeline-dot success" />
                      <div className="timeline-content">
                        <strong>Nouvel utilisateur enregistré :</strong> ra.joachimloick@gmail.com (Superadmin créé)
                        <span>Il y a 2 minutes</span>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot success" />
                      <div className="timeline-content">
                        <strong>Nouvel utilisateur enregistré :</strong> joachimloick939@gmail.com (Admin créé)
                        <span>Il y a 5 minutes</span>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot danger" />
                      <div className="timeline-content">
                        <strong>Signalement d'annonce :</strong> "Studio meublé proche campus" par Marie Curie
                        <span>Il y a 1 heure</span>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-dot warning" />
                      <div className="timeline-content">
                        <strong>Régénération token JWT :</strong> Instance backend redémarrée
                        <span>Il y a 3 heures</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="section-card glass-card">
                  <div className="section-header">
                    <Globe size={20} className="section-icon" />
                    <h2>État de l'Infrastructure</h2>
                  </div>
                  <div className="server-status-list">
                    <div className="status-row">
                      <div className="status-name">
                        <Server size={16} />
                        <span>Base de données PostgreSQL</span>
                      </div>
                      <span className="badge badge-success">EN LIGNE</span>
                    </div>
                    <div className="status-row">
                      <div className="status-name">
                        <Server size={16} />
                        <span>Serveur SMTP (Mail)</span>
                      </div>
                      <span className="badge badge-success">EN LIGNE</span>
                    </div>
                    <div className="status-row">
                      <div className="status-name">
                        <Server size={16} />
                        <span>WebSocket Hub</span>
                      </div>
                      <span className="badge badge-success">EN LIGNE</span>
                    </div>
                    <div className="status-row">
                      <div className="status-name">
                        <Server size={16} />
                        <span>Stockage local (uploads)</span>
                      </div>
                      <span className="badge badge-primary">82% LIBRE</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              className="users-mgmt-panel glass-card fade-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Filtres de recherche */}
              <div className="users-mgmt-filters">
                <div className="search-bar-container">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, prénom ou email..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="select-container">
                  <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="ALL">Tous les rôles</option>
                    <option value="SUPERADMIN">Superadmin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="PROPRIETAIRE">Propriétaire</option>
                    <option value="LOCATAIRE">Locataire</option>
                  </select>
                </div>
              </div>

              {/* Tableau d'utilisateurs Premium */}
              <div className="table-responsive">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Status Email</th>
                      <th>Status Compte</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted">
                          Aucun utilisateur trouvé correspondant aux critères.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className={!user.actif ? 'row-inactive' : ''}>
                          <td>
                            <div className="user-table-cell">
                              <div className="user-avatar-sm">
                                {user.prenom.charAt(0)}{user.nom.charAt(0)}
                              </div>
                              <div>
                                <span className="user-table-name">{user.prenom} {user.nom}</span>
                                <span className="user-table-date">Inscrit le {user.dateInscription}</span>
                              </div>
                            </div>
                          </td>
                          <td><code className="email-code">{user.email}</code></td>
                          <td>
                            <span className={`badge ${
                              user.role === 'SUPERADMIN' ? 'badge-danger' : 
                              user.role === 'ADMIN' ? 'badge-accent' : 'badge-primary'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            {user.emailVerifie ? (
                              <span className="text-success-row">
                                <CheckCircle2 size={16} /> Verified
                              </span>
                            ) : (
                              <button 
                                className="btn-table-action text-warning-row"
                                onClick={() => handleVerifyEmail(user.id)}
                                title="Forcer la vérification"
                              >
                                <AlertTriangle size={16} /> Non vérifié
                              </button>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${user.actif ? 'badge-success' : 'badge-danger'}`}>
                              {user.actif ? 'ACTIF' : 'BLOQUÉ'}
                            </span>
                          </td>
                          <td>
                            <div className="actions-flex">
                              <button 
                                className={`btn btn-sm ${user.actif ? 'btn-ghost' : 'btn-primary'}`}
                                onClick={() => handleToggleActif(user.id, user.actif)}
                                title={user.actif ? "Bloquer le compte" : "Activer le compte"}
                              >
                                {user.actif ? <Lock size={14} /> : <Unlock size={14} />}
                              </button>

                              <select 
                                className="select-table-role"
                                value={user.role}
                                onChange={(e) => handleChangeRole(user.id, e.target.value)}
                              >
                                <option value="LOCATAIRE">Locataire</option>
                                <option value="PROPRIETAIRE">Propriétaire</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SUPERADMIN">Superadmin</option>
                              </select>

                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              className="reports-mgmt-panel glass-card fade-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="section-header border-b pb-4 mb-4">
                <ShieldAlert size={22} className="text-danger" />
                <h2>Modération & Signalements de publications</h2>
              </div>

              <div className="table-responsive">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Annonce</th>
                      <th>Auteur</th>
                      <th>Signalé par</th>
                      <th>Motif</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsList.map(report => (
                      <tr key={report.id}>
                        <td><strong>{report.annonceTitle}</strong></td>
                        <td>{report.auteurName}</td>
                        <td>{report.signalePar}</td>
                        <td><span className="report-motif">{report.motif}</span></td>
                        <td>
                          <span className={`badge ${
                            report.statut === 'EN_ATTENTE' ? 'badge-danger' : 
                            report.statut === 'RESOLU' ? 'badge-success' : 'badge-secondary'
                          }`}>
                            {report.statut}
                          </span>
                        </td>
                        <td>{report.dateSignalement}</td>
                        <td>
                          {report.statut === 'EN_ATTENTE' ? (
                            <div className="actions-flex">
                              <button 
                                className="btn btn-sm btn-accent"
                                onClick={() => handleResolveReport(report.id, 'RESOLU')}
                              >
                                Résoudre
                              </button>
                              <button 
                                className="btn btn-sm btn-ghost"
                                onClick={() => handleResolveReport(report.id, 'REJETE')}
                              >
                                Rejeter
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted text-sm font-semibold">Aucune action requise</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div 
              key="config"
              className="config-mgmt-panel glass-card fade-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="section-header border-b pb-4 mb-6">
                <Settings size={22} className="text-primary" />
                <h2>Paramètres globaux du système</h2>
              </div>

              <div className="config-grid">
                <div className="config-card">
                  <h3>Sécurité et Comptes</h3>
                  <div className="form-group">
                    <label className="toggle-switch-container">
                      <input 
                        type="checkbox" 
                        checked={maintenanceMode}
                        onChange={(e) => {
                          setMaintenanceMode(e.target.checked);
                          toast.success(e.target.checked ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
                        }}
                      />
                      <span className="toggle-label-text">
                        <strong>Mode Maintenance Global</strong>
                        <span className="toggle-desc">Bloque l'accès à la plateforme sauf pour les administrateurs.</span>
                      </span>
                    </label>
                  </div>

                  <div className="form-group mt-4">
                    <label className="toggle-switch-container">
                      <input 
                        type="checkbox" 
                        checked={publicRegister}
                        onChange={(e) => {
                          setPublicRegister(e.target.checked);
                          toast.success(e.target.checked ? 'Inscriptions publiques autorisées' : 'Inscriptions publiques fermées');
                        }}
                      />
                      <span className="toggle-label-text">
                        <strong>Inscriptions publiques autorisées</strong>
                        <span className="toggle-desc">Permet aux nouveaux visiteurs de créer un compte.</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="config-card">
                  <h3>Limites de Stockage</h3>
                  <div className="form-group">
                    <label className="form-label">Taille maximale des fichiers d'upload (Mo)</label>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        className="form-input" 
                        value={maxUploadSize}
                        onChange={(e) => setMaxUploadSize(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={() => toast.success(`Paramètre d'upload mis à jour : ${maxUploadSize} Mo`)}
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  );
}
