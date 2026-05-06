export type TxType = 'in' | 'out'
export type TxCategory = 'invoice' | 'expense' | 'salary' | 'purchase' | 'transfer' | 'collection' | 'other'

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
  { id: 'cash', label: 'الصندوق النقدي', balance: 124750, icon: 'fa-money-bill-wave', color: '#10B981' },
  { id: 'bank', label: 'البنك الأهلي', balance: 285400, icon: 'fa-building-columns', color: '#2563EB' },
  { id: 'pos', label: 'جهاز نقاط البيع', balance: 45600, icon: 'fa-credit-card', color: '#7C3AED' },
]

export const TRANSACTIONS: Transaction[] = [
  // Inflows
  { id: 'TX-2025-001', date: '2025-04-15', description: 'تحصيل فاتورة INV-2025-001 - شركة الرواد', type: 'in', category: 'invoice', amount: 4887.5, balance: 4887.5, ref: 'INV-2025-001', account: 'cash' },
  { id: 'TX-2025-002', date: '2025-04-18', description: 'تحصيل فاتورة INV-2025-002 - الإبداع الرقمي', type: 'in', category: 'invoice', amount: 7820, balance: 12707.5, ref: 'INV-2025-002', account: 'bank' },
  { id: 'TX-2025-003', date: '2025-04-20', description: 'دفعة جزئية فاتورة INV-2025-003', type: 'in', category: 'invoice', amount: 10000, balance: 22707.5, ref: 'INV-2025-003', account: 'bank' },
  { id: 'TX-2025-004', date: '2025-04-25', description: 'تحصيل فاتورة INV-2025-005 - التميز', type: 'in', category: 'invoice', amount: 2415, balance: 25122.5, ref: 'INV-2025-005', account: 'cash' },
  { id: 'TX-2025-005', date: '2025-03-15', description: 'تحصيل فاتورة INV-2025-007 - الإبداع الرقمي', type: 'in', category: 'invoice', amount: 6440, balance: 31562.5, ref: 'INV-2025-007', account: 'cash' },
  { id: 'TX-2025-006', date: '2025-04-22', description: 'مبيعات نقدية - نقطة البيع', type: 'in', category: 'invoice', amount: 8500, balance: 40100, ref: 'POS-2025-0422', account: 'pos' },
  { id: 'TX-2025-007', date: '2025-04-28', description: 'مبيعات نقدية - نقطة البيع', type: 'in', category: 'invoice', amount: 12300, balance: 52400, ref: 'POS-2025-0428', account: 'pos' },
  { id: 'TX-2025-008', date: '2025-03-20', description: 'مبيعات نقدية - نقطة البيع', type: 'in', category: 'invoice', amount: 7200, balance: 59600, ref: 'POS-2025-0320', account: 'pos' },
  { id: 'TX-2025-009', date: '2025-03-25', description: 'مبيعات نقدية - نقطة البيع', type: 'in', category: 'invoice', amount: 9800, balance: 69400, ref: 'POS-2025-0325', account: 'pos' },
  { id: 'TX-2025-010', date: '2025-02-18', description: 'مبيعات نقدية - نقطة البيع', type: 'in', category: 'invoice', amount: 6500, balance: 75900, ref: 'POS-2025-0218', account: 'pos' },

  // Outflows
  { id: 'TX-2025-011', date: '2025-04-01', description: 'صرف رواتب شهر أبريل', type: 'out', category: 'salary', amount: 145800, balance: -69900, ref: 'SAL-2025-04', account: 'bank' },
  { id: 'TX-2025-012', date: '2025-04-05', description: 'دفع إيجار المكتب', type: 'out', category: 'expense', amount: 12000, balance: -81900, ref: 'EXP-009', account: 'bank' },
  { id: 'TX-2025-013', date: '2025-04-10', description: 'مصروفات نقل وتنقل', type: 'out', category: 'expense', amount: 2800, balance: -84700, ref: 'EXP-010', account: 'cash' },
  { id: 'TX-2025-014', date: '2025-04-12', description: 'حملة إعلانية', type: 'out', category: 'expense', amount: 8500, balance: -93200, ref: 'EXP-011', account: 'bank' },
  { id: 'TX-2025-015', date: '2025-04-15', description: 'اشتراكات برامج', type: 'out', category: 'expense', amount: 3200, balance: -96400, ref: 'EXP-012', account: 'bank' },
  { id: 'TX-2025-016', date: '2025-04-18', description: 'ضيافة عملاء', type: 'out', category: 'expense', amount: 1500, balance: -97900, ref: 'EXP-013', account: 'cash' },
  { id: 'TX-2025-017', date: '2025-04-20', description: 'فواتير اتصالات', type: 'out', category: 'expense', amount: 2200, balance: -100100, ref: 'EXP-014', account: 'bank' },
  { id: 'TX-2025-018', date: '2025-04-22', description: 'صيانة أجهزة', type: 'out', category: 'expense', amount: 3800, balance: -103900, ref: 'EXP-015', account: 'bank' },
  { id: 'TX-2025-019', date: '2025-04-25', description: 'تأجير سيارات توصيل', type: 'out', category: 'expense', amount: 4500, balance: -108400, ref: 'EXP-016', account: 'cash' },
  { id: 'TX-2025-020', date: '2025-04-28', description: 'طباعة بروشورات', type: 'out', category: 'expense', amount: 4200, balance: -112600, ref: 'EXP-017', account: 'bank' },
  { id: 'TX-2025-021', date: '2025-03-05', description: 'دفع إيجار المكتب - مارس', type: 'out', category: 'expense', amount: 12000, balance: -124600, ref: 'EXP-018', account: 'bank' },
  { id: 'TX-2025-022', date: '2025-03-10', description: 'شراء طابعات وأحبار', type: 'out', category: 'purchase', amount: 6500, balance: -131100, ref: 'EXP-019', account: 'bank' },
  { id: 'TX-2025-023', date: '2025-03-01', description: 'صرف رواتب شهر مارس', type: 'out', category: 'salary', amount: 145800, balance: -276900, ref: 'SAL-2025-03', account: 'bank' },
]
