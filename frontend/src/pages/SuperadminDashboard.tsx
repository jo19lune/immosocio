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
    { label: 'Utilisateurs Totaux', value: '1,234', icon: <Users size={24} />, color: 'var(--color-primary)', desc: '+12% ce mois-ci' },
    { label: 'Annonces Actives', value: '456', icon: <HomeIcon size={24} />, color: 'var(--color-success)', desc: '+8% cette semaine' },
    { label: 'Signalements Actifs', value: '7', icon: <ShieldAlert size={24} />, color: 'var(--color-error)', desc: '4 en attente' },
    { label: 'Performance Système', value: '99.9%', icon: <Activity size={24} />, color: 'var(--color-warning)', desc: 'Temps de réponse 120ms' },
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
        className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-on-surface mb-1">Console d'Administration</h1>
            <p className="text-on-surface-variant">Pilotez l'ensemble des modules, gérez la modération et configurez les variables globales.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium border border-primary/20">
            <ShieldCheck size={18} />
            <span>Mode Admin Actif</span>
          </div>
        </div>

        {/* Onglets */}
        <div className="card flex flex-wrap p-2 gap-2">
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} />
            <span>Statistiques</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Utilisateurs</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'reports' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            onClick={() => setActiveTab('reports')}
          >
            <ShieldAlert size={18} />
            <span>Signalements</span>
            {reportsList.filter(r => r.statut === 'EN_ATTENTE').length > 0 && (
              <span className="bg-error text-white text-xs px-2 py-0.5 rounded-full ml-1">{reportsList.filter(r => r.statut === 'EN_ATTENTE').length}</span>
            )}
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'config' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}
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
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {/* Grille de stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={stat.label}
                    className="card p-6 flex flex-col gap-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center opacity-80 border border-outline" style={{ color: stat.color }}>
                      {stat.icon}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-on-surface">{stat.value}</h3>
                      <span className="text-sm font-medium text-on-surface-variant block mt-1">{stat.label}</span>
                      <span className="text-xs font-medium mt-2 block" style={{ color: stat.label.includes('Performance') || stat.label.includes('Totaux') || stat.label.includes('Annonces') ? 'var(--color-success)' : 'var(--color-error)' }}>{stat.desc}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Sections d'activité récente */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline">
                    <Activity size={20} className="text-primary" />
                    <h2 className="text-lg font-bold text-on-surface">Activités Récentes du Serveur</h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-success mt-2 shrink-0" />
                      <div>
                        <p className="text-sm text-on-surface"><strong className="text-on-surface font-semibold">Nouvel utilisateur :</strong> ra.joachimloick@gmail.com</p>
                        <span className="text-xs text-on-surface-variant">Il y a 2 minutes</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-success mt-2 shrink-0" />
                      <div>
                        <p className="text-sm text-on-surface"><strong className="text-on-surface font-semibold">Nouvel utilisateur :</strong> joachimloick939@gmail.com</p>
                        <span className="text-xs text-on-surface-variant">Il y a 5 minutes</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-error mt-2 shrink-0" />
                      <div>
                        <p className="text-sm text-on-surface"><strong className="text-on-surface font-semibold">Signalement d'annonce :</strong> "Studio meublé proche campus"</p>
                        <span className="text-xs text-on-surface-variant">Il y a 1 heure</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline">
                    <Globe size={20} className="text-primary" />
                    <h2 className="text-lg font-bold text-on-surface">État de l'Infrastructure</h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-outline bg-surface-variant/30">
                      <div className="flex items-center gap-3 text-on-surface font-medium text-sm">
                        <Server size={16} className="text-on-surface-variant" />
                        <span>Base de données PostgreSQL</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-success/10 text-success border border-success/20">EN LIGNE</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-outline bg-surface-variant/30">
                      <div className="flex items-center gap-3 text-on-surface font-medium text-sm">
                        <Server size={16} className="text-on-surface-variant" />
                        <span>Serveur SMTP (Mail)</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-success/10 text-success border border-success/20">EN LIGNE</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-outline bg-surface-variant/30">
                      <div className="flex items-center gap-3 text-on-surface font-medium text-sm">
                        <Server size={16} className="text-on-surface-variant" />
                        <span>WebSocket Hub</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-success/10 text-success border border-success/20">EN LIGNE</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-outline bg-surface-variant/30">
                      <div className="flex items-center gap-3 text-on-surface font-medium text-sm">
                        <Server size={16} className="text-on-surface-variant" />
                        <span>Stockage local (uploads)</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">82% LIBRE</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              className="card p-6 flex flex-col gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Filtres de recherche */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input 
                    type="text" 
                    className="form-input pl-10 w-full"
                    placeholder="Rechercher par nom, prénom ou email..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="form-input sm:w-48"
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

              {/* Tableau d'utilisateurs */}
              <div className="overflow-x-auto border border-outline rounded-xl">
                <table className="w-full text-left text-sm text-on-surface">
                  <thead className="bg-surface-variant text-on-surface-variant text-xs uppercase border-b border-outline">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Utilisateur</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Rôle</th>
                      <th className="px-4 py-3 font-semibold">Status Email</th>
                      <th className="px-4 py-3 font-semibold">Status Compte</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-on-surface-variant">
                          Aucun utilisateur trouvé.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id} className={!user.actif ? 'opacity-60 bg-surface-variant/20' : ''}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {user.prenom.charAt(0)}{user.nom.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold">{user.prenom} {user.nom}</p>
                                <p className="text-xs text-on-surface-variant">{user.dateInscription}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                              user.role === 'SUPERADMIN' ? 'bg-error/10 text-error border-error/20' : 
                              user.role === 'ADMIN' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-primary/10 text-primary border-primary/20'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {user.emailVerifie ? (
                              <span className="flex items-center gap-1 text-success text-xs font-semibold">
                                <CheckCircle2 size={14} /> Vérifié
                              </span>
                            ) : (
                              <button 
                                className="flex items-center gap-1 text-warning text-xs font-semibold hover:underline"
                                onClick={() => handleVerifyEmail(user.id)}
                              >
                                <AlertTriangle size={14} /> Non vérifié
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-1 rounded border ${user.actif ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                              {user.actif ? 'ACTIF' : 'BLOQUÉ'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                className="p-1.5 rounded-md hover:bg-surface-variant transition-colors text-on-surface-variant"
                                onClick={() => handleToggleActif(user.id, user.actif)}
                                title={user.actif ? "Bloquer" : "Activer"}
                              >
                                {user.actif ? <Lock size={16} /> : <Unlock size={16} />}
                              </button>
                              <select 
                                className="form-input text-xs py-1 px-2 h-8 w-28"
                                value={user.role}
                                onChange={(e) => handleChangeRole(user.id, e.target.value)}
                              >
                                <option value="LOCATAIRE">Locataire</option>
                                <option value="PROPRIETAIRE">Propriétaire</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SUPERADMIN">Superadmin</option>
                              </select>
                              <button 
                                className="p-1.5 rounded-md hover:bg-error/10 text-error transition-colors"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
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
              className="card p-6 flex flex-col gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-outline">
                <ShieldAlert size={22} className="text-error" />
                <h2 className="text-lg font-bold text-on-surface">Modération & Signalements</h2>
              </div>

              <div className="overflow-x-auto border border-outline rounded-xl">
                <table className="w-full text-left text-sm text-on-surface">
                  <thead className="bg-surface-variant text-on-surface-variant text-xs uppercase border-b border-outline">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Annonce</th>
                      <th className="px-4 py-3 font-semibold">Auteur</th>
                      <th className="px-4 py-3 font-semibold">Signalé par</th>
                      <th className="px-4 py-3 font-semibold">Motif</th>
                      <th className="px-4 py-3 font-semibold">Statut</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {reportsList.map(report => (
                      <tr key={report.id}>
                        <td className="px-4 py-3 font-semibold">{report.annonceTitle}</td>
                        <td className="px-4 py-3">{report.auteurName}</td>
                        <td className="px-4 py-3">{report.signalePar}</td>
                        <td className="px-4 py-3 text-on-surface-variant italic max-w-xs truncate">{report.motif}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                            report.statut === 'EN_ATTENTE' ? 'bg-error/10 text-error border-error/20' : 
                            report.statut === 'RESOLU' ? 'bg-success/10 text-success border-success/20' : 'bg-surface-variant text-on-surface-variant border-outline'
                          }`}>
                            {report.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">{report.dateSignalement}</td>
                        <td className="px-4 py-3 text-right">
                          {report.statut === 'EN_ATTENTE' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                className="btn btn-sm text-xs px-3 py-1 bg-success hover:bg-success/90 text-white"
                                onClick={() => handleResolveReport(report.id, 'RESOLU')}
                              >
                                Résoudre
                              </button>
                              <button 
                                className="btn btn-ghost text-xs px-3 py-1"
                                onClick={() => handleResolveReport(report.id, 'REJETE')}
                              >
                                Rejeter
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-on-surface-variant font-medium">Aucune action</span>
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
              className="card p-6 flex flex-col gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-outline">
                <Settings size={22} className="text-primary" />
                <h2 className="text-lg font-bold text-on-surface">Paramètres globaux</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-outline rounded-xl p-5 bg-surface-variant/10">
                  <h3 className="font-bold text-on-surface mb-4">Sécurité et Comptes</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-on-surface text-sm">Mode Maintenance</p>
                      <p className="text-xs text-on-surface-variant">Bloque l'accès public</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={maintenanceMode}
                        onChange={(e) => {
                          setMaintenanceMode(e.target.checked);
                          toast.success(e.target.checked ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
                        }}
                      />
                      <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-on-surface text-sm">Inscriptions Publiques</p>
                      <p className="text-xs text-on-surface-variant">Autoriser nouveaux comptes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={publicRegister}
                        onChange={(e) => {
                          setPublicRegister(e.target.checked);
                          toast.success(e.target.checked ? 'Inscriptions autorisées' : 'Inscriptions fermées');
                        }}
                      />
                      <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="border border-outline rounded-xl p-5 bg-surface-variant/10">
                  <h3 className="font-bold text-on-surface mb-4">Limites Système</h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-on-surface">Taille max upload (Mo)</label>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        className="form-input flex-1" 
                        value={maxUploadSize}
                        onChange={(e) => setMaxUploadSize(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={() => toast.success(`Paramètre mis à jour : ${maxUploadSize} Mo`)}
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
