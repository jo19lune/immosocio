import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import api from '../lib/api';

export default function PublicFeedPage() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDernieresAnnonces();
  }, []);

  const fetchDernieresAnnonces = async () => {
    try {
      const { data } = await api.get(`/annonces?page=0&size=3`);
      setAnnonces(data.content || []);
    } catch {
      // Handle error implicitly
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-on-primary-container">
      <PublicNavbar />
      
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[819px] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-30" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTxDqF4j4qbM45X6kuWbZU-OWY9kb9UszfWsSeRYjHneErkxWPzjAFNJknkhnYl_6SpSt5-gQ_IBjsmh2Drda8ARPLVzKoTRq1f0t48vuBUd54VBQpZ0Kw4YXfvSaCwgsnXTpWMpKdnYPPN7jocDhc_fu0ieGCGaidPnSScyFLO9ofVHUlC5SizpEOich6kIfqhjv0wkUWMHNM5O4C_wFenif1BV7pFd4tbdIqn_J8M_-8gL2pGlO9mKEr4vaQJONW6XZyPsKViU_n"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-container-max mx-auto w-full flex flex-col items-center text-center gap-xl">
            <h1 className="font-h1 text-[clamp(2.5rem,5vw,4rem)] font-bold text-on-surface max-w-4xl drop-shadow-lg leading-tight">
              Trouvez votre prochain chez-vous, avec une <span className="text-primary-container">touche sociale</span>.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Découvrez des biens immobiliers exclusifs, connectez-vous avec des propriétaires vérifiés et rejoignez une communauté passionnée par l'habitat.
            </p>
            
            {/* Search/Filter Bento Box */}
            <div className="w-full max-w-4xl bg-surface-container/80 backdrop-blur-md rounded-xl border border-surface-variant p-lg shadow-2xl mt-8 text-left">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-md items-end">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Type de bien</label>
                  <div className="relative">
                    <select className="w-full bg-surface-container border border-surface-variant rounded-lg py-3 px-4 text-body-md font-body-md text-on-surface appearance-none focus:outline-none focus:border-primary-container transition-colors">
                      <option>Tous les types</option>
                      <option>Appartement</option>
                      <option>Maison</option>
                      <option>Villa</option>
                      <option>Studio</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Localisation</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">location_on</span>
                    <input 
                      type="text" 
                      placeholder="Ville, quartier..." 
                      className="w-full bg-surface-container border border-surface-variant rounded-lg py-3 pl-10 pr-4 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Budget Max (Ar)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="Ex: 5000000" 
                      className="w-full bg-surface-container border border-surface-variant rounded-lg py-3 px-4 text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>
                
                <Link to="/annonces" className="bg-primary-container text-on-primary-container font-body-md text-body-md font-bold py-3 px-6 rounded-lg hover:bg-primary-fixed transition-colors duration-300 w-full flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                  Rechercher
                </Link>
              </form>
            </div>
          </div>
        </section>

        {/* Dernières annonces Section */}
        <section className="py-20 px-8 max-w-container-max mx-auto w-full">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-h2 text-h2 text-on-surface">Dernières annonces</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">Les pépites fraîchement ajoutées par la communauté.</p>
            </div>
            <Link to="/annonces" className="text-primary-container font-body-sm text-body-sm hover:underline flex items-center gap-1">
              Voir tout <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-surface-variant border-t-primary-container rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {annonces.map((annonce) => (
                <article key={annonce.id} className="bg-surface-container rounded-xl overflow-hidden border border-surface-variant hover:border-primary-container/50 transition-colors duration-300 group flex flex-col h-full">
                  <Link to={`/annonces/${annonce.id}`} className="flex flex-col h-full">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {annonce.photos && annonce.photos.length > 0 ? (
                        <img
                          alt={annonce.titre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={annonce.photos[0]}
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-[64px] text-on-surface-variant opacity-30">home</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {annonce.typeTransaction === 'VENTE' ? (
                          <span className="bg-primary-container text-on-primary-container font-label-caps text-label-caps px-3 py-1 rounded-full font-bold">À Vendre</span>
                        ) : (
                          <span className="bg-surface-variant text-on-surface font-label-caps text-label-caps px-3 py-1 rounded-full font-bold">À Louer</span>
                        )}
                      </div>
                    </div>
                    <div className="p-lg flex flex-col flex-grow">
                      <h3 className="font-h3 text-h3 text-on-surface mb-2">{annonce.titre}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-4">
                        <span className="material-symbols-outlined text-[16px]">location_on</span> {annonce.localisation || 'Non spécifié'}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6 pt-4 border-t border-surface-variant">
                        <div className="flex flex-col">
                          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">{annonce.typeTransaction === 'VENTE' ? 'Prix' : 'Loyer'}</span>
                          <span className="font-body-md text-body-md text-primary-container font-bold">{annonce.prix.toLocaleString('fr-FR')} Ar</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Pièces</span>
                          <span className="font-body-md text-body-md text-on-surface">{annonce.nombrePieces || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Surface</span>
                          <span className="font-body-md text-body-md text-on-surface">{annonce.surface ? `${annonce.surface} m²` : '-'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-surface-variant">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center text-on-surface font-bold text-xs uppercase">
                            {annonce.proprietaire?.prenom?.[0]}{annonce.proprietaire?.nom?.[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-body-sm text-body-sm text-on-surface font-semibold">{annonce.proprietaire?.prenom} {annonce.proprietaire?.nom}</span>
                            <span className="font-label-caps text-label-caps text-on-surface-variant">Propriétaire</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Community CTA Card */}
        <section className="py-24 px-8 relative overflow-hidden border-t border-surface-variant mt-12">
          <div className="absolute inset-0 bg-primary-container/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-container/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto relative z-10 text-center bg-surface-container/80 backdrop-blur-xl border border-surface-variant rounded-2xl p-12 shadow-2xl">
            <h2 className="font-h2 text-h2 text-on-surface mb-4">Prêt à transformer votre expérience immobilière ?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-2xl mx-auto">
              Créez votre profil en quelques clics. Que vous cherchiez votre futur cocon, ou que vous souhaitiez mettre en valeur vos biens, la communauté ImmoSocial vous attend.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="bg-primary-container text-on-primary-container font-body-md text-body-md px-8 py-4 rounded-lg font-bold hover:bg-primary-fixed transition-colors duration-300 w-full sm:w-auto shadow-[0_0_20px_rgba(255,193,7,0.3)]">
                Créer un compte gratuitement
              </Link>
              <Link to="/login" className="bg-transparent border border-surface-variant text-on-surface font-body-md text-body-md px-8 py-4 rounded-lg font-semibold hover:bg-surface-variant transition-colors duration-300 w-full sm:w-auto">
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest text-primary-container font-manrope text-xs tracking-wider uppercase w-full mt-auto border-t border-surface-variant flex flex-col md:flex-row justify-between items-center py-12 px-10 max-w-7xl mx-auto">
        <div className="mb-6 md:mb-0">
          <span className="text-lg font-bold text-on-surface">ImmoSocial</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mb-6 md:mb-0">
          <a className="text-on-surface-variant hover:text-primary-container transition-colors" href="#">Politique de confidentialité</a>
          <a className="text-on-surface-variant hover:text-primary-container transition-colors" href="#">Conditions d'utilisation</a>
          <a className="text-on-surface-variant hover:text-primary-container transition-colors" href="#">Centre d'aide</a>
          <a className="text-on-surface-variant hover:text-primary-container transition-colors" href="#">Nous contacter</a>
        </div>
        <div className="text-on-surface-variant text-center md:text-right">
          © 2026 ImmoSocial. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}