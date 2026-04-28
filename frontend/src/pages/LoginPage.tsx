import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await login(email, motDePasse);
      navigate('/feed');
    } catch (err: any) {
      if (err.response?.data?.champs) {
        setFieldErrors(err.response.data.champs);
      } else if (err.response?.data?.erreur) {
        setError(err.response.data.erreur);
      } else {
        setError('Email ou mot de passe incorrect.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center relative overflow-hidden font-body-md antialiased">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover opacity-10" 
          alt="Luxurious modern mansion exterior at twilight with warm glowing interior lights and sleek contemporary architectural lines" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj1p2Aux8I0h90orXQtWMi6i9tOiy40EmZ_ZAV73A-QCU0vTR4aB-cfYWBrP7fyRjNrmFL_UFpKPW1ErGCqulDbh40wHjhl6MslFsJMskmUCibMJDHK66APkc1KYnnmaHgaH4W0COD8M8-hBTqY9GoBknKzbEfzYyiwkM4SUJHK1XwU5oM-sz-NQItzY4dDXj7LAJoQAA4cFN14qVzRedcYcnGXUvYNi1IVuIEgclOyTRAlv7iyNBj9wkO5WvEqRqIYFahEnbNLNa-"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 mix-blend-multiply"></div>
      </div>
      
      {/* Auth Card */}
      <motion.main 
        className="relative z-10 w-full max-w-[420px] mx-gutter p-lg bg-surface-container/80 backdrop-blur-2xl border border-surface-variant rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header */}
        <header className="text-center mb-xl">
          <h1 className="font-h2 text-h2 text-primary-container tracking-tight">ImmoSocial</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Accédez à votre réseau exclusif</p>
        </header>
        
        {/* Tabs */}
        <div className="flex border-b border-surface-variant mb-lg">
          <button 
            type="button"
            className="flex-1 pb-sm font-label-caps text-label-caps text-primary-container border-b-2 border-primary-container transition-colors uppercase"
          >
            Se connecter
          </button>
          <Link 
            to="/register"
            className="flex-1 text-center pb-sm font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface border-b-2 border-transparent transition-colors uppercase"
          >
            S'inscrire
          </Link>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {error && (
            <div className="bg-error-container/20 border border-error/50 text-error px-md py-sm rounded-md text-body-sm">
              {error}
            </div>
          )}
          
          {/* Email Field */}
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="email">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant select-none" style={{ fontSize: '20px' }}>mail</span>
              <input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nom@exemple.com" 
                className={`w-full bg-surface-container-low border ${fieldErrors.email ? 'border-error' : 'border-surface-variant'} rounded-md pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors placeholder:text-on-surface-variant/50`}
              />
            </div>
            {fieldErrors.email && <span className="text-error text-body-sm">{fieldErrors.email}</span>}
          </div>
          
          {/* Password Field */}
          <div className="flex flex-col gap-xs">
            <div className="flex justify-between items-center">
              <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="password">Mot de passe</label>
              <Link to="/mot-de-passe-oublie" className="font-body-sm text-body-sm text-primary-container hover:text-primary-fixed transition-colors">
                Mot de passe oublié?
              </Link>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant select-none" style={{ fontSize: '20px' }}>lock</span>
              <input 
                id="password" 
                type="password" 
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
                placeholder="••••••••" 
                className={`w-full bg-surface-container-low border ${fieldErrors.motDePasse ? 'border-error' : 'border-surface-variant'} rounded-md pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors placeholder:text-on-surface-variant/50`}
              />
            </div>
            {fieldErrors.motDePasse && <span className="text-error text-body-sm">{fieldErrors.motDePasse}</span>}
          </div>
          
          {/* Primary Action */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-xs bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase py-md rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary-container/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        
        {/* Divider */}
        <div className="relative flex items-center py-lg mt-sm">
          <div className="flex-grow border-t border-surface-variant"></div>
          <span className="flex-shrink-0 mx-md font-body-sm text-body-sm text-on-surface-variant">Ou continuer vers</span>
          <div className="flex-grow border-t border-surface-variant"></div>
        </div>
        
        {/* Return Home */}
        <div className="flex justify-center">
          <Link 
            to="/"
            className="flex justify-center items-center gap-xs py-sm px-lg border border-surface-variant rounded-lg hover:bg-surface-container-high transition-colors text-on-surface group w-full"
          >
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-fixed transition-colors" style={{ fontSize: '20px' }}>home</span>
            <span className="font-label-caps text-label-caps uppercase group-hover:text-primary-fixed transition-colors">Retour à l'accueil</span>
          </Link>
        </div>
      </motion.main>
    </div>
  );
}
