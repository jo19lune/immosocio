import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Stats {
  totalUtilisateurs: number;
  annoncesActives: number;
  totalReservations: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/admin/statistiques').then((res) => {
      setStats(res.data);
    }).catch(console.error);
  }, []);

  if (!stats) return <p>Chargement des statistiques...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Utilisateurs</h3>
        <p className="text-3xl font-bold text-gray-800">{stats.totalUtilisateurs}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Annonces Actives</h3>
        <p className="text-3xl font-bold text-gray-800">{stats.annoncesActives}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Réservations</h3>
        <p className="text-3xl font-bold text-gray-800">{stats.totalReservations}</p>
      </div>
    </div>
  );
}
