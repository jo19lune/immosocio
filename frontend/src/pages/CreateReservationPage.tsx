import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import './CreateAnnoncePage.css';

export default function CreateReservationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const annonceId = searchParams.get('annonceId');

  const [annonce, setAnnonce] = useState<any>(null);
  const [form, setForm] = useState({
    dateDebut: '',
    dateFin: '',
    quantite: 1,
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!annonceId) {
      navigate('/annonces');
      return;
    }
    const fetchAnnonce = async () => {
      try {
        const { data } = await api.get(`/annonces/${annonceId}`);
        setAnnonce(data);
      } catch {
        setError("Annonce introuvable");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnonce();
  }, [annonceId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.quantite > annonce.quantiteDisponible) {
       setError(`Vous ne pouvez pas réserver plus de ${annonce.quantiteDisponible} unité(s).`);
       return;
    }
    setSubmitting(true);
    try {
      await api.post('/reservations', {
        annonceId: annonce.id,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        quantite: form.quantite,
        message: form.message
      });
      alert("Réservation effectuée avec succès !");
      navigate('/annonces');
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (errorData?.message || errorData?.erreur || 'Erreur lors de la réservation.');
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const prixTotal = annonce ? annonce.prix * form.quantite : 0;

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
      </AppLayout>
    );
  }

  if (!annonce) {
    return (
      <AppLayout>
        <div className="auth-error" style={{ margin: '24px auto', maxWidth: 600 }}>{error}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="create-annonce-container">
        <div className="card create-annonce-card">
          <h2 style={{ marginBottom: '24px' }}>Réserver : {annonce.titre}</h2>
          {error && <div className="auth-error">{error}</div>}
          
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--surface-50)', borderRadius: '8px' }}>
            <p><strong>Prix unitaire :</strong> {Number(annonce.prix).toLocaleString('fr-FR')} Ar</p>
            <p><strong>Disponibilité :</strong> {annonce.quantiteDisponible} unité(s)</p>
          </div>

          <form onSubmit={handleSubmit} className="create-annonce-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date de début *</label>
                <input type="date" required className="form-input" 
                  value={form.dateDebut} onChange={e => setForm({...form, dateDebut: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Date de fin *</label>
                <input type="date" required className="form-input" 
                  value={form.dateFin} onChange={e => setForm({...form, dateFin: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quantité (Nb. pièces/maisons) *</label>
              <input type="number" required className="form-input" min={1} max={annonce.quantiteDisponible}
                value={form.quantite} onChange={e => setForm({...form, quantite: parseInt(e.target.value) || 1})} />
            </div>

            <div className="form-group">
              <label className="form-label">Message au propriétaire (optionnel)</label>
              <textarea className="form-input" rows={3} maxLength={500}
                value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Dites bonjour..." />
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'right' }}>
              Total à payer : {prixTotal.toLocaleString('fr-FR')} Ar
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/annonces')} disabled={submitting}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Validation...' : 'Confirmer la réservation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
