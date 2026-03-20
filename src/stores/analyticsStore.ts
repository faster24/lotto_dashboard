import { create } from 'zustand'
import type { AnalyticsFilters } from '../types/dashboard.ts'

interface AnalyticsStoreState {
  filters: AnalyticsFilters
  setDateRange: (dateRange: AnalyticsFilters['dateRange']) => void
  setSegment: (segment: AnalyticsFilters['segment']) => void
  setChannel: (channel: AnalyticsFilters['channel']) => void
  resetFilters: () => void
}

const defaultFilters: AnalyticsFilters = {
  dateRange: '30d',
  segment: 'all',
  channel: 'all',
}

export const useAnalyticsStore = create<AnalyticsStoreState>((set) => ({
  filters: defaultFilters,
  setDateRange: (dateRange) =>
    set((state) => ({ filters: { ...state.filters, dateRange } })),
  setSegment: (segment) =>
    set((state) => ({ filters: { ...state.filters, segment } })),
  setChannel: (channel) =>
    set((state) => ({ filters: { ...state.filters, channel } })),
  resetFilters: () => set({ filters: defaultFilters }),
}))
