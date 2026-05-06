export type ExpenseStatus = 'approved' | 'pending' | 'rejected'
export type ExpenseType = 'expense' | 'advance'

export interface Expense {
  id: string
  date: string
  employee: string
  category: string
  description: string
  amount: number
  type: ExpenseType
  status: ExpenseStatus
}

export const EXPENSE_CATEGORIES = ['الكل', 'مكتبية', 'نقل وتنقل', 'ضيافة', 'إيجار', 'صيانة', 'اتصالات', 'رواتب', 'تسويق', 'أخرى']

export const EXPENSES: Expense[] = []

// ── Computed stats from actual EXPENSES data ──────────────────────────
const now = new Date()
const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM

function computeExpenseStats(expenses: Expense[]) {
  return {
    totalExpenses: expenses.filter(e => e.type === 'expense' && e.status === 'approved').reduce((s, e) => s + e.amount, 0),
    totalAdvances: expenses.filter(e => e.type === 'advance' && e.status === 'approved').reduce((s, e) => s + e.amount, 0),
    pendingCount: expenses.filter(e => e.status === 'pending').length,
    approvedThisMonth: expenses.filter(e => e.status === 'approved' && e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0),
  }
}

export const EXPENSE_STATS = computeExpenseStats(EXPENSES)
