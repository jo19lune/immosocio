import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api, { uploadImage } from '../lib/api';

const INPUT_CLASS =
  'w-full bg-surface-container border border-surface-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim transition-all placeholder:text-on-surface-variant/50';
const LABEL_CLASS = 'block text-sm font-semibold text-on-surface-variant mb-2';

export default function CreateAnnoncePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titre: '',
    description: '',
    adresse: '',
    ville: '',
    pays: 'Madagascar',
    prix: '',
    nombrePieces: '',
    superficie: '',
    typeLogement: 'APPARTEMENT',
    quantiteDisponible: '1',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f, 'annonce')));
      setPhotos((prev) => [...prev, ...urls].slice(0, 10));
    } catch {
      alert("Erreur lors de l'upload d'image. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => setPhotos((p) => p.filter((_, i) => i !== index));

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
        photos,
      });
      navigate('/annonces');
    } catch (err: any) {
      const d = err.response?.data;
      setError(typeof d === 'string' ? d : d?.message || d?.erreur || "Erreur lors de la création de l'annonce.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Publier une annonce</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Remplissez les informations pour mettre votre bien en ligne.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-error/20 border border-error text-error px-4 py-3 rounded-xl mb-6">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations principales */}
          <div className="bg-surface-container-low border border-surface-variant rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-variant bg-surface-container/50">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">home</span>
              <h2 className="font-bold text-[16px] text-on-surface">Informations du bien</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={LABEL_CLASS}>Titre de l'annonce *</label>
                <input
                  className={INPUT_CLASS}
                  required
                  minLength={5}
                  maxLength={120}
                  value={form.titre}
                  onChange={set('titre')}
                  placeholder="Ex: Bel appartement en plein centre"
                  autoFocus
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Description</label>
                <textarea
                  className={INPUT_CLASS}
                  rows={5}
                  maxLength={2000}
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Détails du logement, commodités, proximité..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL_CLASS}>Type de logement</label>
                  <select className={INPUT_CLASS} value={form.typeLogement} onChange={set('typeLogement')}>
                    <option value="APPARTEMENT">Appartement</option>
                    <option value="MAISON">Maison</option>
                    <option value="STUDIO">Studio</option>
                    <option value="VILLA">Villa</option>
                    <option value="CHAMBRE">Chambre</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Quantité disponible</label>
                  <input
                    type="number"
                    className={INPUT_CLASS}
                    min={1}
                    value={form.quantiteDisponible}
                    onChange={set('quantiteDisponible')}
                    placeholder="Ex: 1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Localisation */}
          <div className="bg-surface-container-low border border-surface-variant rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-variant bg-surface-container/50">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">location_on</span>
              <h2 className="font-bold text-[16px] text-on-surface">Localisation</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={LABEL_CLASS}>Adresse *</label>
                <input
                  className={INPUT_CLASS}
                  required
                  value={form.adresse}
                  onChange={set('adresse')}
                  placeholder="Adresse précise"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL_CLASS}>Ville *</label>
                  <input
                    className={INPUT_CLASS}
                    required
                    value={form.ville}
                    onChange={set('ville')}
                    placeholder="Ex: Antananarivo"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Pays</label>
                  <input
                    className={INPUT_CLASS}
                    value={form.pays}
                    onChange={set('pays')}
                    placeholder="Ex: Madagascar"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Prix & Caractéristiques */}
          <div className="bg-surface-container-low border border-surface-variant rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-variant bg-surface-container/50">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">payments</span>
              <h2 className="font-bold text-[16px] text-on-surface">Prix & Caractéristiques</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={LABEL_CLASS}>Prix (Ar) *</label>
                  <input
                    type="number"
                    className={INPUT_CLASS}
                    required
                    min={0.01}
                    step="0.01"
                    value={form.prix}
                    onChange={set('prix')}
                    placeholder="Ex: 500000"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Nb. de pièces</label>
                  <input
                    type="number"
                    className={INPUT_CLASS}
                    min={1}
                    value={form.nombrePieces}
                    onChange={set('nombrePieces')}
                    placeholder="Ex: 2"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Superficie (m²)</label>
                  <input
                    type="number"
                    className={INPUT_CLASS}
                    min={1}
                    step="0.1"
                    value={form.superficie}
                    onChange={set('superficie')}
                    placeholder="Ex: 50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Photos */}
          <div className="bg-surface-container-low border border-surface-variant rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-variant bg-surface-container/50">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">photo_library</span>
              <h2 className="font-bold text-[16px] text-on-surface">Photos</h2>
              <span className="ml-auto font-label-caps text-label-caps text-on-surface-variant">{photos.length}/10</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-surface-variant">
                    <img src={url} alt="Aperçu" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 bg-primary-fixed-dim text-black font-label-caps text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                        Principale
                      </span>
                    )}
                  </div>
                ))}

                {photos.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-surface-variant hover:border-primary-fixed-dim text-on-surface-variant hover:text-primary-fixed-dim transition-all flex flex-col items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-on-surface-variant border-t-primary-fixed-dim rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
                        <span className="text-xs font-medium">Ajouter</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-on-surface-variant mt-3">
                Formats acceptés : JPG, PNG, WebP. Max 10 Mo par photo. La première photo sera la photo principale.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <button
              type="button"
              onClick={() => navigate('/annonces')}
              disabled={submitting}
              className="px-6 py-3 rounded-xl border border-surface-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex items-center gap-2 bg-primary-fixed-dim text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-primary-fixed-dim/20"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">send</span>
              )}
              {submitting ? 'Publication...' : "Publier l'annonce"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
