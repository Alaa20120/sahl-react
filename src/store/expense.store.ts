import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { EXPENSES, type Expense, type ExpenseStatus } from '@/lib/mock-data/expenses'

interface ExpenseStore {
  expenses: Expense[]
  addExpense: (data: Omit<Expense, 'id'>) => void
  updateStatus: (id: string, status: ExpenseStatus) => void
  // Computed getters
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

      addExpense(data) {
        const id = `EXP-${String(get().expenses.length + 1).padStart(3, '0')}`
        set(state => ({ expenses: [{ ...data, id }, ...state.expenses] }))
      },

      updateStatus(id, status) {
        set(state => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, status } : e),
        }))
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
