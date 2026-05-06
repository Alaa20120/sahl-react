// ─── Types ────────────────────────────────────────────────────
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
  totalSales: number      // إجمالي فواتير البيع
  totalPurchases: number  // إجمالي فواتير الشراء
  collected: number       // إجمالي المحصّل من فواتير البيع
  balance: number         // الرصيد = المحصّل - المصروفات - السحوبات (للتوافق)
  externalCredit: number  // إجمالي الآجل المتبقي
  expenses: number        // إجمالي المصروفات
  companyEntrusted: number // عهدة بضاعة الشركة (للتوافق)
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

// ─── Mock Data ────────────────────────────────────────────────
export const DELEGATES: Delegate[] = [
  {
    id: 'DEL-001',
    name: 'فهد سالم الدوسري',
    phone: '0504444444',
    email: 'fahd@company.sa',
    zone: 'الرياض - الشمال',
    status: 'active',
    username: 'fahd.dosari',
    password: 'fahd123',
    avatar: 'فد',
    location: { lat: 24.774265, lng: 46.738586, address: 'حي العليا، الرياض', timestamp: '2025-05-05T08:30:00Z' },
    locationHistory: [
      { lat: 24.774265, lng: 46.738586, address: 'حي العليا، الرياض', timestamp: '2025-05-05T08:30:00Z' },
      { lat: 24.768, lng: 46.72, address: 'حي الملز، الرياض', timestamp: '2025-05-05T10:15:00Z' },
    ],
    warehouse: [
      { id: 'WH-001', productId: 'P001', productName: 'حبر طابعة HP (أسود)', productSku: 'HP-INK-BLK', qty: 20, costPrice: 45, receivedDate: '2025-04-01', status: 'in-stock', source: 'company' },
      { id: 'WH-002', productId: 'P002', productName: 'ورق A4 (رزمة)', productSku: 'PAPER-A4-500', qty: 100, costPrice: 12, receivedDate: '2025-04-01', status: 'in-stock', source: 'company' },
      { id: 'WH-003', productId: 'P004', productName: 'دباسة مكتبية', productSku: 'STAPLER-STD', qty: 15, costPrice: 18, receivedDate: '2025-04-05', status: 'in-stock', source: 'company' },
    ],
    invoices: [
      {
        id: 'DINV-001', number: 'D-2025-001', date: '2025-04-15', type: 'sale', party: 'شركة الرواد التجارية',
        items: [
          { description: 'حبر طابعة HP (أسود)', qty: 10, price: 85, total: 850 },
          { description: 'ورق A4 (رزمة)', qty: 50, price: 22, total: 1100 },
        ],
        subtotal: 1950, tax: 292.5, total: 2242.5, status: 'paid',
      },
      {
        id: 'DINV-002', number: 'D-2025-002', date: '2025-04-18', type: 'purchase', party: 'مؤسسة التقنية المتقدمة',
        items: [
          { description: 'حبر طابعة HP (أسود)', qty: 30, price: 40, total: 1200 },
        ],
        subtotal: 1200, tax: 180, total: 1380, status: 'pending',
      },
    ],
    transactions: [
      { id: 'TRX-001', date: '2025-04-15', type: 'collection', amount: 2242.5, description: 'تحصيل فاتورة D-2025-001', reference: 'D-2025-001', balanceAfter: 2242.5 },
      { id: 'TRX-002', date: '2025-04-20', type: 'expense', amount: -150, description: 'مصروفات نقل', balanceAfter: 2092.5 },
    ],
    stats: { totalSales: 2242.5, totalPurchases: 1380, collected: 2242.5, balance: 2092.5, externalCredit: 0, expenses: 150, companyEntrusted: 2000 },
  },
  {
    id: 'DEL-002',
    name: 'عبدالعزيز ناصر الشمري',
    phone: '0508888888',
    email: 'aziz@company.sa',
    zone: 'جدة - الغرب',
    status: 'active',
    username: 'aziz.shammari',
    password: 'aziz123',
    avatar: 'عش',
    location: { lat: 21.543333, lng: 39.172779, address: 'حي الصفا، جدة', timestamp: '2025-05-05T09:00:00Z' },
    locationHistory: [
      { lat: 21.543333, lng: 39.172779, address: 'حي الصفا، جدة', timestamp: '2025-05-05T09:00:00Z' },
    ],
    warehouse: [
      { id: 'WH-004', productId: 'P006', productName: 'لابتوب Dell 15 بوصة', productSku: 'LAPTOP-DELL-15', qty: 3, costPrice: 2800, receivedDate: '2025-04-10', status: 'in-stock', source: 'company' },
      { id: 'WH-005', productId: 'P007', productName: 'ماوس لوجيتك MX', productSku: 'MOUSE-LOG-MX', qty: 10, costPrice: 220, receivedDate: '2025-04-10', status: 'in-stock', source: 'company' },
    ],
    invoices: [
      {
        id: 'DINV-003', number: 'D-2025-003', date: '2025-04-22', type: 'sale', party: 'مجموعة النخبة',
        items: [
          { description: 'لابتوب Dell 15 بوصة', qty: 1, price: 3500, total: 3500 },
          { description: 'ماوس لوجيتك MX', qty: 3, price: 350, total: 1050 },
        ],
        subtotal: 4550, tax: 682.5, total: 5232.5, status: 'pending',
      },
    ],
    transactions: [],
    stats: { totalSales: 5232.5, totalPurchases: 0, collected: 0, balance: 0, externalCredit: 5232.5, expenses: 0, companyEntrusted: 15000 },
  },
]

// ─── Helpers ──────────────────────────────────────────────────
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
