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

export const EXPENSE_CATEGORIES = ['الكل', 'مكتبية', 'نقل وتنقل', 'ضيافة', 'إيجار', 'صيانة', 'اتصالات', 'رواتب', 'تسويق', 'أخرى']

export const EXPENSES: Expense[] = [
  { id: 'EXP-001', date: '2025-05-01', employee: 'أحمد محمد العلي', category: 'رواتب', description: 'راتب شهر أبريل - أحمد محمد العلي', amount: 28500, type: 'expense', status: 'approved' },
  { id: 'EXP-002', date: '2025-05-01', employee: 'خالد عبدالرحمن', category: 'رواتب', description: 'راتب شهر أبريل - خالد عبدالرحمن', amount: 20300, type: 'expense', status: 'approved' },
  { id: 'EXP-003', date: '2025-05-01', employee: 'سارة أحمد الفهد', category: 'رواتب', description: 'راتب شهر أبريل - سارة أحمد الفهد', amount: 16500, type: 'expense', status: 'approved' },
  { id: 'EXP-004', date: '2025-05-01', employee: 'فهد سالم الدوسري', category: 'رواتب', description: 'راتب شهر أبريل - فهد سالم الدوسري', amount: 13200, type: 'expense', status: 'approved' },
  { id: 'EXP-005', date: '2025-05-01', employee: 'نورة عبدالله القحطاني', category: 'رواتب', description: 'راتب شهر أبريل - نورة عبدالله القحطاني', amount: 15900, type: 'expense', status: 'approved' },
  { id: 'EXP-006', date: '2025-05-01', employee: 'محمد سلمان الحربي', category: 'رواتب', description: 'راتب شهر أبريل - محمد سلمان الحربي', amount: 24600, type: 'expense', status: 'approved' },
  { id: 'EXP-007', date: '2025-05-01', employee: 'لينا يوسف الحميد', category: 'رواتب', description: 'راتب شهر أبريل - لينا يوسف الحميد', amount: 14550, type: 'expense', status: 'approved' },
  { id: 'EXP-008', date: '2025-05-01', employee: 'عبدالعزيز ناصر الشمري', category: 'رواتب', description: 'راتب شهر أبريل - عبدالعزيز ناصر الشمري', amount: 12250, type: 'expense', status: 'approved' },
  { id: 'EXP-009', date: '2025-04-05', employee: 'سارة أحمد الفهد', category: 'إيجار', description: 'إيجار المكتب الشهري - أبريل', amount: 12000, type: 'expense', status: 'approved' },
  { id: 'EXP-010', date: '2025-04-10', employee: 'خالد عبدالرحمن', category: 'نقل وتنقل', description: 'بنزين ومواصلات مندوبين', amount: 2800, type: 'expense', status: 'approved' },
  { id: 'EXP-011', date: '2025-04-12', employee: 'لينا يوسف الحميد', category: 'تسويق', description: 'حملة إعلانية على وسائل التواصل', amount: 8500, type: 'expense', status: 'approved' },
  { id: 'EXP-012', date: '2025-04-15', employee: 'محمد سلمان الحربي', category: 'مكتبية', description: 'اشتراك برامج وتطبيقات شهرية', amount: 3200, type: 'expense', status: 'approved' },
  { id: 'EXP-013', date: '2025-04-18', employee: 'فهد سالم الدوسري', category: 'ضيافة', description: 'ضيافة عملاء - اجتماعات المبيعات', amount: 1500, type: 'expense', status: 'approved' },
  { id: 'EXP-014', date: '2025-04-20', employee: 'نورة عبدالله القحطاني', category: 'اتصالات', description: 'فواتير الإنترنت والهاتف', amount: 2200, type: 'expense', status: 'approved' },
  { id: 'EXP-015', date: '2025-04-22', employee: 'أحمد محمد العلي', category: 'صيانة', description: 'صيانة أجهزة الطابعات والحواسيب', amount: 3800, type: 'expense', status: 'approved' },
  { id: 'EXP-016', date: '2025-04-25', employee: 'خالد عبدالرحمن', category: 'نقل وتنقل', description: 'تأجير سيارات لتوصيل الطلبات', amount: 4500, type: 'expense', status: 'approved' },
  { id: 'EXP-017', date: '2025-04-28', employee: 'لينا يوسف الحميد', category: 'تسويق', description: 'طباعة بروشورات وهدايا ترويجية', amount: 4200, type: 'expense', status: 'approved' },
  { id: 'EXP-018', date: '2025-03-05', employee: 'سارة أحمد الفهد', category: 'إيجار', description: 'إيجار المكتب الشهري - مارس', amount: 12000, type: 'expense', status: 'approved' },
  { id: 'EXP-019', date: '2025-03-10', employee: 'محمد سلمان الحربي', category: 'مكتبية', description: 'شراء طابعات وأحبار', amount: 6500, type: 'expense', status: 'approved' },
  { id: 'EXP-020', date: '2025-03-15', employee: 'فهد سالم الدوسري', category: 'ضيافة', description: 'ضيافة معرض مبيعات الربيع', amount: 3200, type: 'expense', status: 'approved' },
]

// ── Computed stats from actual EXPENSES data ──────────────────────────
const now = new Date()
const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM

function computeExpenseStats(expenses: Expense[]) {
  return {
    totalExpenses: expenses.filter(e => e.type === 'expense' && e.status === 'approved').reduce((s, e) => s + e.amount, 0),
    totalAdvances: expenses.filter(e => e.type === 'advance' && e.status === 'approved').reduce((s, e) => s + e.amount, 0),
    pendingCount: expenses.filter(e => e.status === 'pending').length,
    approvedThisMonth: expenses.filter(e => e.status === 'approved' && e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0),
  }
}

export const EXPENSE_STATS = computeExpenseStats(EXPENSES)
