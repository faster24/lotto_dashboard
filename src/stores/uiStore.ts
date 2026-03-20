import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { ThemeMode, UiDensity } from '../types/dashboard.ts'

interface UiStoreState {
  themeMode: ThemeMode
  isSidebarOpen: boolean
  density: UiDensity
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  closeSidebar: () => void
  setDensity: (density: UiDensity) => void
}

const storageKey = 'admin-ui-preferences'
const fallbackStorage = new Map<string, string>()

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name)
    } catch {
      return fallbackStorage.get(name) ?? null
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value)
      return
    } catch {
      fallbackStorage.set(name, value)
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name)
      return
    } catch {
      fallbackStorage.delete(name)
    }
  },
}

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      themeMode: 'dark',
      isSidebarOpen: false,
      density: 'comfortable',
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),
      setDensity: (density) => set({ density }),
    }),
    {
      name: storageKey,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        density: state.density,
      }),
    },
  ),
)

export const uiStoreStorageKey = storageKey
