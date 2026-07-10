import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

type Role = 'LOCATAIRE' | 'PROPRIETAIRE';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '',
    telephone: '', motDePasse: '', confirm: '',
    role: 'LOCATAIRE' as Role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    if (form.motDePasse !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.motDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        motDePasse: form.motDePasse,
        role: form.role,
      });
      setSuccess('Inscription réussie ! Vérifiez votre email pour activer votre compte.');
    } catch (err: any) {
      if (err.response?.data?.champs) {
        setFieldErrors(err.response.data.champs);
      } else if (err.response?.data?.erreur) {
        setError(err.response.data.erreur);
      } else {
        setError('Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-background text-on-background min-h-screen flex items-center justify-center relative overflow-hidden font-body-md antialiased">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-10" 
            alt="Luxurious modern mansion exterior at twilight with warm glowing interior lights and sleek contemporary architectural lines" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj1p2Aux8I0h90orXQtWMi6i9tOiy40EmZ_ZAV73A-QCU0vTR4aB-cfYWBrP7fyRjNrmFL_UFpKPW1ErGCqulDbh40wHjhl6MslFsJMskmUCibMJDHK66APkc1KYnnmaHgaH4W0COD8M8-hBTqY9GoBknKzbEfzYyiwkM4SUJHK1XwU5oM-sz-NQItzY4dDXj7LAJoQAA4cFN14qVzRedcYcnGXUvYNi1IVuIEgclOyTRAlv7iyNBj9wkO5WvEqRqIYFahEnbNLNa-"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 mix-blend-multiply"></div>
        </div>
        <motion.main 
          className="relative z-10 w-full max-w-[420px] mx-gutter p-lg bg-surface-container/80 backdrop-blur-2xl border border-surface-variant rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mx-auto w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mb-md text-primary-container">
            <span className="material-symbols-outlined text-[32px]">mail</span>
          </div>
          <h2 className="font-h2 text-h2 text-on-surface mb-2">Vérifiez votre email</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{success}</p>
          <button 
            className="w-full bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase py-md rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all duration-200"
            onClick={() => navigate('/login')}
          >
            Aller à la connexion
          </button>
        </motion.main>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center relative py-12 px-4 overflow-y-auto font-body-md antialiased">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0">
        <img 
          className="w-full h-full object-cover opacity-10" 
          alt="Luxurious modern mansion exterior at twilight with warm glowing interior lights and sleek contemporary architectural lines" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj1p2Aux8I0h90orXQtWMi6i9tOiy40EmZ_ZAV73A-QCU0vTR4aB-cfYWBrP7fyRjNrmFL_UFpKPW1ErGCqulDbh40wHjhl6MslFsJMskmUCibMJDHK66APkc1KYnnmaHgaH4W0COD8M8-hBTqY9GoBknKzbEfzYyiwkM4SUJHK1XwU5oM-sz-NQItzY4dDXj7LAJoQAA4cFN14qVzRedcYcnGXUvYNi1IVuIEgclOyTRAlv7iyNBj9wkO5WvEqRqIYFahEnbNLNa-"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 mix-blend-multiply"></div>
      </div>
      
      {/* Auth Card */}
      <motion.main 
        className="relative z-10 w-full max-w-[420px] p-lg bg-surface-container/80 backdrop-blur-2xl border border-surface-variant rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] my-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header */}
        <header className="text-center mb-xl">
          <h1 className="font-h2 text-h2 text-primary-container tracking-tight">ImmoSocial</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Rejoignez notre communauté</p>
        </header>
        
        {/* Tabs */}
        <div className="flex border-b border-surface-variant mb-lg">
          <Link 
            to="/login"
            className="flex-1 text-center pb-sm font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface border-b-2 border-transparent transition-colors uppercase"
          >
            Se connecter
          </Link>
          <button 
            type="button"
            className="flex-1 pb-sm font-label-caps text-label-caps text-primary-container border-b-2 border-primary-container transition-colors uppercase"
          >
            S'inscrire
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {error && (
            <div className="bg-error-container/20 border border-error/50 text-error px-md py-sm rounded-md text-body-sm">
              {error}
            </div>
          )}
          
          {/* Nom complet */}
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="fullname">Nom complet</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant select-none" style={{ fontSize: '20px' }}>person</span>
              <input 
                id="fullname"
                type="text"
                required
                placeholder="Jean Dupont"
                value={`${form.prenom} ${form.nom}`.trim()}
                onChange={(e) => {
                  const parts = e.target.value.split(' ');
                  setForm(f => ({ 
                    ...f, 
                    prenom: parts[0] || '', 
                    nom: parts.slice(1).join(' ') || ''
                  }));
                }}
                className={`w-full bg-surface-container-low border ${(fieldErrors.prenom || fieldErrors.nom) ? 'border-error' : 'border-surface-variant'} rounded-md pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors placeholder:text-on-surface-variant/50`}
              />
            </div>
            {(fieldErrors.prenom || fieldErrors.nom) && (
              <span className="text-error text-body-sm">{fieldErrors.prenom || fieldErrors.nom}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="email">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant select-none" style={{ fontSize: '20px' }}>mail</span>
              <input 
                id="email" 
                type="email" 
                value={form.email}
                onChange={set('email')}
                required
                placeholder="nom@exemple.com" 
                className={`w-full bg-surface-container-low border ${fieldErrors.email ? 'border-error' : 'border-surface-variant'} rounded-md pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors placeholder:text-on-surface-variant/50`}
              />
            </div>
            {fieldErrors.email && <span className="text-error text-body-sm">{fieldErrors.email}</span>}
          </div>

          {/* Phone Field */}
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="telephone">Téléphone (Optionnel)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant select-none" style={{ fontSize: '20px' }}>call</span>
              <input 
                id="telephone" 
                type="tel" 
                value={form.telephone}
                onChange={set('telephone')}
                placeholder="+261 34 00 000 00" 
                className={`w-full bg-surface-container-low border ${fieldErrors.telephone ? 'border-error' : 'border-surface-variant'} rounded-md pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors placeholder:text-on-surface-variant/50`}
              />
            </div>
            {fieldErrors.telephone && <span className="text-error text-body-sm">{fieldErrors.telephone}</span>}
          </div>
          
          {/* Password Field */}
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="password">Mot de passe</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant select-none" style={{ fontSize: '20px' }}>lock</span>
              <input 
                id="password" 
                type="password" 
                value={form.motDePasse}
                onChange={set('motDePasse')}
                required
                minLength={8}
                placeholder="••••••••" 
                className={`w-full bg-surface-container-low border ${fieldErrors.motDePasse ? 'border-error' : 'border-surface-variant'} rounded-md pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors placeholder:text-on-surface-variant/50`}
              />
            </div>
            {fieldErrors.motDePasse && <span className="text-error text-body-sm">{fieldErrors.motDePasse}</span>}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="confirm_password">Confirmer le mot de passe</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant select-none" style={{ fontSize: '20px' }}>lock_reset</span>
              <input 
                id="confirm_password" 
                type="password" 
                value={form.confirm}
                onChange={set('confirm')}
                required
                minLength={8}
                placeholder="••••••••" 
                className="w-full bg-surface-container-low border border-surface-variant rounded-md pl-xl pr-md py-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-xs mt-2">
            <label className="font-body-sm text-body-sm text-on-surface-variant">Je suis</label>
            <div className="grid grid-cols-2 gap-sm">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, role: 'LOCATAIRE' }))}
                className={`py-sm rounded-md border font-body-sm font-semibold transition-colors flex items-center justify-center gap-1 ${
                  form.role === 'LOCATAIRE' 
                    ? 'border-primary-container bg-primary-container/10 text-primary-fixed' 
                    : 'border-surface-variant bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                Locataire
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, role: 'PROPRIETAIRE' }))}
                className={`py-sm rounded-md border font-body-sm font-semibold transition-colors flex items-center justify-center gap-1 ${
                  form.role === 'PROPRIETAIRE' 
                    ? 'border-primary-container bg-primary-container/10 text-primary-fixed' 
                    : 'border-surface-variant bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
                Propriétaire
              </button>
            </div>
          </div>
          
          {/* Primary Action */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-sm bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase py-md rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary-container/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        
        {/* Divider */}
        <div className="relative flex items-center py-lg mt-xs">
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
