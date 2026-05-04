export type PurchaseStatus = 'received' | 'pending' | 'partial' | 'cancelled' | 'voided'

export interface PurchaseItem {
  description: string
  qty: number
  price: number
  total: number
}

export interface Purchase {
  id: string
  date: string
  dueDate: string
  supplier: string
  supplierVat?: string
  itemCount: number
  total: number
  tax: number
  amount: number
  paid: number
  status: PurchaseStatus
  lineItems: PurchaseItem[]
}

export const PURCHASES: Purchase[] = [
  {
    id: 'PO-2025-018', date: '2025-04-15', dueDate: '2025-04-20',
    supplier: 'شركة المستلزمات المكتبية', supplierVat: '300112345600003',
    itemCount: 3, amount: 7739, tax: 1161, total: 8900, paid: 8900, status: 'received',
    lineItems: [
      { description: 'ورق طباعة A4 (رزمة 500 ورقة)', qty: 50, price: 35,  total: 1750 },
      { description: 'أقلام حبر زرقاء (علبة 12)',      qty: 20, price: 22,  total: 440  },
      { description: 'ملفات تجميع A4 (علبة 50)',       qty: 30, price: 18.3, total: 549 },
    ],
  },
  {
    id: 'PO-2025-017', date: '2025-04-13', dueDate: '2025-04-25',
    supplier: 'مؤسسة الطباعة الحديثة', supplierVat: '300987654300003',
    itemCount: 2, amount: 3652, tax: 548, total: 4200, paid: 2000, status: 'partial',
    lineItems: [
      { description: 'خراطيش حبر HP 85A (علبة 4)',  qty: 8,  price: 285, total: 2280 },
      { description: 'خراطيش حبر Canon CRG-045',    qty: 6,  price: 195, total: 1170 },
    ],
  },
  {
    id: 'PO-2025-016', date: '2025-04-10', dueDate: '2025-04-30',
    supplier: 'شركة التقنية للحلول', supplierVat: '300456789100003',
    itemCount: 2, amount: 13565, tax: 2035, total: 15600, paid: 0, status: 'pending',
    lineItems: [
      { description: 'لابتوب Dell Latitude 5540',   qty: 2, price: 5200, total: 10400 },
      { description: 'شاشة Dell 27" P2725H',        qty: 3, price: 1055, total: 3165  },
    ],
  },
  {
    id: 'PO-2025-015', date: '2025-04-08', dueDate: '2025-04-15',
    supplier: 'مؤسسة الخدمات اللوجستية', supplierVat: '300321654900003',
    itemCount: 3, amount: 5478, tax: 822, total: 6300, paid: 6300, status: 'received',
    lineItems: [
      { description: 'خدمة شحن داخلي — الرياض إلى جدة', qty: 5,  price: 350,  total: 1750 },
      { description: 'خدمة تغليف مواد',                  qty: 20, price: 85,   total: 1700 },
      { description: 'رسوم مناولة وتخزين',               qty: 1,  price: 2028, total: 2028 },
    ],
  },
  {
    id: 'PO-2025-014', date: '2025-04-05', dueDate: '2025-04-12',
    supplier: 'شركة المستلزمات المكتبية', supplierVat: '300112345600003',
    itemCount: 4, amount: 10783, tax: 1617, total: 12400, paid: 12400, status: 'received',
    lineItems: [
      { description: 'كراسي مكتبية مع مسند ظهر',    qty: 5,  price: 750,  total: 3750 },
      { description: 'طاولات مكتبية خشبية 160×80',  qty: 3,  price: 1200, total: 3600 },
      { description: 'أرفف تخزين معدنية',            qty: 4,  price: 420,  total: 1680 },
      { description: 'لوح عرض مغناطيسي',             qty: 2,  price: 876,  total: 1752 },
    ],
  },
  {
    id: 'PO-2025-013', date: '2025-04-02', dueDate: '2025-05-02',
    supplier: 'مورد الأجهزة والمعدات', supplierVat: '300654321200003',
    itemCount: 2, amount: 29565, tax: 4435, total: 34000, paid: 17000, status: 'partial',
    lineItems: [
      { description: 'سيرفر HP ProLiant DL380 Gen10',  qty: 1, price: 22000, total: 22000 },
      { description: 'مفتاح شبكة Cisco 24-Port PoE+',  qty: 2, price: 3782,  total: 7565  },
    ],
  },
  {
    id: 'PO-2025-012', date: '2025-03-28', dueDate: '2025-04-05',
    supplier: 'مؤسسة الطباعة الحديثة', supplierVat: '300987654300003',
    itemCount: 2, amount: 3304, tax: 496, total: 3800, paid: 0, status: 'cancelled',
    lineItems: [
      { description: 'ورق لاصق ملون (رول A4)',  qty: 10, price: 180, total: 1800 },
      { description: 'ورق بروشور لامع 130g',    qty: 8,  price: 188, total: 1504 },
    ],
  },
]

export const PURCHASE_STATS = {
  total: 85200,
  paid: 46600,
  pending: 38600,
  suppliersCount: 5,
}
