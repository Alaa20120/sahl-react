export type InvoiceStatus = 'paid' | 'partial' | 'pending' | 'overdue' | 'draft' | 'confirmed'

export type PaymentMethod = 'cash' | 'credit'

export interface InvoiceAttachment {
  id: string
  name: string
  type: string // mime type
  dataUrl: string // base64
  uploadedAt: string
}

export interface Invoice {
  id: string
  number: string
  barcode?: string // barcode value for scanning
  customer: string
  customerId?: string
  date: string
  dueDate?: string // optional due date
  amount: number
  tax: number
  total: number
  paidAmount?: number
  status: InvoiceStatus
  paymentMethod?: PaymentMethod
  items: InvoiceItem[]
  createdBy?: string
  attachments: InvoiceAttachment[] // uploaded files/images
}

export interface InvoiceItem {
  description: string
  productId?: string
  qty: number
  price: number
  total: number
}

// Global invoice counter shared across ERP + Delegate to prevent duplicate numbers
let _globalInvoiceCounter = 10 // mock data has 10 invoices

export function getNextInvoiceNumber(): string {
  _globalInvoiceCounter++
  const year = new Date().getFullYear()
  return `INV-${year}-${String(_globalInvoiceCounter).padStart(4, '0')}`
}

export function generateBarcode(invoiceNumber: string): string {
  // Generate a barcode that encodes the invoice number
  // Using CODE-128 compatible format (just the number with prefix)
  return `SAHL-${invoiceNumber}`
}

export const INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    number: 'INV-2025-001',
    customer: 'شركة الرواد التجارية',
    customerId: 'C001',
    date: '2025-04-15',
    dueDate: '2025-05-15',
    amount: 4250,
    tax: 637.5,
    total: 4887.5,
    paidAmount: 4887.5,
    status: 'paid',
    paymentMethod: 'cash',
    items: [
      { description: 'حبر طابعة HP (أسود)', productId: 'P001', qty: 10, price: 85, total: 850 },
      { description: 'ورق A4 (رزمة)', productId: 'P002', qty: 50, price: 22, total: 1100 },
      { description: 'دباسة مكتبية', productId: 'P004', qty: 20, price: 35, total: 700 },
      { description: 'علبة أقلام ملونة', productId: 'P005', qty: 15, price: 45, total: 675 },
    ],
    createdBy: 'أحمد',
  },
  {
    id: 'inv-002',
    number: 'INV-2025-002',
    customer: 'مؤسسة الإبداع الرقمي',
    customerId: 'C002',
    date: '2025-04-18',
    dueDate: '2025-05-18',
    amount: 6800,
    tax: 1020,
    total: 7820,
    paidAmount: 7820,
    status: 'paid',
    paymentMethod: 'credit',
    items: [
      { description: 'لابتوب Dell 15 بوصة', productId: 'P006', qty: 2, price: 3500, total: 7000 },
      { description: 'حبر طابعة HP (أسود)', productId: 'P001', qty: 8, price: 85, total: 680 },
    ],
    createdBy: 'أحمد',
  },
  {
    id: 'inv-003',
    number: 'INV-2025-003',
    customer: 'شركة البناء الحديث',
    customerId: 'C004',
    date: '2025-04-20',
    dueDate: '2025-05-20',
    amount: 15200,
    tax: 2280,
    total: 17480,
    paidAmount: 10000,
    status: 'partial',
    paymentMethod: 'credit',
    items: [
      { description: 'لابتوب Dell 15 بوصة', productId: 'P006', qty: 3, price: 3500, total: 10500 },
      { description: 'ماوس لوجيتك MX', productId: 'P007', qty: 5, price: 350, total: 1750 },
      { description: 'كيبورد ميكانيكي', productId: 'P008', qty: 5, price: 320, total: 1600 },
      { description: 'كرسي مكتب مريح', productId: 'P009', qty: 2, price: 750, total: 1500 },
    ],
    createdBy: 'خالد',
  },
  {
    id: 'inv-004',
    number: 'INV-2025-004',
    customer: 'مجموعة النخبة',
    customerId: 'C003',
    date: '2025-04-22',
    dueDate: '2025-05-22',
    amount: 3200,
    tax: 480,
    total: 3680,
    paidAmount: 0,
    status: 'pending',
    paymentMethod: 'credit',
    items: [
      { description: 'لوحة عرض بيضاء', productId: 'P003', qty: 2, price: 280, total: 560 },
      { description: 'دباسة مكتبية', productId: 'P004', qty: 30, price: 35, total: 1050 },
      { description: 'ورق A4 (رزمة)', productId: 'P002', qty: 70, price: 22, total: 1540 },
    ],
    createdBy: 'فهد',
  },
  {
    id: 'inv-005',
    number: 'INV-2025-005',
    customer: 'مؤسسة التميز للخدمات',
    customerId: 'C005',
    date: '2025-04-25',
    dueDate: '2025-05-25',
    amount: 2100,
    tax: 315,
    total: 2415,
    paidAmount: 2415,
    status: 'paid',
    paymentMethod: 'cash',
    items: [
      { description: 'علبة أقلام ملونة', productId: 'P005', qty: 20, price: 45, total: 900 },
      { description: 'حبر طابعة HP (أسود)', productId: 'P001', qty: 12, price: 85, total: 1020 },
    ],
    createdBy: 'أحمد',
  },
  {
    id: 'inv-006',
    number: 'INV-2025-006',
    customer: 'شركة الرواد التجارية',
    customerId: 'C001',
    date: '2025-03-10',
    dueDate: '2025-04-10',
    amount: 8500,
    tax: 1275,
    total: 9775,
    paidAmount: 0,
    status: 'overdue',
    paymentMethod: 'credit',
    items: [
      { description: 'دولاب ملفات معدني', productId: 'P010', qty: 5, price: 620, total: 3100 },
      { description: 'كرسي مكتب مريح', productId: 'P009', qty: 4, price: 750, total: 3000 },
      { description: 'لوحة عرض بيضاء', productId: 'P003', qty: 4, price: 280, total: 1120 },
      { description: 'ماوس لوجيتك MX', productId: 'P007', qty: 4, price: 350, total: 1400 },
    ],
    createdBy: 'خالد',
  },
  {
    id: 'inv-007',
    number: 'INV-2025-007',
    customer: 'مؤسسة الإبداع الرقمي',
    customerId: 'C002',
    date: '2025-03-15',
    dueDate: '2025-04-15',
    amount: 5600,
    tax: 840,
    total: 6440,
    paidAmount: 6440,
    status: 'paid',
    paymentMethod: 'cash',
    items: [
      { description: 'لابتوب Dell 15 بوصة', productId: 'P006', qty: 1, price: 3500, total: 3500 },
      { description: 'كيبورد ميكانيكي', productId: 'P008', qty: 3, price: 320, total: 960 },
      { description: 'ماوس لوجيتك MX', productId: 'P007', qty: 3, price: 350, total: 1050 },
    ],
    createdBy: 'فهد',
  },
  {
    id: 'inv-008',
    number: 'INV-2025-008',
    customer: 'شركة البناء الحديث',
    customerId: 'C004',
    date: '2025-05-02',
    dueDate: '2025-06-02',
    amount: 11200,
    tax: 1680,
    total: 12880,
    paidAmount: 0,
    status: 'confirmed',
    paymentMethod: 'credit',
    items: [
      { description: 'كرسي مكتب مريح', productId: 'P009', qty: 8, price: 750, total: 6000 },
      { description: 'دولاب ملفات معدني', productId: 'P010', qty: 6, price: 620, total: 3720 },
      { description: 'لوحة عرض بيضاء', productId: 'P003', qty: 3, price: 280, total: 840 },
    ],
    createdBy: 'أحمد',
  },
  {
    id: 'inv-009',
    number: 'INV-2025-009',
    customer: 'مجموعة النخبة',
    customerId: 'C003',
    date: '2025-05-03',
    dueDate: '2025-06-03',
    amount: 4500,
    tax: 675,
    total: 5175,
    paidAmount: 0,
    status: 'draft',
    paymentMethod: 'credit',
    items: [
      { description: 'لابتوب Dell 15 بوصة', productId: 'P006', qty: 1, price: 3500, total: 3500 },
      { description: 'كيبورد ميكانيكي', productId: 'P008', qty: 2, price: 320, total: 640 },
      { description: 'ماوس لوجيتك MX', productId: 'P007', qty: 1, price: 350, total: 350 },
    ],
    createdBy: 'خالد',
  },
  {
    id: 'inv-010',
    number: 'INV-2025-010',
    customer: 'مؤسسة التميز للخدمات',
    customerId: 'C005',
    date: '2025-02-20',
    dueDate: '2025-03-20',
    amount: 1800,
    tax: 270,
    total: 2070,
    paidAmount: 0,
    status: 'overdue',
    paymentMethod: 'credit',
    items: [
      { description: 'ورق A4 (رزمة)', productId: 'P002', qty: 40, price: 22, total: 880 },
      { description: 'حبر طابعة HP (أسود)', productId: 'P001', qty: 8, price: 85, total: 680 },
      { description: 'دباسة مكتبية', productId: 'P004', qty: 8, price: 35, total: 280 },
    ],
    createdBy: 'فهد',
  },
]
