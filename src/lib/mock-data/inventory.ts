export interface Product {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  costPrice: number
  sellPrice: number
  stock: number
  minStock: number
  status: 'active' | 'inactive'
}

export type WithdrawalStatus = 'pending' | 'completed' | 'cancelled'

export interface Withdrawal {
  id: string
  productId: string
  date: string
  qty: number
  reference: string
  customer: string
  status: WithdrawalStatus
  notes?: string
}

export const PRODUCTS: Product[] = []

export const WITHDRAWALS: Withdrawal[] = []

export const CATEGORIES: string[] = []

export function getProductWithdrawals(productId: string): Withdrawal[] {
  return WITHDRAWALS.filter(w => w.productId === productId)
}

export function hasPendingWithdrawals(productId: string): boolean {
  return WITHDRAWALS.some(w => w.productId === productId && w.status === 'pending')
}
