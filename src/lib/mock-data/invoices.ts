export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft'

export interface Invoice {
  id: string
  number: string
  customer: string
  date: string
  dueDate: string
  amount: number
  tax: number
  total: number
  status: InvoiceStatus
  items: InvoiceItem[]
}

export interface InvoiceItem {
  description: string
  qty: number
  price: number
  total: number
}

export const INVOICES: Invoice[] = [
  { id: '1', number: 'INV-2025-001', customer: 'شركة الرياض للتجارة', date: '2025-04-01', dueDate: '2025-04-30', amount: 12500, tax: 1875, total: 14375, status: 'paid', items: [{ description: 'استشارات تقنية', qty: 5, price: 2500, total: 12500 }] },
  { id: '2', number: 'INV-2025-002', customer: 'مؤسسة الأمل', date: '2025-04-05', dueDate: '2025-05-05', amount: 8200, tax: 1230, total: 9430, status: 'pending', items: [{ description: 'خدمات تصميم', qty: 1, price: 8200, total: 8200 }] },
  { id: '3', number: 'INV-2025-003', customer: 'شركة الخليج', date: '2025-03-15', dueDate: '2025-04-14', amount: 31000, tax: 4650, total: 35650, status: 'overdue', items: [{ description: 'توريد أجهزة', qty: 10, price: 3100, total: 31000 }] },
  { id: '4', number: 'INV-2025-004', customer: 'مجموعة النخبة', date: '2025-04-10', dueDate: '2025-05-10', amount: 5400, tax: 810, total: 6210, status: 'draft', items: [{ description: 'تدريب موظفين', qty: 3, price: 1800, total: 5400 }] },
  { id: '5', number: 'INV-2025-005', customer: 'شركة البناء الحديث', date: '2025-04-12', dueDate: '2025-05-12', amount: 22000, tax: 3300, total: 25300, status: 'paid', items: [{ description: 'مقاولات', qty: 1, price: 22000, total: 22000 }] },
  { id: '6', number: 'INV-2025-006', customer: 'مؤسسة التميز', date: '2025-04-14', dueDate: '2025-05-14', amount: 9800, tax: 1470, total: 11270, status: 'pending', items: [{ description: 'صيانة دورية', qty: 2, price: 4900, total: 9800 }] },
  { id: '7', number: 'INV-2025-007', customer: 'شركة الرواد', date: '2025-03-20', dueDate: '2025-04-19', amount: 47000, tax: 7050, total: 54050, status: 'overdue', items: [{ description: 'تجهيزات مكتبية', qty: 20, price: 2350, total: 47000 }] },
  { id: '8', number: 'INV-2025-008', customer: 'مؤسسة الإبداع', date: '2025-04-16', dueDate: '2025-05-16', amount: 6500, tax: 975, total: 7475, status: 'paid', items: [{ description: 'تطوير موقع', qty: 1, price: 6500, total: 6500 }] },
]

export const INVOICE_STATS = {
  total: 142800,
  paid: 89400,
  pending: 32600,
  overdue: 78050,
}
