import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import api, { uploadImage } from '../lib/api';
import { applyTheme } from '../lib/theme';
import './NotificationsSettings.css';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [params, setParams] = useState({
    theme: 'SYSTEME',
    visibiliteParDefaut: 'PUBLIC',
    notificationsEmail: true,
    notificationsPush: true,
  });
  const [profile, setProfile] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    telephone: user?.telephone || '',
  });
  const [loadingParams, setLoadingParams] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState('');
  const [pwdForm, setPwdForm] = useState({ ancien: '', nouveau: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.prenom || '') + '+' + (user?.nom || ''))}&background=3B6CF8&color=fff&bold=true&size=80`;

  useEffect(() => {
    api.get('/parametres').then(({ data }) => {
      setParams({
        theme: data.theme || 'SYSTEME',
        visibiliteParDefaut: data.visibiliteParDefaut || 'PUBLIC',
        notificationsEmail: data.notificationsEmail ?? true,
        notificationsPush: data.notificationsPush ?? true,
      });
      // Appliquer le thème sauvegardé au chargement
      applyTheme(data.theme || 'SYSTEME');
    }).catch(() => {});
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // ── Sauvegarder les paramètres ──────────────────────────────────────────
  const saveParams = async () => {
    setLoadingParams(true);
    try {
      await api.put('/parametres', params);
      applyTheme(params.theme);
      showSuccess('Préférences enregistrées !');
    } catch { /* silencieux */ }
    finally { setLoadingParams(false); }
  };

  // ── Sauvegarder le profil (nom / prénom / téléphone) ────────────────────
  const saveProfile = async () => {
    if (!profile.prenom.trim() || !profile.nom.trim()) {
      showSuccess('Le prénom et le nom ne peuvent pas être vides.');
      return;
    }
    setLoadingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', {
        nom: profile.nom.trim(),
        prenom: profile.prenom.trim(),
        telephone: profile.telephone.trim() || null,
      });
      // Mettre à jour le contexte d'authentification (nom, prénom, tél, photo)
      updateUser({ 
        nom: data.nom, 
        prenom: data.prenom, 
        telephone: data.telephone, 
        photo: data.photo 
      });
      showSuccess('Profil mis à jour !');
    } catch {
      showSuccess('Erreur lors de la mise à jour du profil.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // ── Upload avatar ────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, 'profil');
      updateUser({ photo: url });
      showSuccess('Photo de profil mise à jour !');
    } catch {
      alert('Erreur lors de l\'upload de la photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Changer mot de passe ─────────────────────────────────────────────────
  const handlePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.nouveau !== pwdForm.confirm) {
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (pwdForm.nouveau.length < 8) {
      setPwdError('Min. 8 caractères.');
      return;
    }
    try {
      await api.post('/auth/change-password', {
        ancienMotDePasse: pwdForm.ancien,
        nouveauMotDePasse: pwdForm.nouveau,
      });
      setPwdSuccess('Mot de passe modifié avec succès !');
      setPwdForm({ ancien: '', nouveau: '', confirm: '' });
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch (err: any) {
      setPwdError(err.response?.data?.message || err.response?.data || 'Erreur lors du changement de mot de passe.');
    }
  };

  return (
    <AppLayout>
      <div className="settings-page">
        <h1 className="settings-title">Paramètres</h1>

        {success && <div className="settings-success">✓ {success}</div>}

        {/* ── Profil ──────────────────────────────────────────────────────── */}
        <div className="settings-section">
          <div className="settings-section-title">Mon profil</div>
          <div className="profile-section" style={{ border: 'none', borderRadius: 0, marginBottom: 0 }}>
            <div className="profile-avatar-edit">
              <div className="avatar-overlay" onClick={() => avatarRef.current?.click()}>
                <img src={avatarUrl} alt="" className="avatar" width={72} height={72} />
                <div className="avatar-overlay-icon">
                  {uploadingAvatar ? <span className="spinner" /> : '📷'}
                </div>
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>{user?.prenom} {user?.nom}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Cliquez sur la photo pour la modifier
                </p>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={handleAvatarChange} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input className="form-input" value={profile.prenom}
                  onChange={(e) => setProfile(p => ({ ...p, prenom: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" value={profile.nom}
                  onChange={(e) => setProfile(p => ({ ...p, nom: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                <label className="form-label">Téléphone</label>
                <input className="form-input" placeholder="+261 XX XXX XX" value={profile.telephone}
                  onChange={(e) => setProfile(p => ({ ...p, telephone: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="settings-save-row">
            <button className="btn btn-primary" onClick={saveProfile} disabled={loadingProfile}>
              {loadingProfile ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '👤 Sauvegarder le profil'}
            </button>
          </div>
        </div>

        {/* ── Préférences ─────────────────────────────────────────────────── */}
        <div className="settings-section">
          <div className="settings-section-title">Préférences</div>

          <div className="settings-row">
            <div>
              <div className="settings-row-label">Thème</div>
              <div className="settings-row-desc">Apparence de l'interface</div>
            </div>
            <select className="settings-select" value={params.theme}
              onChange={(e) => {
                const t = e.target.value;
                setParams(p => ({ ...p, theme: t }));
                applyTheme(t); // Aperçu instantané
              }}>
              <option value="CLAIR">☀️ Clair</option>
              <option value="SOMBRE">🌙 Sombre</option>
              <option value="SYSTEME">🖥️ Système</option>
            </select>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-row-label">Visibilité par défaut</div>
              <div className="settings-row-desc">Qui voit vos nouvelles publications</div>
            </div>
            <select className="settings-select" value={params.visibiliteParDefaut}
              onChange={(e) => setParams(p => ({ ...p, visibiliteParDefaut: e.target.value }))}>
              <option value="PUBLIC">🌍 Public</option>
              <option value="MEMBRES">👥 Membres</option>
            </select>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-row-label">Notifications par email</div>
              <div className="settings-row-desc">Recevez des emails pour les activités importantes</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={params.notificationsEmail}
                onChange={(e) => setParams(p => ({ ...p, notificationsEmail: e.target.checked }))} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-row-label">Notifications push</div>
              <div className="settings-row-desc">Alertes en temps réel dans l'application</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={params.notificationsPush}
                onChange={(e) => setParams(p => ({ ...p, notificationsPush: e.target.checked }))} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-save-row">
            <button className="btn btn-primary" onClick={saveParams} disabled={loadingParams}>
              {loadingParams ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '💾 Enregistrer les préférences'}
            </button>
          </div>
        </div>

        {/* ── Sécurité ─────────────────────────────────────────────────────── */}
        <div className="settings-section">
          <div className="settings-section-title">Sécurité</div>
          <form onSubmit={handlePwdSubmit}>
            <div style={{ padding: '16px 20px' }}>
              {pwdError && <div className="auth-error" style={{ marginBottom: 16 }}>{pwdError}</div>}
              {pwdSuccess && <div className="settings-success">{pwdSuccess}</div>}

              <div className="form-group">
                <label className="form-label">Mot de passe actuel</label>
                <input type="password" className="form-input" placeholder="••••••••"
                  value={pwdForm.ancien} onChange={(e) => setPwdForm(p => ({ ...p, ancien: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <input type="password" className="form-input" placeholder="Min. 8 caractères"
                  value={pwdForm.nouveau} onChange={(e) => setPwdForm(p => ({ ...p, nouveau: e.target.value }))} required minLength={8} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirmer le nouveau mot de passe</label>
                <input type="password" className="form-input" placeholder="••••••••"
                  value={pwdForm.confirm} onChange={(e) => setPwdForm(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
            </div>
            <div className="settings-save-row">
              <button type="submit" className="btn btn-primary">Changer le mot de passe</button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
