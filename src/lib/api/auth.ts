import { apiClient } from './client';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types';

export const authApi = {
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient<{ data: AuthResponse }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient<{ data: AuthResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient<{ data: { user: User } }>('/auth/me');
    return response.data.user;
  },

  saveToken(token: string, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    (remember ? sessionStorage : localStorage).removeItem('token');
  },

  removeToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token') ?? sessionStorage.getItem('token');
  },
};
