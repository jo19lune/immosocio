import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api, { AUTH_SESSION_EXPIRED_EVENT } from '../lib/api';
import { connectWebSocket, disconnectWebSocket } from '../lib/websocket';
import { initTheme, applyTheme } from '../lib/theme';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  photo?: string;
  telephone?: string;
  emailVerifie: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  switchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurer la session sauvegardée + connecter le WS
  useEffect(() => {
    const syncLogoutState = () => {
      disconnectWebSocket();
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    };

    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      connectWebSocket(savedToken);
      
      // Charger les paramètres utilisateur (thème, etc.)
      api.get('/parametres').then(res => {
        if (res.data.theme) {
          applyTheme(res.data.theme);
          localStorage.setItem('theme', res.data.theme);
        }
      }).catch(() => {
        initTheme(); // Fallback sur le cache local
      });
    } else {
      initTheme();
    }
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, syncLogoutState);
    setLoading(false);

    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, syncLogoutState);
      disconnectWebSocket();
    };
  }, []);

  const login = async (email: string, motDePasse: string) => {
    const { data } = await api.post('/auth/login', { email, motDePasse });
    const { token: newToken, ...userData } = data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    // Ouvrir la connexion WebSocket après login
    connectWebSocket(newToken);
  };

  const logout = () => {
    // Fermer la connexion WebSocket avant de vider la session
    disconnectWebSocket();
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const switchRole = async () => {
    try {
      const { data } = await api.post('/auth/switch-role');
      const { token: newToken, ...userData } = data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      toast.success(`Mode changé pour ${userData.role}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
