import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import './AuthPages.css';

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
    <div className="auth-page">
      <div className="auth-right" style={{ margin: 'auto' }}>
        <div className="auth-card card">
          <h2 className="auth-title">Mot de passe oublié</h2>
          <p className="auth-desc">Entrez votre email pour recevoir un lien de réinitialisation</p>

          {error && <div className="auth-error">{error}</div>}
          {success && <div style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Envoyer le lien'}
              </button>
            </form>
          )}

          <p className="auth-switch" style={{ marginTop: 24 }}>
            <Link to="/login" style={{ fontWeight: 600 }}>← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
