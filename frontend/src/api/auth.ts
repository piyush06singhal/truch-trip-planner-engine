import apiClient from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  date_joined?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const registerUser = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post('/api/auth/register/', { username, email, password });
  return response.data;
};

export const loginUser = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post('/api/auth/login/', { username, password });
  return response.data;
};

export const logoutUser = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout/');
};

export const getUserProfile = async (): Promise<User> => {
  const response = await apiClient.get('/api/auth/profile/');
  return response.data;
};
