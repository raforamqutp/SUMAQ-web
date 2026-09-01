import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/models';
import { authService, LoginResponseData } from '../services/authService';

/**
 * ============================================================================
 * CONTEXTO GLOBAL: AUTH CONTEXT (Gestión de Sesión & Roles)
 * ============================================================================
 * Maneja el estado global de autenticación en todo el árbol de React:
 * - user: Datos del usuario autenticado (nombre, correo, rol)
 * - terapeutaId: ID asignado en caso de que el rol sea 'TERAPEUTA'
 * - token: JWT de acceso persistido en localStorage ('sumaq_access_token')
 * - isAuthenticated: Booleano derivado (true si existen user y token)
 * - login / logout: Métodos globales para iniciar y cerrar sesión
 * ============================================================================
 */
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
