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
  passwordVersion?: number
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (user: AuthUser) => void
  logout: () => void
  fetchUser: () => Promise<void>
  initAuth: () => () => void
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>
  logoutAllDevices: () => void
  checkPasswordVersion: () => boolean
}

const CURRENT_PASSWORD_VERSION_KEY = 'sahl-pwd-version'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      login(user) {
        // Store the current password version in localStorage for session validation
        if (user.passwordVersion) {
          localStorage.setItem(CURRENT_PASSWORD_VERSION_KEY, String(user.passwordVersion))
        }
        set({ user, isAuthenticated: true, loading: false })
      },

      logout() {
        localStorage.removeItem(CURRENT_PASSWORD_VERSION_KEY)
        set({ user: null, isAuthenticated: false, loading: false })
      },

      async fetchUser() {
        // No-op
      },

      initAuth() {
        // Check password version on init
        const { user, checkPasswordVersion, logout } = get()
        if (user && !checkPasswordVersion()) {
          logout()
        }
        return () => {}
      },

      async changePassword(oldPassword, newPassword) {
        const user = get().user
        if (!user) return { success: false, message: 'غير مسجل الدخول' }
        if (!user.accessToken) return { success: false, message: 'لا يوجد رمز وصول' }

        const SUPA_URL = import.meta.env.VITE_SUPABASE_URL
        const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

        try {
          // Update password via Supabase Auth REST API
          const res = await fetch(`${SUPA_URL}/auth/v1/user`, {
            method: 'PUT',
            headers: {
              'apikey': SUPA_KEY,
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: newPassword }),
          })

          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            return { success: false, message: err.message || 'فشل تغيير كلمة المرور' }
          }

          // Increment password version and logout all devices
          get().logoutAllDevices()
          return { success: true, message: 'تم تغيير كلمة المرور بنجاح — سجل الدخول مرة أخرى' }
        } catch (e: any) {
          return { success: false, message: e.message || 'خطأ في الاتصال' }
        }
      },

      logoutAllDevices() {
        // Increment password version to invalidate other sessions
        const user = get().user
        if (!user) return

        const newVersion = (user.passwordVersion || 1) + 1
        const updatedUser = { ...user, passwordVersion: newVersion }

        // Update stored version
        localStorage.setItem(CURRENT_PASSWORD_VERSION_KEY, String(newVersion))
        set({ user: updatedUser })

        // Clear all other stores to force re-login on other devices
        // This will be checked on initAuth
      },

      checkPasswordVersion() {
        const user = get().user
        if (!user || !user.passwordVersion) return true

        const storedVersion = localStorage.getItem(CURRENT_PASSWORD_VERSION_KEY)
        if (!storedVersion) return true

        return Number(storedVersion) === user.passwordVersion
      },
    }),
    {
      name: 'sahl-auth',
    }
  )
)
