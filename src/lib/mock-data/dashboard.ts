export const DASHBOARD_STATS = {
  revenue: 0,
  revenueChange: 0,
  expenses: 0,
  expensesChange: 0,
  profit: 0,
  profitChange: 0,
  cashBalance: 0,
  cashChange: 0,
  pendingInvoices: 0,
  overdueInvoices: 0,
  newCustomers: 0,
  activeEmployees: 0,
}

export const MONTHLY_DATA: { month: string; revenue: number; expenses: number }[] = []

export const RECENT_INVOICES: { id: string; customer: string; amount: number; status: 'paid' | 'overdue' | 'pending' | 'draft' | 'confirmed' | 'partial'; date: string }[] = []

export const AI_INSIGHTS: { icon: string; color: string; text: string }[] = []
