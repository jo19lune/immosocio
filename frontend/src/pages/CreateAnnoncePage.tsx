import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api, { uploadImage } from '../lib/api';
import closeLineSvg from '../assets/close_line.svg';
import sendPlaneFillSvg from '../assets/send_plane_fill.svg';
import announcementLineSvg from '../assets/announcement_line.svg';
import '../styles/pages/CreateAnnoncePage.css';

export default function CreateAnnoncePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titre: '', description: '', adresse: '', ville: '', pays: 'Madagascar',
    prix: '', nombrePieces: '', superficie: '', typeLogement: 'APPARTEMENT', quantiteDisponible: '1'
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadImage(f, 'annonce')));
      setPhotos(prev => [...prev, ...urls].slice(0, 10)); // max 10 photos
    } catch {
      alert('Erreur lors de l\'upload d\'image. Vérifiez votre connexion.');
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
      await api.post('/annonces', {
        ...form,
        prix: Number(form.prix),
        nombrePieces: form.nombrePieces ? parseInt(form.nombrePieces) : null,
        superficie: form.superficie ? parseFloat(form.superficie) : null,
        quantiteDisponible: form.quantiteDisponible ? parseInt(form.quantiteDisponible) : 1,
        photos
      });
      navigate('/annonces');
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (errorData?.message || errorData?.erreur || 'Erreur lors de la création de l\'annonce.');
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="create-annonce-container">
        <div className="card create-annonce-card">
          <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={announcementLineSvg} alt="" width={24} height={24} /> Publier une annonce
          </h2>
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="create-annonce-form">
            <div className="form-group">
              <label className="form-label">Titre de l'annonce *</label>
              <input className="form-input" required minLength={5} maxLength={120} value={form.titre} onChange={set('titre')} placeholder="Ex: Bel appartement en plein centre" autoFocus />
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
              <div className="form-group">
                <label className="form-label">Quantité dispo.</label>
                <input type="number" className="form-input" min={1} value={form.quantiteDisponible} onChange={set('quantiteDisponible')} placeholder="Ex: 1" />
              </div>
            </div>

            <div className="form-group">
               <label className="form-label">Photos ({photos.length}/10)</label>
               <div className="create-annonce-photos">
                 {photos.map((url, idx) => (
                   <div key={idx} className="photo-preview">
                     <img src={url} alt="Aperçu" title="Aperçu" className="preview-img" />
                     <button type="button" className="remove-photo-btn" onClick={() => removePhoto(idx)}>
                        <img src={closeLineSvg} alt="" width={12} height={12} style={{ filter: 'brightness(0) invert(1)' }} />
                      </button>
                   </div>
                 ))}
                 {photos.length < 10 && (
                   <button type="button" className="add-photo-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                     {uploading ? <span className="spinner" style={{ width: 16, height: 16 }}/> : '+ Photo'}
                   </button>
                 )}
               </div>
               <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
            </div>

            <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/annonces')} disabled={submitting}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || uploading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {submitting ? 'Validation...' : (
                  <><img src={sendPlaneFillSvg} alt="" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} /> Publier l'annonce</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
