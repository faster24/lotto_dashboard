import { apiRequest } from '../lib/apiClient.ts'
import type {
  OddSettingItemData,
  OddSettingListData,
  OddSettingWritePayload,
} from '../types/api.ts'

const toWriteBody = (payload: OddSettingWritePayload) => ({
  bet_type: payload.betType,
  odd: payload.odd,
  is_active: payload.isActive,
})

export const oddSettingsApi = {
  list: (token: string) =>
    apiRequest<OddSettingListData>('/odd-settings', {
      method: 'GET',
      token,
    }),

  getById: (token: string, id: number) =>
    apiRequest<OddSettingItemData>(`/odd-settings/${id}`, {
      method: 'GET',
      token,
    }),

  create: (token: string, payload: OddSettingWritePayload) =>
    apiRequest<OddSettingItemData>('/admin/odd-settings', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toWriteBody(payload)),
    }),

  update: (token: string, id: number, payload: OddSettingWritePayload) =>
    apiRequest<OddSettingItemData>(`/admin/odd-settings/${id}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toWriteBody(payload)),
    }),

  remove: (token: string, id: number) =>
    apiRequest<null>(`/admin/odd-settings/${id}`, {
      method: 'DELETE',
      token,
    }),
}
