import { apiRequest } from '../lib/apiClient.ts'
import type {
  AnalyticsDailyTrendsData,
  AnalyticsFilters,
  AnalyticsKpisData,
  AnalyticsPayoutsData,
  AnalyticsSettlementRunsData,
  AnalyticsStatusDistributionData,
  AnalyticsTopNumbersData,
} from '../types/api.ts'

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

export const analyticsApi = {
  getKpis: (token: string, filters: AnalyticsFilters) =>
    apiRequest<AnalyticsKpisData>(
      `/admin/analytics/kpis${toSearchParams({
        from: filters.dateFrom,
        to: filters.dateTo,
        target_opentime: filters.targetOpenTime,
      })}`,
      { method: 'GET', token },
    ),

  getDailyTrends: (token: string, filters: AnalyticsFilters) =>
    apiRequest<AnalyticsDailyTrendsData>(
      `/admin/analytics/trends/daily${toSearchParams({
        from: filters.dateFrom,
        to: filters.dateTo,
        target_opentime: filters.targetOpenTime,
        bet_type: filters.betType,
      })}`,
      { method: 'GET', token },
    ),

  getStatusDistribution: (token: string, filters: AnalyticsFilters) =>
    apiRequest<AnalyticsStatusDistributionData>(
      `/admin/analytics/status-distribution${toSearchParams({
        from: filters.dateFrom,
        to: filters.dateTo,
        target_opentime: filters.targetOpenTime,
      })}`,
      { method: 'GET', token },
    ),

  getPayouts: (token: string, filters: AnalyticsFilters) =>
    apiRequest<AnalyticsPayoutsData>(
      `/admin/analytics/payouts${toSearchParams({
        from: filters.dateFrom,
        to: filters.dateTo,
        admin_user_id:
          filters.adminUserId !== undefined ? String(filters.adminUserId) : undefined,
      })}`,
      { method: 'GET', token },
    ),

  getTopNumbers: (token: string, filters: AnalyticsFilters) =>
    apiRequest<AnalyticsTopNumbersData>(
      `/admin/analytics/top-numbers${toSearchParams({
        from: filters.dateFrom,
        to: filters.dateTo,
        bet_type: filters.betType,
        limit: filters.limit !== undefined ? String(filters.limit) : undefined,
      })}`,
      { method: 'GET', token },
    ),

  getSettlementRuns: (token: string, filters: AnalyticsFilters) =>
    apiRequest<AnalyticsSettlementRunsData>(
      `/admin/analytics/settlement-runs${toSearchParams({
        from: filters.dateFrom,
        to: filters.dateTo,
      })}`,
      { method: 'GET', token },
    ),
}
