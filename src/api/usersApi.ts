import { apiRequest } from '../lib/apiClient.ts'
import type { AdminUserDetailData, AdminUserListData } from '../types/api.ts'

interface ListAdminUsersParams {
  page: number
  pageSize: number
}

const buildQuery = (params: ListAdminUsersParams) =>
  `?page=${encodeURIComponent(params.page)}&page_size=${encodeURIComponent(params.pageSize)}`

export const usersApi = {
  listAdmin: (token: string, params: ListAdminUsersParams) =>
    apiRequest<AdminUserListData>(`/admin/users${buildQuery(params)}`, {
      method: 'GET',
      token,
    }),

  getAdminDetail: (token: string, userId: number) =>
    apiRequest<AdminUserDetailData>(`/admin/users/${userId}`, {
      method: 'GET',
      token,
    }),

  ban: (token: string, userId: number) =>
    apiRequest<AdminUserDetailData>(`/admin/users/${userId}/ban`, {
      method: 'POST',
      token,
    }),

  unban: (token: string, userId: number) =>
    apiRequest<AdminUserDetailData>(`/admin/users/${userId}/unban`, {
      method: 'POST',
      token,
    }),

  remove: (token: string, userId: number) =>
    apiRequest<null>(`/admin/users/${userId}`, {
      method: 'DELETE',
      token,
    }),
}
