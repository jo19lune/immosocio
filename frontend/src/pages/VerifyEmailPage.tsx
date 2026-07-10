import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

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
        // Add a small delay for better UX
        setTimeout(() => {
          setSuccess(data || 'Email vérifié avec succès.');
          setLoading(false);
        }, 1500);
      } catch (err: any) {
        setTimeout(() => {
          setError(err.response?.data?.message || err.response?.data || 'Token invalide ou expiré.');
          setLoading(false);
        }, 1500);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-gutter md:p-xl">
      <motion.div 
        className="w-full max-w-container-max bg-surface-container-lowest rounded-xl shadow-md p-lg md:p-xl flex flex-col gap-lg border border-outline-variant/30 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-xs text-primary animate-pulse">
              <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
            </div>
            <h2 className="font-h1 text-h1 text-on-surface">Vérification en cours...</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Veuillez patienter pendant la vérification de votre email.
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
          >
            <div className="mx-auto w-12 h-12 bg-error-container rounded-full flex items-center justify-center mb-xs text-error">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="font-h1 text-h1 text-on-surface">Erreur de vérification</h2>
            <p className="font-body-md text-body-md text-error-container bg-error-container/20 px-md py-sm rounded-lg mb-lg mt-sm">
              {error}
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center gap-sm bg-primary hover:bg-primary-container text-on-primary font-button text-button py-3 px-4 rounded-lg transition-all duration-200 shadow-sm"
            >
              Retour à la connexion
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-xs text-green-600">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="font-h1 text-h1 text-on-surface">Email vérifié !</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              {success}
            </p>
            <button 
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-button text-button py-3 px-4 rounded-lg flex items-center justify-center gap-sm transition-all duration-200 shadow-sm"
              onClick={() => navigate('/login')}
            >
              Aller à la connexion
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
