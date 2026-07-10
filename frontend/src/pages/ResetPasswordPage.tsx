import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-gutter md:p-xl">
        <motion.div 
          className="w-full max-w-container-max bg-surface-container-lowest rounded-xl shadow-md p-lg md:p-xl flex flex-col gap-lg border border-outline-variant/30 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto w-12 h-12 bg-error-container rounded-full flex items-center justify-center mb-xs text-error">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h2 className="font-h1 text-h1 text-on-surface">Lien invalide</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Aucun token de réinitialisation fourni.</p>
          <Link 
            to="/mot-de-passe-oublie" 
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-button text-button py-3 px-4 rounded-lg inline-flex items-center justify-center gap-sm transition-all duration-200 shadow-sm"
          >
            Demander un nouveau lien
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (nouveauMotDePasse !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (nouveauMotDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        nouveauMotDePasse
      });
      setSuccess('Mot de passe réinitialisé avec succès.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Token invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-gutter md:p-xl">
        <motion.div 
          className="w-full max-w-container-max bg-surface-container-lowest rounded-xl shadow-md p-lg md:p-xl flex flex-col gap-lg border border-outline-variant/30 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-xs text-green-600">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-h1 text-h1 text-on-surface">Réinitialisation réussie</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{success}</p>
          <button 
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-button text-button py-3 px-4 rounded-lg flex items-center justify-center gap-sm transition-all duration-200 shadow-sm"
            onClick={() => navigate('/login')}
          >
            Aller à la connexion
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-gutter md:p-xl relative overflow-hidden">
      {/* Ambient Background Element */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10"></div>

      <motion.div 
        className="w-full max-w-container-max bg-surface-container-lowest rounded-xl shadow-md p-lg md:p-xl flex flex-col gap-lg border border-outline-variant/30"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header Section */}
        <header className="text-center flex flex-col gap-sm items-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-xs text-primary">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="font-h1 text-h1 text-on-surface">Nouveau mot de passe</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Choisissez un nouveau mot de passe sécurisé.</p>
        </header>

        {error && (
          <div className="bg-error-container border border-error text-on-error-container px-md py-sm rounded-lg text-body-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {/* New Password Input */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="password">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined text-xl">lock</span>
              </span>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="w-full pl-10 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                placeholder="Min. 8 caractères"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                minLength={8}
                required
                autoFocus
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant transition-colors"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPwd ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="confirm">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined text-xl">lock_reset</span>
              </span>
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                className="w-full pl-10 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant transition-colors"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showConfirm ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-button text-button py-3 px-4 rounded-lg flex items-center justify-center gap-sm transition-all duration-200 shadow-sm disabled:opacity-55 disabled:cursor-not-allowed mt-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                Réinitialisation...
              </>
            ) : (
              <>
                Réinitialiser
                <span className="material-symbols-outlined">check</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
