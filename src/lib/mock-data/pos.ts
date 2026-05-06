export interface POSProduct {
  id: string
  name: string
  price: number
  category: string
  stock: number
  barcode: string
}

export interface POSSale {
  id: string
  date: string
  items: number
  total: number
  payment: 'cash' | 'card' | 'transfer'
  cashier: string
}

export const POS_PRODUCTS: POSProduct[] = []

export const POS_CATEGORIES = ['الكل', 'مكتبية', 'أدوات', 'طباعة', 'تخزين']

export const RECENT_SALES: POSSale[] = []
