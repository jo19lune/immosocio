import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import api, { uploadImage } from '../lib/api';
import { applyTheme } from '../lib/theme';
import { Settings, Camera, Save, Shield, Lock, CheckCircle2, User } from 'lucide-react';

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

  const avatarUrl =
    user?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      (user?.prenom || '') + '+' + (user?.nom || '')
    )}&background=4F46E5&color=fff&bold=true&size=80`;

  useEffect(() => {
    api
      .get('/parametres')
      .then(({ data }) => {
        setParams({
          theme: data.theme || 'SYSTEME',
          visibiliteParDefaut: data.visibiliteParDefaut || 'PUBLIC',
          notificationsEmail: data.notificationsEmail ?? true,
          notificationsPush: data.notificationsPush ?? true,
        });
        applyTheme(data.theme || 'SYSTEME');
      })
      .catch(() => {});
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const saveParams = async () => {
    setLoadingParams(true);
    try {
      await api.put('/parametres', params);
      applyTheme(params.theme);
      showSuccess('Préférences enregistrées !');
    } catch {
      /* silencieux */
    } finally {
      setLoadingParams(false);
    }
  };

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
      updateUser({
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        photo: data.photo,
      });
      showSuccess('Profil mis à jour !');
    } catch {
      showSuccess('Erreur lors de la mise à jour du profil.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file, 'profil');
      updateUser({ photo: url });
      showSuccess('Photo de profil mise à jour !');
    } catch {
      alert("Erreur lors de l'upload de la photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

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
      setPwdError(
        err.response?.data?.message ||
          err.response?.data ||
          'Erreur lors du changement de mot de passe.'
      );
    }
  };

  const SectionCard = ({
    title,
    icon,
    children,
    footer,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) => (
    <div className="card overflow-hidden mb-6 flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline bg-surface-variant/30">
        <div className="text-primary">{icon}</div>
        <h2 className="text-lg font-bold text-on-surface">{title}</h2>
      </div>
      <div className="p-6 flex-1">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-outline bg-surface-variant/20 flex justify-end">
          {footer}
        </div>
      )}
    </div>
  );

  const SaveButton = ({
    onClick,
    loading,
    label,
  }: {
    onClick?: () => void;
    loading: boolean;
    label: string;
  }) => (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={loading}
      className="btn btn-primary flex items-center gap-2"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Save size={18} />
      )}
      {label}
    </button>
  );

  const ToggleSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
    </label>
  );

  return (
    <AppLayout>
      <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-on-surface mb-2">Paramètres</h1>
        <p className="text-on-surface-variant mb-8">
          Gérez votre profil, vos préférences et votre sécurité.
        </p>

        {/* Success Toast */}
        {success && (
          <div className="flex items-center gap-3 bg-success/10 border border-success/30 text-success px-4 py-3 rounded-xl mb-6 font-medium">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        {/* ── Profil ── */}
        <SectionCard
          title="Mon profil"
          icon={<User size={20} />}
          footer={
            <SaveButton onClick={saveProfile} loading={loadingProfile} label="Sauvegarder" />
          }
        >
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div
              className="relative group cursor-pointer"
              onClick={() => avatarRef.current?.click()}
            >
              <img
                src={avatarUrl}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-outline group-hover:border-primary transition-colors"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </div>
            </div>
            <div>
              <p className="font-bold text-on-surface text-lg">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-sm text-on-surface-variant mt-1">
                Cliquez sur la photo pour la modifier
              </p>
            </div>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Prénom</label>
              <input
                className="form-input"
                value={profile.prenom}
                onChange={(e) => setProfile((p) => ({ ...p, prenom: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Nom</label>
              <input
                className="form-input"
                value={profile.nom}
                onChange={(e) => setProfile((p) => ({ ...p, nom: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-on-surface mb-1.5">Téléphone</label>
              <input
                className="form-input"
                placeholder="+261 XX XXX XX"
                value={profile.telephone}
                onChange={(e) => setProfile((p) => ({ ...p, telephone: e.target.value }))}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Préférences ── */}
        <SectionCard
          title="Préférences"
          icon={<Settings size={20} />}
          footer={
            <SaveButton onClick={saveParams} loading={loadingParams} label="Enregistrer" />
          }
        >
          {/* Theme Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-outline mb-6 gap-4">
            <div>
              <div className="font-semibold text-on-surface">Thème</div>
              <div className="text-sm text-on-surface-variant mt-0.5">
                Apparence de l'interface
              </div>
            </div>
            <div className="flex gap-2 p-1 rounded-xl border border-outline bg-surface-variant/30">
              {[
                { key: 'CLAIR', label: 'Clair' },
                { key: 'SOMBRE', label: 'Sombre' },
                { key: 'SYSTEME', label: 'Système' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    params.theme === key
                      ? 'bg-surface text-on-surface shadow-sm border border-outline'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  onClick={() => {
                    setParams((p) => ({ ...p, theme: key }));
                    applyTheme(key);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-outline mb-6 gap-4">
            <div>
              <div className="font-semibold text-on-surface">Visibilité par défaut</div>
              <div className="text-sm text-on-surface-variant mt-0.5">
                Qui voit vos nouvelles publications
              </div>
            </div>
            <select
              className="form-input min-w-[160px]"
              value={params.visibiliteParDefaut}
              onChange={(e) =>
                setParams((p) => ({ ...p, visibiliteParDefaut: e.target.value }))
              }
            >
              <option value="PUBLIC">🌍 Public</option>
              <option value="MEMBRES">👥 Membres</option>
            </select>
          </div>

          {/* Notifications Email */}
          <div className="flex items-center justify-between pb-6 border-b border-outline mb-6">
            <div>
              <div className="font-semibold text-on-surface">Notifications par email</div>
              <div className="text-sm text-on-surface-variant mt-0.5">
                Recevez des emails pour les activités importantes
              </div>
            </div>
            <ToggleSwitch
              checked={params.notificationsEmail}
              onChange={(v) => setParams((p) => ({ ...p, notificationsEmail: v }))}
            />
          </div>

          {/* Notifications Push */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-on-surface">Notifications push</div>
              <div className="text-sm text-on-surface-variant mt-0.5">
                Alertes en temps réel dans l'application
              </div>
            </div>
            <ToggleSwitch
              checked={params.notificationsPush}
              onChange={(v) => setParams((p) => ({ ...p, notificationsPush: v }))}
            />
          </div>
        </SectionCard>

        {/* ── Sécurité ── */}
        <SectionCard title="Sécurité" icon={<Shield size={20} />}>
          <form onSubmit={handlePwdSubmit}>
            {pwdError && (
              <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl mb-5 flex items-center gap-2 font-medium">
                {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-xl mb-5 flex items-center gap-2 font-medium">
                <CheckCircle2 size={20} />
                {pwdSuccess}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Mot de passe actuel</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={pwdForm.ancien}
                  onChange={(e) => setPwdForm((p) => ({ ...p, ancien: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 8 caractères"
                  value={pwdForm.nouveau}
                  onChange={(e) => setPwdForm((p) => ({ ...p, nouveau: e.target.value }))}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm((p) => ({ ...p, confirm: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="btn btn-ghost flex items-center gap-2 border border-outline hover:bg-surface-variant"
              >
                <Lock size={18} />
                Changer le mot de passe
              </button>
            </div>
          </form>
        </SectionCard>
      </div>
    </AppLayout>
  );
}
