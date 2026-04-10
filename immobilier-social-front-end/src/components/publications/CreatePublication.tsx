import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { uploadImage } from '../../lib/api';
import './CreatePublication.css';

interface Props {
  onCreated: (pub: any) => void;
}

export default function CreatePublication({ onCreated }: Props) {
  const { user } = useAuth();
  const [contenu, setContenu] = useState('');
  const [visibilite, setVisibilite] = useState<'PUBLIC' | 'MEMBRES'>('PUBLIC');
  const [medias, setMedias] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || '') + '+' + (user?.nom || ''))}&background=3B6CF8&color=fff&bold=true`;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f, 'publication')));
      setMedias((prev) => [...prev, ...urls].slice(0, 4));
    } catch {
      alert('Erreur lors de l\'upload d\'image. Vérifiez votre connexion.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMedias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenu.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/publications', { contenu, medias, visibilite });
      onCreated(data);
      setContenu('');
      setMedias([]);
      setExpanded(false);
    } catch {
      alert('Erreur lors de la publication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-pub card">
      <div className="create-pub-header">
        <img src={avatarUrl} alt="" className="avatar" width={42} height={42} />
        <div
          className={`create-pub-trigger ${expanded ? 'hidden' : ''}`}
          onClick={() => setExpanded(true)}
        >
          Quoi de neuf, {user?.prenom} ?
        </div>
      </div>

      {expanded && (
        <form className="create-pub-form" onSubmit={handleSubmit}>
          <textarea
            className="form-input create-pub-textarea"
            placeholder={`Partagez quelque chose, ${user?.prenom}…`}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            autoFocus
            rows={4}
          />

          {/* Prévisualisation images */}
          {medias.length > 0 && (
            <div className="create-pub-previews">
              {medias.map((url, i) => (
                <div key={i} className="create-pub-preview">
                  <img src={url} alt="" />
                  <button type="button" className="remove-media-btn" onClick={() => removeMedia(i)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Barre d'outils */}
          <div className="create-pub-toolbar">
            <div className="create-pub-tools">
              <button
                type="button"
                className="tool-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || medias.length >= 4}
                title="Ajouter des photos"
              >
                {uploading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '📷'}
                <span>Photo</span>
              </button>

              <select
                className="visibilite-select"
                value={visibilite}
                onChange={(e) => setVisibilite(e.target.value as any)}
              >
                <option value="PUBLIC">🌍 Public</option>
                <option value="MEMBRES">👥 Membres</option>
              </select>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
            </div>

            <div className="create-pub-submit-row">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setExpanded(false); setContenu(''); setMedias([]); }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!contenu.trim() || submitting || uploading}
              >
                {submitting ? 'Publication…' : 'Publier'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
