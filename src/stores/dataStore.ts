import { create } from 'zustand'
import { mockDashboardData } from '../data/mockData.ts'
import type { DashboardData } from '../types/dashboard.ts'

interface DataStoreState {
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  data: DashboardData | null
  loadData: () => Promise<void>
}

export const useDataStore = create<DataStoreState>((set) => ({
  status: 'idle',
  error: null,
  data: null,
  loadData: async () => {
    try {
      set({ status: 'loading', error: null })
      await new Promise((resolve) => setTimeout(resolve, 150))
      set({ status: 'success', data: mockDashboardData })
    } catch {
      set({ status: 'error', error: 'Unable to load dashboard data' })
    }
  },
}))
