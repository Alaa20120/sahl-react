import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supaFetch } from '@/lib/supabase'

interface CategoryStore {
  categories: string[]
  loading: boolean
  fetch: () => Promise<void>
  addCategory: (name: string) => Promise<void>
  deleteCategory: (name: string) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      categories: [],
      loading: false,

      async fetch() {
        set({ loading: true })
        try {
          const data = await supaFetch('categories', { select: 'name', limit: 200 })
          if (Array.isArray(data) && data.length > 0) {
            set({ categories: data.map((r: any) => r.name), loading: false })
          } else {
            set({ loading: false })
          }
        } catch {
          set({ loading: false })
        }
      },

      async addCategory(name) {
        const trimmed = name.trim()
        if (!trimmed || get().categories.includes(trimmed)) return
        await supaFetch('categories', {
          method: 'POST',
          body: { name: trimmed },
          select: 'name',
        })
        set(state => ({ categories: [...state.categories, trimmed] }))
      },

      async deleteCategory(name) {
        await supaFetch(`categories?name=eq.${encodeURIComponent(name)}`, {
          method: 'DELETE',
        })
        set(state => ({ categories: state.categories.filter(c => c !== name) }))
      },
    }),
    { name: 'sahl-categories-v2' }
  )
)
