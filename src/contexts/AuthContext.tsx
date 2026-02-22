import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';
import type { User, LoginCredentials, RegisterCredentials } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = authApi.getToken();
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser() {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch (err) {
      authApi.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const errorMessages: Record<string, string> = {
    'Invalid credentials': 'Email ou senha incorretos',
    'Email already exists': 'Este email já está cadastrado',
    'User not found': 'Usuário não encontrado',
  };

  function translateError(message: string): string {
    return errorMessages[message] || message;
  }

  async function login(credentials: LoginCredentials, rememberMe = true) {
    try {
      setError(null);
      const { accessToken, user } = await authApi.login(credentials);
      authApi.saveToken(accessToken, rememberMe);
      setUser(user);
      return true;
    } catch (err: any) {
      setError(translateError(err.message) || 'Erro ao fazer login');
      return false;
    }
  }

  async function register(credentials: RegisterCredentials) {
    try {
      setError(null);
      const { accessToken, user } = await authApi.register(credentials);
      authApi.saveToken(accessToken);
      setUser(user);
      return true;
    } catch (err: any) {
      setError(translateError(err.message) || 'Erro ao registrar');
      return false;
    }
  }

  function logout() {
    authApi.removeToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
