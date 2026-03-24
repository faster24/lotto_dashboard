import { apiRequest } from '../lib/apiClient.ts'
import type {
  ThreeDResultItemData,
  ThreeDResultListData,
  ThreeDResultWritePayload,
} from '../types/api.ts'

interface ListThreeDResultsParams {
  page: number
  pageSize: number
  stockDate?: string
}

const toSearchParams = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value)
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const toWriteBody = (payload: ThreeDResultWritePayload) => ({
  stock_date: payload.stockDate,
  threed: payload.threed,
})

export const threeDResultsApi = {
  list: (token: string, params: ListThreeDResultsParams) =>
    apiRequest<ThreeDResultListData>(
      `/three-d-results${toSearchParams({
        page: String(params.page),
        page_size: String(params.pageSize),
        stock_date: params.stockDate,
      })}`,
      {
        method: 'GET',
        token,
      },
    ),

  getLatest: (token: string) =>
    apiRequest<ThreeDResultItemData>('/three-d-results/latest', {
      method: 'GET',
      token,
    }),

  saveByDate: (token: string, payload: ThreeDResultWritePayload) =>
    apiRequest<ThreeDResultItemData>('/admin/three-d-results', {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toWriteBody(payload)),
    }),

  update: (token: string, id: number, payload: ThreeDResultWritePayload) =>
    apiRequest<ThreeDResultItemData>(`/admin/three-d-results/${id}`, {
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toWriteBody(payload)),
    }),

  remove: (token: string, id: number) =>
    apiRequest<null>(`/admin/three-d-results/${id}`, {
      method: 'DELETE',
      token,
    }),
}
