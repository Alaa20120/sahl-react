import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'accountant' | 'cashier' | 'delegate' | 'hr' | 'readonly' | 'sales' | 'viewer'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  company: string
  avatar?: string
  delegateId?: string
  accessToken?: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (user: AuthUser) => void
  logout: () => void
  fetchUser: () => Promise<void>
  initAuth: () => () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      login(user) {
        set({ user, isAuthenticated: true, loading: false })
      },

      logout() {
        set({ user: null, isAuthenticated: false, loading: false })
      },

      async fetchUser() {
        // Handled by login() — no-op
      },

      initAuth() {
        // No-op — session managed by Zustand persist
        return () => {}
      },
    }),
    {
      name: 'sahl-auth',
    }
  )
)
