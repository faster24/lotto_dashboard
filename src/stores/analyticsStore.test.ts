import { beforeEach, describe, expect, it } from 'vitest'
import { useAnalyticsStore } from './analyticsStore.ts'

describe('useAnalyticsStore', () => {
  beforeEach(() => {
    useAnalyticsStore.setState({
      filters: {
        dateRange: '30d',
        segment: 'all',
        channel: 'all',
      },
    })
  })

  it('updates date range filter', () => {
    useAnalyticsStore.getState().setDateRange('7d')
    expect(useAnalyticsStore.getState().filters.dateRange).toBe('7d')
  })

  it('updates segment and channel filters', () => {
    useAnalyticsStore.getState().setSegment('returning')
    useAnalyticsStore.getState().setChannel('paid')
    expect(useAnalyticsStore.getState().filters.segment).toBe('returning')
    expect(useAnalyticsStore.getState().filters.channel).toBe('paid')
  })

  it('resets filters to defaults', () => {
    useAnalyticsStore.getState().setDateRange('90d')
    useAnalyticsStore.getState().setSegment('new')
    useAnalyticsStore.getState().resetFilters()
    expect(useAnalyticsStore.getState().filters).toEqual({
      dateRange: '30d',
      segment: 'all',
      channel: 'all',
    })
  })
})
