import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(true);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!q) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [annRes, userRes] = await Promise.all([
          api.get(`/annonces/recherche?ville=${encodeURIComponent(q)}&page=0&size=6`),
          api.get(`/utilisateurs/recherche?q=${encodeURIComponent(q)}&page=0&size=6`),
        ]);
        
        // If ville search returns nothing, try searching by title (the backend /recherche endpoint mainly uses ville, but I can improve it or just show results)
        // Actually, I'll stick to what the backend provides for now.
        
        setAnnonces(annRes.data.content || []);
        setUsers(userRes.data.content || []);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [q]);

  const Section = ({ title, children, count }: { title: string; children: React.ReactNode, count: number }) => (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-h2 text-h2 text-on-surface flex items-center gap-3">
          {title}
          <span className="bg-surface-container-high text-on-surface-variant text-sm px-3 py-1 rounded-full">{count}</span>
        </h2>
      </div>
      {children}
    </section>
  );

  return (
    <AppLayout>
      <div className="max-w-container-max mx-auto p-4 md:p-lg">
        <div className="mb-8">
          <p className="text-on-surface-variant font-body-md mb-2">Résultats pour</p>
          <h1 className="font-h1 text-h1 text-on-surface italic">"{q}"</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {users.length > 0 && (
              <Section title="Comptes" count={users.length}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((u) => (
                    <Link
                      to={`/profil/${u.id}`}
                      key={u.id}
                      className="bg-surface-container-low border border-surface-variant rounded-2xl p-4 flex items-center gap-4 hover:border-primary transition-all group"
                    >
                      <img
                        src={u.photo || `https://ui-avatars.com/api/?name=${u.prenom}+${u.nom}&background=fabd00&color=000&bold=true`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-surface-variant group-hover:border-primary"
                        alt=""
                      />
                      <div className="overflow-hidden">
                        <p className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {u.prenom} {u.nom}
                        </p>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider">
                          {u.role === 'PROPRIETAIRE' ? 'Propriétaire' : 'Locataire'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined ml-auto text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {annonces.length > 0 && (
              <Section title="Annonces" count={annonces.length}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {annonces.map((a) => (
                    <Link
                      to={`/annonces/${a.id}`}
                      key={a.id}
                      className="group bg-surface-container-low border border-surface-variant rounded-2xl overflow-hidden hover:border-primary transition-all flex flex-col"
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={a.photos?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1073&auto=format&fit=crop'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          alt=""
                        />
                        <div className="absolute top-3 right-3 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                          {a.typeTransaction || 'Détails'}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-on-surface mb-1 group-hover:text-primary transition-colors truncate">{a.titre}</h3>
                        <p className="text-on-surface-variant text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {a.ville}
                        </p>
                        <p className="mt-4 font-h3 text-primary font-bold">
                          {a.prix?.toLocaleString('fr-FR')} Ar
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {annonces.length === 0 && users.length === 0 && (
              <div className="text-center py-24 bg-surface-container-low border border-surface-variant rounded-3xl">
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4">search_off</span>
                <h3 className="font-h3 text-h3 text-on-surface">Aucun résultat trouvé</h3>
                <p className="text-on-surface-variant mt-2">Essayez d'autres mots-clés ou vérifiez l'orthographe.</p>
                <Link to="/annonces" className="inline-block mt-8 text-primary font-bold hover:underline">
                  Retourner aux annonces
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
