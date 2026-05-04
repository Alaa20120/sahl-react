export type TxType = 'in' | 'out'
export type TxCategory = 'invoice' | 'expense' | 'salary' | 'purchase' | 'transfer' | 'other'

export interface Transaction {
  id: string
  date: string
  description: string
  type: TxType
  category: TxCategory
  amount: number
  balance: number
  ref?: string
  account: string
}

export const ACCOUNTS = [
  { id: 'cash', label: 'الصندوق النقدي', balance: 48200, icon: 'fa-money-bill-wave', color: '#10B981' },
  { id: 'bank1', label: 'البنك الأهلي', balance: 186400, icon: 'fa-university', color: '#2563EB' },
  { id: 'bank2', label: 'بنك الراجحي', balance: 77800, icon: 'fa-university', color: '#7C3AED' },
]

export const TRANSACTIONS: Transaction[] = [
  { id: 'TX-2025-041', date: '2025-04-16', description: 'دفعة فاتورة INV-2025-008', type: 'in',  category: 'invoice',   amount: 7475,  balance: 312400, ref: 'INV-2025-008', account: 'bank1' },
  { id: 'TX-2025-040', date: '2025-04-15', description: 'رواتب الموظفين — أبريل',  type: 'out', category: 'salary',    amount: 68500, balance: 304925, account: 'bank1' },
  { id: 'TX-2025-039', date: '2025-04-14', description: 'مشتريات مكتبية',           type: 'out', category: 'expense',   amount: 1200,  balance: 373425, account: 'cash' },
  { id: 'TX-2025-038', date: '2025-04-13', description: 'دفعة فاتورة INV-2025-005', type: 'in',  category: 'invoice',   amount: 25300, balance: 374625, ref: 'INV-2025-005', account: 'bank1' },
  { id: 'TX-2025-037', date: '2025-04-12', description: 'فاتورة موردين — طباعة',    type: 'out', category: 'purchase',  amount: 8900,  balance: 349325, account: 'bank2' },
  { id: 'TX-2025-036', date: '2025-04-11', description: 'تحويل داخلي — صندوق',      type: 'in',  category: 'transfer',  amount: 10000, balance: 358225, account: 'cash' },
  { id: 'TX-2025-035', date: '2025-04-11', description: 'تحويل داخلي — بنك',        type: 'out', category: 'transfer',  amount: 10000, balance: 348225, account: 'bank1' },
  { id: 'TX-2025-034', date: '2025-04-10', description: 'إيجار المكتب — أبريل',     type: 'out', category: 'expense',   amount: 12000, balance: 358225, account: 'bank1' },
  { id: 'TX-2025-033', date: '2025-04-09', description: 'دفعة عميل — مجموعة النخبة',type: 'in',  category: 'invoice',   amount: 6210,  balance: 370225, account: 'cash' },
  { id: 'TX-2025-032', date: '2025-04-08', description: 'اشتراك منصة سحابية',       type: 'out', category: 'expense',   amount: 580,   balance: 364015, account: 'bank2' },
  { id: 'TX-2025-031', date: '2025-04-07', description: 'دفعة دفعة مقدمة — مشروع', type: 'in',  category: 'invoice',   amount: 42000, balance: 364595, account: 'bank1' },
  { id: 'TX-2025-030', date: '2025-04-06', description: 'صيانة أجهزة الكمبيوتر',   type: 'out', category: 'expense',   amount: 2400,  balance: 322595, account: 'cash' },
]

export const TREASURY_STATS = {
  totalBalance: 312400,
  totalIn: 81000,
  totalOut: 93580,
  cashBalance: 48200,
  bankBalance: 264200,
}
