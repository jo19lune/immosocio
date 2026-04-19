import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, Home as HomeIcon, Settings, Activity } from 'lucide-react';
import './SuperadminDashboard.css';

export default function SuperadminDashboard() {
  const stats = [
    { label: 'Utilisateurs Totaux', value: '1,234', icon: <Users size={24} />, color: '#3B82F6' },
    { label: 'Annonces Actives', value: '456', icon: <HomeIcon size={24} />, color: '#10B981' },
    { label: 'Signalements', value: '12', icon: <ShieldAlert size={24} />, color: '#EF4444' },
    { label: 'Activité', value: '98%', icon: <Activity size={24} />, color: '#F59E0B' },
  ];

  return (
    <AppLayout>
      <motion.div 
        className="superadmin-dashboard"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="dashboard-header">
          <h1>Tableau de Bord Superadmin</h1>
          <p>Gérez les utilisateurs, les annonces et les paramètres globaux de la plateforme.</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              className="stat-card card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <span>{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="dashboard-sections">
          <motion.div 
            className="section-card card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="section-header">
              <Users size={20} />
              <h2>Derniers Utilisateurs Inscrits</h2>
            </div>
            <div className="empty-state-modern">
              <p>Fonctionnalité en cours de développement.</p>
              <button className="btn btn-secondary">Voir tous les utilisateurs</button>
            </div>
          </motion.div>

          <motion.div 
            className="section-card card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="section-header">
              <Settings size={20} />
              <h2>Paramètres Globaux</h2>
            </div>
            <div className="empty-state-modern">
              <p>Configuration de l'instance et règles métier.</p>
              <button className="btn btn-primary">Configurer</button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
