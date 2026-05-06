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

export const PRODUCTS: Product[] = [
  { id: 'P001', sku: 'HP-INK-BLK', name: 'حبر طابعة HP (أسود)', category: 'مكتبية', unit: 'قطعة', costPrice: 45, sellPrice: 85, stock: 120, minStock: 20, status: 'active' },
  { id: 'P002', sku: 'PAPER-A4-500', name: 'ورق A4 (رزمة)', category: 'مكتبية', unit: 'رزمة', costPrice: 12, sellPrice: 22, stock: 450, minStock: 100, status: 'active' },
  { id: 'P003', sku: 'WB-48X36', name: 'لوحة عرض بيضاء', category: 'معدات', unit: 'قطعة', costPrice: 180, sellPrice: 280, stock: 15, minStock: 5, status: 'active' },
  { id: 'P004', sku: 'STAPLER-STD', name: 'دباسة مكتبية', category: 'مكتبية', unit: 'قطعة', costPrice: 18, sellPrice: 35, stock: 80, minStock: 15, status: 'active' },
  { id: 'P005', sku: 'PEN-MIX-12', name: 'علبة أقلام ملونة', category: 'مكتبية', unit: 'علبة', costPrice: 25, sellPrice: 45, stock: 60, minStock: 12, status: 'active' },
  { id: 'P006', sku: 'LAPTOP-DELL-15', name: 'لابتوب Dell 15 بوصة', category: 'تقنية', unit: 'جهاز', costPrice: 2800, sellPrice: 3500, stock: 8, minStock: 3, status: 'active' },
  { id: 'P007', sku: 'MOUSE-LOG-MX', name: 'ماوس لوجيتك MX', category: 'تقنية', unit: 'قطعة', costPrice: 220, sellPrice: 350, stock: 35, minStock: 10, status: 'active' },
  { id: 'P008', sku: 'KEYB-MCH-MX', name: 'كيبورد ميكانيكي', category: 'تقنية', unit: 'قطعة', costPrice: 180, sellPrice: 320, stock: 22, minStock: 8, status: 'active' },
  { id: 'P009', sku: 'DESK-CHAIR-01', name: 'كرسي مكتب مريح', category: 'أثاث', unit: 'قطعة', costPrice: 450, sellPrice: 750, stock: 10, minStock: 5, status: 'active' },
  { id: 'P010', sku: 'FILING-CAB-4D', name: 'دولاب ملفات معدني', category: 'أثاث', unit: 'قطعة', costPrice: 380, sellPrice: 620, stock: 6, minStock: 3, status: 'active' },
]

export const WITHDRAWALS: Withdrawal[] = [
  { id: 'W001', productId: 'P001', date: '2025-04-15', qty: 10, reference: 'INV-2025-001', customer: 'شركة الرواد التجارية', status: 'completed' },
  { id: 'W002', productId: 'P002', date: '2025-04-15', qty: 50, reference: 'INV-2025-001', customer: 'شركة الرواد التجارية', status: 'completed' },
  { id: 'W003', productId: 'P001', date: '2025-04-18', qty: 8, reference: 'INV-2025-002', customer: 'مؤسسة الإبداع الرقمي', status: 'completed' },
]

export const CATEGORIES = ['الكل', 'مكتبية', 'تقنية', 'معدات', 'أثاث']

export function getProductWithdrawals(productId: string): Withdrawal[] {
  return WITHDRAWALS.filter(w => w.productId === productId)
}

export function hasPendingWithdrawals(productId: string): boolean {
  return WITHDRAWALS.some(w => w.productId === productId && w.status === 'pending')
}
