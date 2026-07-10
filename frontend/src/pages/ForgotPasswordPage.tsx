import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data || 'Si un compte correspond à cet email, vous recevrez un lien de réinitialisation.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

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
            <span className="material-symbols-outlined text-3xl">mail</span>
          </div>
          <h1 className="font-h1 text-h1 text-on-surface">Mot de passe oublié</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </header>

        {error && (
          <div className="bg-error-container border border-error text-on-error-container px-md py-sm rounded-lg text-body-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-md py-sm rounded-lg text-body-sm">
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            {/* Email Input */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-bold text-on-surface" htmlFor="email">
                Adresse e-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </span>
                <input
                  id="email"
                  type="email"
                  className="w-full pl-10 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-button text-button py-3 px-4 rounded-lg flex items-center justify-center gap-sm transition-all duration-200 shadow-sm disabled:opacity-55 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  Envoi...
                </>
              ) : (
                <>
                  Envoyer le lien
                  <span className="material-symbols-outlined">send</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="text-center">
          <Link 
            to="/login" 
            className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
