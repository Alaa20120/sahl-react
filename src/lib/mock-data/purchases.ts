export type PurchaseStatus = 'received' | 'pending' | 'partial' | 'cancelled' | 'voided'

export interface PurchaseItem {
  description: string
  productId?: string
  qty: number
  price: number
  total: number
}

export interface Purchase {
  id: string
  date: string
  dueDate?: string
  supplier: string
  supplierVat?: string
  itemCount: number
  total: number
  tax: number
  amount: number
  paid: number
  status: PurchaseStatus
  lineItems: PurchaseItem[]
  createdBy?: string
}

export const PURCHASES: Purchase[] = []
