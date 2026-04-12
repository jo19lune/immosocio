import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import './AuthPages.css';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Aucun token de vérification fourni.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email?token=${token}`);
        setSuccess(data || 'Email vérifié avec succès.');
      } catch (err: any) {
        setError(err.response?.data?.message || err.response?.data || 'Token invalide ou expiré.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-right" style={{ margin: 'auto' }}>
        <div className="auth-card card" style={{ textAlign: 'center' }}>
          {loading ? (
            <>
              <div className="spinner" style={{ margin: '0 auto 24px', width: 48, height: 48, borderTopColor: 'var(--primary)' }} />
              <h2 className="auth-title">Vérification en cours...</h2>
              <p className="auth-desc">Veuillez patienter pendant la vérification de votre email.</p>
            </>
          ) : error ? (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
              <h2 className="auth-title">Erreur de vérification</h2>
              <p className="auth-error" style={{ marginBottom: 24, textAlign: 'center' }}>{error}</p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>Retour à la connexion</Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 className="auth-title">Email vérifié !</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{success}</p>
              <button 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/login')}
              >
                Aller à la connexion
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
