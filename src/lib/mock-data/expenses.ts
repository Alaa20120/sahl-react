export type ExpenseStatus = 'approved' | 'pending' | 'rejected'
export type ExpenseType = 'expense' | 'advance'

export interface Expense {
  id: string
  date: string
  employee: string
  category: string
  description: string
  amount: number
  type: ExpenseType
  status: ExpenseStatus
}

export const EXPENSE_CATEGORIES = ['الكل', 'مكتبية', 'نقل وتنقل', 'ضيافة', 'إيجار', 'صيانة', 'اتصالات', 'أخرى']

export const EXPENSES: Expense[] = [
  { id: 'EXP-041', date: '2025-04-16', employee: 'أحمد سعيد',       category: 'نقل وتنقل', description: 'بنزين ورحلات عمل',       amount: 850,   type: 'expense',  status: 'approved' },
  { id: 'EXP-040', date: '2025-04-15', employee: 'سارة العمري',     category: 'ضيافة',     description: 'غداء اجتماع عملاء',      amount: 420,   type: 'expense',  status: 'approved' },
  { id: 'EXP-039', date: '2025-04-14', employee: 'محمد الغامدي',    category: 'مكتبية',    description: 'قرطاسية ومستلزمات',      amount: 310,   type: 'expense',  status: 'pending'  },
  { id: 'EXP-038', date: '2025-04-13', employee: 'نورة الزهراني',   category: 'اتصالات',   description: 'فاتورة هاتف شهرية',      amount: 180,   type: 'expense',  status: 'approved' },
  { id: 'ADV-012', date: '2025-04-12', employee: 'خالد المطيري',    category: 'أخرى',      description: 'سلفة شهرية',              amount: 3000,  type: 'advance',  status: 'approved' },
  { id: 'EXP-037', date: '2025-04-11', employee: 'أحمد سعيد',       category: 'صيانة',     description: 'إصلاح طابعة المكتب',     amount: 600,   type: 'expense',  status: 'approved' },
  { id: 'EXP-036', date: '2025-04-10', employee: 'ريم الحربي',      category: 'نقل وتنقل', description: 'أجرة زيارة عملاء',       amount: 220,   type: 'expense',  status: 'pending'  },
  { id: 'ADV-011', date: '2025-04-09', employee: 'سارة العمري',     category: 'أخرى',      description: 'سلفة طارئة',              amount: 1500,  type: 'advance',  status: 'pending'  },
  { id: 'EXP-035', date: '2025-04-08', employee: 'محمد الغامدي',    category: 'ضيافة',     description: 'قهوة وضيافة عملاء',      amount: 380,   type: 'expense',  status: 'rejected' },
  { id: 'EXP-034', date: '2025-04-07', employee: 'خالد المطيري',    category: 'مكتبية',    description: 'أوراق وأحبار طباعة',     amount: 450,   type: 'expense',  status: 'approved' },
]

export const EXPENSE_STATS = {
  totalExpenses: 7910,
  totalAdvances: 4500,
  pendingCount: 3,
  approvedThisMonth: 3410,
}
