import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import './AuthPages.css';

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
  const [showPwd, setShowPwd] = useState(false);

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
      <div className="auth-page">
        <div className="auth-right" style={{ margin: 'auto' }}>
          <div className="auth-card card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <h2 className="auth-title">Vérifiez votre email</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{success}</p>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/login')}>
              Aller à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-icon">🏡</span>
          <span className="auth-brand-name">ImmoSocial</span>
        </div>
        <h1 className="auth-tagline">Rejoignez<br />la communauté<br /><span>immobilière</span></h1>
        <p className="auth-subtitle">
          Créez votre compte gratuitement et accédez à des milliers d'annonces, publications et opportunités.
        </p>
        <div className="role-cards">
          <div
            className={`role-card ${form.role === 'LOCATAIRE' ? 'active' : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: 'LOCATAIRE' }))}
          >
            <span>🔑</span>
            <div>
              <strong>Locataire</strong>
              <p>Je cherche un logement</p>
            </div>
          </div>
          <div
            className={`role-card ${form.role === 'PROPRIETAIRE' ? 'active' : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: 'PROPRIETAIRE' }))}
          >
            <span>🏠</span>
            <div>
              <strong>Propriétaire</strong>
              <p>Je propose un logement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <motion.div 
          className="auth-card card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="auth-title">Créer un compte</h2>
          <p className="auth-desc">Rejoignez ImmoSocial gratuitement</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input type="text" className={`form-input ${fieldErrors.prenom ? 'input-error' : ''}`} placeholder="Marie" value={form.prenom}
                  onChange={set('prenom')} required autoFocus />
                {fieldErrors.prenom && <span className="error-text">{fieldErrors.prenom}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input type="text" className={`form-input ${fieldErrors.nom ? 'input-error' : ''}`} placeholder="Dupont" value={form.nom}
                  onChange={set('nom')} required />
                {fieldErrors.nom && <span className="error-text">{fieldErrors.nom}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className={`form-input ${fieldErrors.email ? 'input-error' : ''}`} placeholder="vous@exemple.com" value={form.email}
                onChange={set('email')} required />
              {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input type="tel" className={`form-input ${fieldErrors.telephone ? 'input-error' : ''}`} placeholder="+261 32 00 000 00" value={form.telephone}
                onChange={set('telephone')} />
              {fieldErrors.telephone && <span className="error-text">{fieldErrors.telephone}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Je suis</label>
              <div className="role-toggle">
                <button type="button" className={`role-btn ${form.role === 'LOCATAIRE' ? 'active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, role: 'LOCATAIRE' }))}>
                  🔑 Locataire
                </button>
                <button type="button" className={`role-btn ${form.role === 'PROPRIETAIRE' ? 'active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, role: 'PROPRIETAIRE' }))}>
                  🏠 Propriétaire
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="password-field">
                <input type={showPwd ? 'text' : 'password'} className={`form-input ${fieldErrors.motDePasse ? 'input-error' : ''}`}
                  placeholder="Min. 8 caractères" value={form.motDePasse}
                  onChange={set('motDePasse')} required minLength={8} />
                <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.motDePasse && <span className="error-text">{fieldErrors.motDePasse}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <input type="password" className="form-input" placeholder="••••••••" value={form.confirm}
                onChange={set('confirm')} required />
            </div>

            <button type="submit" className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Créer mon compte'}
            </button>
          </form>

          <div className="auth-separator"><span>ou</span></div>

          <p className="auth-switch">
            Déjà un compte ?{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>Se connecter</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
