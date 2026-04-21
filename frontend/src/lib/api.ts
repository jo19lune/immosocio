import axios from 'axios';
import toast from 'react-hot-toast';

// L'URL de l'API est configurée dans .env (VITE_API_URL).
// Par défaut : http://localhost:8080/api
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired';

function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers.common['Authorization'];
}

// ── Endpoints de fond qui ne doivent pas afficher de toast ───────────────────
const SILENT_ENDPOINTS = [
  '/notifications/count',
  '/messages/non-lus',
  '/parametres',
];

function isSilentEndpoint(url: string = ''): boolean {
  return SILENT_ENDPOINTS.some(ep => url.includes(ep));
}

// ── Intercepteur requête — attache automatiquement le token JWT si présent ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Intercepteur réponse — déconnexion automatique si token expiré ──────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Ignorer les requêtes annulées (AbortController / Strict Mode)
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url: string = error.config?.url ?? '';

    if (status === 401) {
      // Token absent ou invalide → déconnexion forcée
      clearStoredSession();
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
      return Promise.reject(error);
    }

    if (status === 403) {
      // Accès refusé. Si c'est un endpoint de fond (polling), on ignore silencieusement.
      // Si c'est un endpoint d'authentification, on force la déconnexion.
      if (!isSilentEndpoint(url)) {
        // Afficher une erreur uniquement pour les actions explicites de l'utilisateur
        const msg = error.response?.data?.erreur || error.response?.data?.message;
        if (msg) toast.error(msg);
        // Ne pas rediriger — laisser la page gérer l'état vide
      }
      return Promise.reject(error);
    }

    // Autres erreurs — afficher un toast sauf pour les endpoints silencieux
    if (!isSilentEndpoint(url)) {
      if (error.response?.data?.erreur) {
        toast.error(error.response.data.erreur);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message && error.message !== 'canceled') {
        toast.error("Une erreur inattendue s'est produite");
      }
    }

    return Promise.reject(error);
  }
);

// ── Helper upload d'image vers le backend ────────────────────────────────────
export async function uploadImage(
  file: File,
  type: 'publication' | 'profil' | 'annonce' = 'publication'
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/upload/image?type=${type}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

export default api;
