import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
});

// Intercepteur requête — attache automatiquement le token JWT si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

import toast from 'react-hot-toast';

// Intercepteur réponse — déconnexion automatique si token expiré
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    } else if (error.response?.data?.erreur) {
      toast.error(error.response.data.erreur);
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message !== 'canceled') {
      toast.error("Une erreur inattendue s'est produite");
    }
    return Promise.reject(error);
  }
);

// Helper upload d'image vers Google Drive via backend
export async function uploadImage(file: File, type: 'publication' | 'profil' | 'annonce' = 'publication'): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/upload/image?type=${type}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

export default api;
