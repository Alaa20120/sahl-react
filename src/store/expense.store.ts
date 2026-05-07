import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { EXPENSES, type Expense, type ExpenseStatus } from '@/lib/mock-data/expenses'

interface ExpenseStore {
  expenses: Expense[]
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  addExpense: (data: Omit<Expense, 'id'>) => Promise<void>
  updateStatus: (id: string, status: ExpenseStatus) => Promise<void>
  setExpenses: (expenses: Expense[]) => void
  totalExpenses: () => number
  totalAdvances: () => number
  pendingCount: () => number
  approvedThisMonth: () => number
}

const currentMonth = new Date().toISOString().slice(0, 7)

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: EXPENSES,
      loading: false,
      error: null,

      async fetch() {
        if (!isSupabaseConfigured()) return
        set({ loading: true, error: null })
        const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
        if (error) {
          set({ error: error.message, loading: false })
        } else {
          const mapped = (data || []).map((e: any): Expense => ({
            id: e.id,
            date: e.date,
            employee: e.employee || '',
            category: e.category || '',
            description: e.description || '',
            type: e.type || 'expense',
            amount: Number(e.amount) || 0,
            status: e.status || 'pending',
          }))
          set({ expenses: mapped, loading: false })
        }
      },

      async addExpense(data) {
        const id = `EXP-${String(get().expenses.length + 1).padStart(3, '0')}`
        const expense: Expense = { ...data, id }

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('expenses').insert({
            date: data.date,
            employee: data.employee || null,
            category: data.category || null,
            description: data.description || null,
            type: data.type || 'expense',
            amount: data.amount,
            status: data.status || 'pending',
          })
          if (error) throw new Error(error.message)
        }
        set(state => ({ expenses: [expense, ...state.expenses] }))
      },

      async updateStatus(id, status) {
        if (isSupabaseConfigured()) await supabase.from('expenses').update({ status }).eq('id', id)
        set(state => ({ expenses: state.expenses.map(e => e.id === id ? { ...e, status } : e) }))
      },

      setExpenses(expenses) {
        set({ expenses })
      },

      totalExpenses() {
        return get().expenses.filter(e => e.type === 'expense' && e.status === 'approved').reduce((s, e) => s + e.amount, 0)
      },

      totalAdvances() {
        return get().expenses.filter(e => e.type === 'advance' && e.status === 'approved').reduce((s, e) => s + e.amount, 0)
      },

      pendingCount() {
        return get().expenses.filter(e => e.status === 'pending').length
      },

      approvedThisMonth() {
        return get().expenses.filter(e => e.status === 'approved' && e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0)
      },
    }),
    { name: 'sahl-expenses-v1' }
  )
)
