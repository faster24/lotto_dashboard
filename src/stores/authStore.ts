import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { authApi } from '../api/authApi.ts'
import type { User } from '../types/api.ts'
import { isAdminFromClaims, parseTokenClaims } from '../utils/authClaims.ts'

interface AuthStoreState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  isAdmin: boolean
  signIn: (token: string, user: User) => void
  signOut: () => Promise<void>
}

const authStorageKey = 'admin-auth'
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

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isAdmin: false,
      signIn: (token, user) => {
        const claims = parseTokenClaims(token)
        set({
          isAuthenticated: true,
          user,
          token,
          isAdmin: isAdminFromClaims(claims),
        })
      },
      signOut: async () => {
        const token = useAuthStore.getState().token
        if (token) {
          try {
            await authApi.logout(token)
          } catch {
            void 0
          }
        }
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          isAdmin: false,
        })
      },
    }),
    {
      name: authStorageKey,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        isAdmin: state.isAdmin,
      }),
    },
  ),
)

export const authStoreStorageKey = authStorageKey
