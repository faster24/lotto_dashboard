import { apiRequest } from '../lib/apiClient.ts'
import type { AuthData, LoginRequest, User } from '../types/api.ts'

export const authApi = {
  login: (payload: LoginRequest) =>
    apiRequest<AuthData>('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  me: (token: string) =>
    apiRequest<{ user: User }>('/me', {
      method: 'GET',
      token,
    }),

  logout: (token: string) =>
    apiRequest<null>('/logout', {
      method: 'POST',
      token,
    }),
}
