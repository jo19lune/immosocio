import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import './AuthPages.css';

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

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-right" style={{ margin: 'auto' }}>
          <div className="auth-card card" style={{ textAlign: 'center' }}>
            <h2 className="auth-title">Lien invalide</h2>
            <p className="auth-desc">Aucun token de réinitialisation fourni.</p>
            <Link to="/mot-de-passe-oublie" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Demander un nouveau lien</Link>
          </div>
        </div>
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
      <div className="auth-page">
        <div className="auth-right" style={{ margin: 'auto' }}>
          <div className="auth-card card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 className="auth-title">Lien vérifié</h2>
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
      <div className="auth-right" style={{ margin: 'auto' }}>
        <div className="auth-card card">
          <h2 className="auth-title">Nouveau mot de passe</h2>
          <p className="auth-desc">Choisissez un nouveau mot de passe sécurisé.</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <div className="password-field">
                <input type={showPwd ? 'text' : 'password'} className="form-input"
                  placeholder="Min. 8 caractères" value={nouveauMotDePasse}
                  onChange={(e) => setNouveauMotDePasse(e.target.value)} required minLength={8} autoFocus />
                <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <input type="password" className="form-input" placeholder="••••••••" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Réinitialiser'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
