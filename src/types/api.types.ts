/**
 * Types pour les rĂ©ponses API et la gestion des erreurs
 */

// RĂ©ponse standard de l'API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
}

// Erreur API
export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

// RĂ©ponse d'authentification
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

// RĂ©ponse paginĂ©e
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// État de chargement
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Erreur HTTP gĂ©nĂ©rique
export interface HttpError {
  status: number;
  message: string;
  errors?: ApiError[];
}