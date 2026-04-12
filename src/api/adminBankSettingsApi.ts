import { apiRequest } from '../lib/apiClient.ts'
import type {
  AdminBankSettingItemData,
  AdminBankSettingListData,
  AdminBankSettingWritePayload,
} from '../types/api.ts'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export const adminBankSettingsApi = {
  list: (token: string) =>
    apiRequest<AdminBankSettingListData>('/admin/bank-settings', { token }),

  create: (token: string, payload: AdminBankSettingWritePayload) =>
    apiRequest<AdminBankSettingItemData>('/admin/bank-settings', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
      headers: JSON_HEADERS,
    }),

  update: (token: string, id: number, payload: Partial<AdminBankSettingWritePayload>) =>
    apiRequest<AdminBankSettingItemData>(`/admin/bank-settings/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
      headers: JSON_HEADERS,
    }),

  remove: (token: string, id: number) =>
    apiRequest<{ message: string }>(`/admin/bank-settings/${id}`, {
      method: 'DELETE',
      token,
    }),
}
