import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type UserRole = 'admin' | 'accountant' | 'cashier' | 'delegate' | 'hr' | 'readonly' | 'sales' | 'viewer'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  company: string
  avatar?: string
  delegateId?: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (user: AuthUser) => void
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
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

      async logout() {
        if (isSupabaseConfigured()) {
          await supabase.auth.signOut()
        }
        set({ user: null, isAuthenticated: false, loading: false })
      },

      async fetchUser() {
        if (!isSupabaseConfigured()) return
        set({ loading: true })
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (profile) {
            set({
              user: {
                id: user.id,
                name: profile.name,
                email: user.email || profile.email,
                role: profile.role as UserRole,
                company: 'الفروج الوطني',
                avatar: profile.avatar,
              },
              isAuthenticated: true,
              loading: false,
            })
          }
        } else {
          set({ loading: false })
        }
      },
    }),
    { name: 'sahl-auth' }
  )
)
