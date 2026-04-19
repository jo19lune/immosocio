import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import './AuthPages.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showPwd, setShowPwd] = useState(false);

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
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <Logo size={36} showText={false} />
          <span className="auth-brand-name">ImmoSocial</span>
        </div>
        <h1 className="auth-tagline">La plateforme<br />immobilière<br /><span>qui vous connecte</span></h1>
        <p className="auth-subtitle">
          Annonces, publications, messagerie — tout pour trouver et partager votre logement idéal.
        </p>
        <div className="auth-stats">
          <div className="auth-stat">
            <strong>2 000+</strong>
            <span>Annonces actives</span>
          </div>
          <div className="auth-stat">
            <strong>5 000+</strong>
            <span>Membres inscrits</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <motion.div 
          className="auth-card card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="auth-title">Connexion</h2>
          <p className="auth-desc">Accédez à votre espace personnel</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="password-field">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`form-input ${fieldErrors.motDePasse ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.motDePasse && <span className="error-text">{fieldErrors.motDePasse}</span>}
            </div>

            <div className="auth-forgot">
              <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Se connecter'}
            </button>
          </form>

          <div className="auth-separator"><span>ou</span></div>

          <p className="auth-switch">
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Créer un compte
            </Link>
          </p>

          <p className="auth-public-link">
            <Link to="/">← Continuer sans compte</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
