export type DelegateStatus = 'active' | 'inactive'
export type DelegateInvoiceType = 'sale' | 'purchase'
export type DelegateTransactionType = 'collection' | 'withdrawal' | 'expense' | 'commission' | 'remittance'
export type WarehouseItemStatus = 'in-stock' | 'reserved' | 'transferred'

export interface DelegateLocation {
  lat: number
  lng: number
  address: string
  timestamp: string
}

export interface DelegateWarehouseItem {
  id: string
  productId: string
  productName: string
  productSku: string
  qty: number
  costPrice: number
  receivedDate: string
  status: WarehouseItemStatus
  source?: 'purchased' | 'company'
}

export interface DelegateInvoiceItem {
  productId?: string
  description: string
  qty: number
  price: number
  total: number
}

export interface DelegateInvoice {
  id: string
  number: string
  date: string
  type: DelegateInvoiceType
  party: string
  customerId?: string
  items: DelegateInvoiceItem[]
  subtotal: number
  tax: number
  total: number
  paidAmount?: number
  status: 'paid' | 'pending' | 'overdue' | 'confirmed'
  paymentMethod?: 'cash' | 'credit'
  confirmedAt?: string
}

export interface DelegateTransaction {
  id: string
  date: string
  type: DelegateTransactionType
  amount: number
  description: string
  reference?: string
  balanceAfter: number
}

export interface DelegateStats {
  totalSales: number
  totalPurchases: number
  collected: number
  balance: number
  externalCredit: number
  expenses: number
  companyEntrusted: number
}

export interface Delegate {
  id: string
  name: string
  phone: string
  email: string
  zone: string
  status: DelegateStatus
  username: string
  password: string
  avatar: string
  location: DelegateLocation
  locationHistory: DelegateLocation[]
  warehouse: DelegateWarehouseItem[]
  invoices: DelegateInvoice[]
  transactions: DelegateTransaction[]
  stats: DelegateStats
}

export const DELEGATES: Delegate[] = []

export function getDelegateById(id: string): Delegate | undefined {
  return DELEGATES.find(d => d.id === id)
}

export function getDelegateWarehouseByProductId(productId: string) {
  const result: { delegateId: string; delegateName: string; qty: number }[] = []
  for (const d of DELEGATES) {
    for (const w of d.warehouse) {
      if (w.productId === productId && w.status === 'in-stock') {
        result.push({ delegateId: d.id, delegateName: d.name, qty: w.qty })
      }
    }
  }
  return result
}
