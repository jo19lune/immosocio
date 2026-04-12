import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api, { uploadImage } from '../lib/api';
import './CreateAnnoncePage.css';

export default function EditAnnoncePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titre: '', description: '', adresse: '', ville: '', pays: 'Madagascar',
    prix: '', nombrePieces: '', superficie: '', typeLogement: 'APPARTEMENT'
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAnnonce, setLoadingAnnonce] = useState(true);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAnnonce = async () => {
      try {
        const { data } = await api.get(`/annonces/${id}`);
        setForm({
          titre: data.titre || '',
          description: data.description || '',
          adresse: data.adresse || '',
          ville: data.ville || '',
          pays: data.pays || 'Madagascar',
          prix: data.prix != null ? String(data.prix) : '',
          nombrePieces: data.nombrePieces != null ? String(data.nombrePieces) : '',
          superficie: data.superficie != null ? String(data.superficie) : '',
          typeLogement: data.typeLogement || 'APPARTEMENT',
        });
        setPhotos(data.photos || []);
      } catch {
        setError('Annonce introuvable ou accès refusé.');
      } finally {
        setLoadingAnnonce(false);
      }
    };
    fetchAnnonce();
  }, [id]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadImage(f, 'annonce')));
      setPhotos(prev => [...prev, ...urls].slice(0, 10));
    } catch {
      alert('Erreur lors de l\'upload d\'image.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => setPhotos(p => p.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/annonces/${id}`, {
        ...form,
        prix: Number(form.prix),
        nombrePieces: form.nombrePieces ? parseInt(form.nombrePieces) : null,
        superficie: form.superficie ? parseFloat(form.superficie) : null,
        photos,
      });
      navigate('/mes-annonces');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Erreur lors de la modification.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAnnonce) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="create-annonce-container">
        <div className="card create-annonce-card">
          <h2 style={{ marginBottom: '24px' }}>✏️ Modifier l'annonce</h2>
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="create-annonce-form">
            <div className="form-group">
              <label className="form-label">Titre de l'annonce *</label>
              <input className="form-input" required minLength={5} maxLength={120} value={form.titre} onChange={set('titre')} placeholder="Ex: Bel appartement en plein centre" />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={5} maxLength={2000} value={form.description} onChange={set('description')} placeholder="Détails du logement, commodités, proximité..." />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Adresse *</label>
                <input className="form-input" required value={form.adresse} onChange={set('adresse')} placeholder="Adresse précise" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Type de logement</label>
                <select className="form-input" value={form.typeLogement} onChange={set('typeLogement')}>
                  <option value="APPARTEMENT">Appartement</option>
                  <option value="MAISON">Maison</option>
                  <option value="STUDIO">Studio</option>
                  <option value="VILLA">Villa</option>
                  <option value="CHAMBRE">Chambre</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ville *</label>
                <input className="form-input" required value={form.ville} onChange={set('ville')} placeholder="Ex: Antananarivo" />
              </div>
              <div className="form-group">
                <label className="form-label">Pays</label>
                <input className="form-input" value={form.pays} onChange={set('pays')} placeholder="Ex: Madagascar" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prix mensuel ou de vente (Ar) *</label>
                <input type="number" className="form-input" required min={0.01} step="0.01" value={form.prix} onChange={set('prix')} placeholder="Ex: 500000" />
              </div>
              <div className="form-group">
                <label className="form-label">Nb. de pièces</label>
                <input type="number" className="form-input" min={1} value={form.nombrePieces} onChange={set('nombrePieces')} placeholder="Ex: 2" />
              </div>
              <div className="form-group">
                <label className="form-label">Superficie (m²)</label>
                <input type="number" className="form-input" min={1} step="0.1" value={form.superficie} onChange={set('superficie')} placeholder="Ex: 50" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Photos ({photos.length}/10)</label>
              <div className="create-annonce-photos">
                {photos.map((url, idx) => (
                  <div key={idx} className="photo-preview">
                    <img src={url} alt="Aperçu" className="preview-img" />
                    <button type="button" className="remove-photo-btn" onClick={() => removePhoto(idx)}>✕</button>
                  </div>
                ))}
                {photos.length < 10 && (
                  <button type="button" className="add-photo-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '+ Photo'}
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
            </div>

            <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/mes-annonces')} disabled={submitting}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
                {submitting ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
