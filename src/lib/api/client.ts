const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  // Respostas 204 (No Content) não têm body - retorna vazio
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    // API retorna { error: "..." } ou { message: "..." }
    const message = data.error || data.message || 'Erro na requisição';
    throw new ApiError(message, response.status, data);
  }

  return data;
}
