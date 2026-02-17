import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api/auth';
import type { User, LoginCredentials, RegisterCredentials } from '@/types';

export function useAuth() {
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

  async function login(credentials: LoginCredentials) {
    try {
      setError(null);
      const { accessToken, user } = await authApi.login(credentials);
      authApi.saveToken(accessToken);
      setUser(user);
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
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
      setError(err.message || 'Erro ao registrar');
      return false;
    }
  }

  function logout() {
    authApi.removeToken();
    setUser(null);
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
}
