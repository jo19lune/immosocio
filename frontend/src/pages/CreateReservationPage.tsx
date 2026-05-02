import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBan,
  faHouse,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import '../styles/pages/CreateReservationPage.css';

interface Annonce {
  id: number;
  titre: string;
  prix: number;
  quantiteDisponible: number;
  statut: string;
}

export default function CreateReservationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const annonceId = searchParams.get('annonceId');

  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [form, setForm] = useState({
    dateDebut: '',
    dateFin: '',
    quantite: 1,
    message: '',
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
        setError('Annonce introuvable');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnonce();
  }, [annonceId, navigate]);

  const isReservable = Boolean(
    annonce && annonce.statut === 'DISPONIBLE' && annonce.quantiteDisponible > 0
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!annonce || !isReservable) {
      setError("Cette annonce n'est pas disponible a la reservation.");
      return;
    }
    if (form.quantite < 1) {
      setError('La quantite minimale a reserver est de 1.');
      return;
    }
    if (form.quantite > annonce.quantiteDisponible) {
      setError(`Vous ne pouvez pas reserver plus de ${annonce.quantiteDisponible} unite(s).`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reservations', {
        annonceId: annonce.id,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        quantite: form.quantite,
        message: form.message,
      });
      alert('Reservation effectuee avec succes.');
      navigate('/annonces');
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage =
        typeof errorData === 'string'
          ? errorData
          : errorData?.message || errorData?.erreur || 'Erreur lors de la reservation.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const prixTotal = annonce ? annonce.prix * form.quantite : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="reservation-loading">
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }

  if (!annonce) {
    return (
      <AppLayout>
        <div className="reservation-error auth-error">{error}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="reservation-page">
        <div className="card reservation-card">
          <div className="reservation-title-row">
            <div>
              <h2>
                <FontAwesomeIcon icon={faHouse} />
                Reserver : {annonce.titre}
              </h2>
              <p>Completez votre demande sans recharger la page.</p>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {!isReservable && (
            <div className="reservation-warning">
              <FontAwesomeIcon icon={faBan} />
              <div>
                <strong>Reservation indisponible</strong>
                <p>
                  Cette annonce est actuellement suspendue ou n'a plus de disponibilite.
                </p>
              </div>
            </div>
          )}

          <div className="reservation-summary">
            <p>
              <strong>Prix unitaire :</strong> {Number(annonce.prix).toLocaleString('fr-FR')} Ar
            </p>
            <p>
              <strong>Disponibilite :</strong> {annonce.quantiteDisponible} unite(s)
            </p>
            <p>
              <strong>Statut :</strong> {annonce.statut}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="create-annonce-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date de debut *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  disabled={!isReservable || submitting}
                  value={form.dateDebut}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, dateDebut: event.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date de fin *</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  disabled={!isReservable || submitting}
                  value={form.dateFin}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, dateFin: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quantite (Nb. pieces/maisons) *</label>
              <input
                type="number"
                required
                min={1}
                max={annonce.quantiteDisponible}
                className="form-input"
                disabled={!isReservable || submitting}
                value={form.quantite}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    quantite: parseInt(event.target.value, 10) || 1,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message au proprietaire (optionnel)</label>
              <textarea
                className="form-input"
                rows={3}
                maxLength={500}
                disabled={!isReservable || submitting}
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                placeholder="Dites bonjour..."
              />
            </div>

            <div className="reservation-total">
              <span>
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Total a payer
              </span>
              <strong>{prixTotal.toLocaleString('fr-FR')} Ar</strong>
            </div>

            <div className="form-actions reservation-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate('/annonces')}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isReservable || submitting}
              >
                {submitting ? 'Validation...' : 'Confirmer la reservation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
