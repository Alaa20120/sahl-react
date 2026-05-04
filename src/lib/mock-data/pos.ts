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

export const POS_PRODUCTS: POSProduct[] = [
  { id: 'P001', name: 'ورق A4 (رزمة)',          price: 22,   category: 'مكتبية',   stock: 48, barcode: '6281234560001' },
  { id: 'P002', name: 'قلم جاف أزرق',           price: 3,    category: 'مكتبية',   stock: 120,barcode: '6281234560002' },
  { id: 'P003', name: 'ملف بلاستيكي A4',         price: 8,    category: 'مكتبية',   stock: 65, barcode: '6281234560003' },
  { id: 'P004', name: 'دباسة مكتبية',            price: 35,   category: 'أدوات',    stock: 18, barcode: '6281234560004' },
  { id: 'P005', name: 'حبر طابعة HP (أسود)',     price: 85,   category: 'طباعة',    stock: 8,  barcode: '6281234560005' },
  { id: 'P006', name: 'حبر طابعة HP (ألوان)',    price: 110,  category: 'طباعة',    stock: 5,  barcode: '6281234560006' },
  { id: 'P007', name: 'مقص مكتبي كبير',          price: 18,   category: 'أدوات',    stock: 22, barcode: '6281234560007' },
  { id: 'P008', name: 'لاصق لاصق شفاف',          price: 6,    category: 'مكتبية',   stock: 90, barcode: '6281234560008' },
  { id: 'P009', name: 'مسطرة معدنية 30سم',       price: 12,   category: 'أدوات',    stock: 40, barcode: '6281234560009' },
  { id: 'P010', name: 'كرتون أرشفة كبير',        price: 15,   category: 'تخزين',    stock: 35, barcode: '6281234560010' },
  { id: 'P011', name: 'علبة أقلام ملونة',        price: 45,   category: 'مكتبية',   stock: 30, barcode: '6281234560011' },
  { id: 'P012', name: 'لوحة عرض بيضاء',          price: 280,  category: 'أدوات',    stock: 4,  barcode: '6281234560012' },
]

export const POS_CATEGORIES = ['الكل', 'مكتبية', 'أدوات', 'طباعة', 'تخزين']

export const RECENT_SALES: POSSale[] = [
  { id: 'S-1042', date: '2025-04-16 14:23', items: 5, total: 187,  payment: 'cash',     cashier: 'أحمد' },
  { id: 'S-1041', date: '2025-04-16 12:10', items: 2, total: 95,   payment: 'card',     cashier: 'سارة' },
  { id: 'S-1040', date: '2025-04-16 10:45', items: 8, total: 342,  payment: 'cash',     cashier: 'أحمد' },
  { id: 'S-1039', date: '2025-04-15 16:30', items: 1, total: 280,  payment: 'transfer', cashier: 'محمد' },
  { id: 'S-1038', date: '2025-04-15 14:00', items: 3, total: 124,  payment: 'card',     cashier: 'سارة' },
]

export const POS_STATS = {
  todaySales: 624,
  todayTransactions: 3,
  monthSales: 18420,
  avgTicket: 208,
}
