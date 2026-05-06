export type TxType = 'in' | 'out'
export type TxCategory = 'invoice' | 'expense' | 'salary' | 'purchase' | 'transfer' | 'collection' | 'other'

export interface Transaction {
  id: string
  date: string
  description: string
  type: TxType
  category: TxCategory
  amount: number
  balance: number
  ref?: string
  account: string
}

export const ACCOUNTS = [
  { id: 'cash', label: 'الصندوق النقدي', balance: 0, icon: 'fa-money-bill-wave', color: '#10B981' },
  { id: 'bank', label: 'البنك الأهلي', balance: 0, icon: 'fa-building-columns', color: '#2563EB' },
  { id: 'pos', label: 'جهاز نقاط البيع', balance: 0, icon: 'fa-credit-card', color: '#7C3AED' },
]

export const TRANSACTIONS: Transaction[] = []
