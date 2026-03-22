import { apiRequest } from '../lib/apiClient.ts'
import type { TwoDResultItemData, TwoDResultListData } from '../types/api.ts'

interface ListTwoDResultsParams {
  page: number
  pageSize: number
  stockDate?: string
  openTime?: string
  historyId?: string
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

export const twoDResultsApi = {
  list: (token: string, params: ListTwoDResultsParams) =>
    apiRequest<TwoDResultListData>(
      `/two-d-results${toSearchParams({
        page: String(params.page),
        page_size: String(params.pageSize),
        stock_date: params.stockDate,
        open_time: params.openTime,
        history_id: params.historyId,
      })}`,
      {
        method: 'GET',
        token,
      },
    ),

  getLatest: (token: string) =>
    apiRequest<TwoDResultItemData>('/two-d-results/latest', {
      method: 'GET',
      token,
    }),
}
