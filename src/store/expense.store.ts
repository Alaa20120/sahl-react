import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch } from '@/lib/supabase'
import { EXPENSES, type Expense, type ExpenseStatus } from '@/lib/mock-data/expenses'
import { useTreasuryStore } from './treasury.store'

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
        try {
          const data = await supaFetch('expenses', { select: '*', limit: 500 })
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
        } catch (e: any) {
          set({ error: e.message, loading: false })
        }
      },

      async addExpense(data) {
        const id = `EXP-${String(get().expenses.length + 1).padStart(3, '0')}`
        const expense: Expense = { ...data, id }

        if (isSupabaseConfigured()) {
          await supaFetch('expenses', {
            method: 'POST',
            body: {
              date: data.date,
              employee: data.employee || null,
              category: data.category || null,
              description: data.description || null,
              type: data.type || 'expense',
              amount: data.amount,
              status: data.status || 'pending',
            },
          })
        }
        set(state => ({ expenses: [expense, ...state.expenses] }))
      },

      async updateStatus(id, status) {
        if (isSupabaseConfigured()) {
          await supaFetch('expenses', { method: 'PATCH', filter: 'id=eq.' + id, body: { status } })
        }
        set(state => ({ expenses: state.expenses.map(e => e.id === id ? { ...e, status } : e) }))

        // Treasury: create outgoing transaction when expense is approved
        if (status === 'approved') {
          const expense = get().expenses.find(e => e.id === id)
          if (expense) {
            await useTreasuryStore.getState().addTransaction({
              date: expense.date,
              description: `${expense.type === 'advance' ? 'سلفة' : 'مصروف'} - ${expense.category} - ${expense.employee}`,
              type: 'out',
              category: 'expense',
              amount: expense.amount,
              account: 'cash',
              ref: id,
            })
          }
        }
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
    { name: 'sahl-expenses-v7' }
  )
)
