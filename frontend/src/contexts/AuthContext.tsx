import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/models';
import { authService, LoginResponseData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  terapeutaId: number | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTherapist: boolean;
  login: (email: string, pass: string) => Promise<LoginResponseData>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getStoredUser());
  const [terapeutaId, setTerapeutaId] = useState<number | null>(authService.getStoredTherapistId());
  const [token, setToken] = useState<string | null>(localStorage.getItem('sumaq_access_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Validar sesión al montar el contexto
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sumaq_access_token');
      if (storedToken) {
        try {
          const current = await authService.getCurrentUser();
          setUser(current.user);
          setTerapeutaId(current.terapeuta_id || null);
          localStorage.setItem('sumaq_user', JSON.stringify(current.user));
          if (current.terapeuta_id) {
            localStorage.setItem('sumaq_terapeuta_id', current.terapeuta_id.toString());
          }
        } catch {
          authService.logout();
          setUser(null);
          setTerapeutaId(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    setUser(data.user);
    setTerapeutaId(data.terapeuta_id || null);
    setToken(data.access);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setTerapeutaId(null);
    setToken(null);
  };

  // ### RIESGO: Control de inactividad: auto-logout a los 5 minutos en React (RH03 - Control Preventivo de Sesión Desatendida)
  useEffect(() => {
    if (!token || !user) return;

    const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutos
    let timer: any = null;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        console.warn("[Seguridad] Sesión cerrada automáticamente tras 5 minutos de inactividad.");
        logout();
      }, INACTIVITY_LIMIT_MS);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [token, user]);

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.rol === 'ADMIN';
  const isTherapist = user?.rol === 'TERAPEUTA';

  return (
    <AuthContext.Provider
      value={{
        user,
        terapeutaId,
        token,
        isAuthenticated,
        isAdmin,
        isTherapist,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
