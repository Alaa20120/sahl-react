export const DASHBOARD_STATS = {
  revenue: 284500,
  revenueChange: 12.4,
  expenses: 98200,
  expensesChange: -3.1,
  profit: 186300,
  profitChange: 18.7,
  cashBalance: 312400,
  cashChange: 5.2,
  pendingInvoices: 47650,
  overdueInvoices: 78050,
  newCustomers: 14,
  activeEmployees: 48,
}

export const MONTHLY_DATA = [
  { month: 'يوليو', revenue: 180000, expenses: 72000 },
  { month: 'أغسطس', revenue: 210000, expenses: 85000 },
  { month: 'سبتمبر', revenue: 195000, expenses: 78000 },
  { month: 'أكتوبر', revenue: 240000, expenses: 92000 },
  { month: 'نوفمبر', revenue: 228000, expenses: 88000 },
  { month: 'ديسمبر', revenue: 265000, expenses: 96000 },
  { month: 'يناير', revenue: 252000, expenses: 91000 },
  { month: 'فبراير', revenue: 238000, expenses: 87000 },
  { month: 'مارس', revenue: 271000, expenses: 94000 },
  { month: 'أبريل', revenue: 284500, expenses: 98200 },
]

export const RECENT_INVOICES = [
  { id: 'INV-2025-008', customer: 'مؤسسة الإبداع الرقمي', amount: 7475, status: 'paid' as const, date: '2025-04-16' },
  { id: 'INV-2025-007', customer: 'شركة الرواد', amount: 54050, status: 'overdue' as const, date: '2025-03-20' },
  { id: 'INV-2025-006', customer: 'مؤسسة التميز', amount: 11270, status: 'pending' as const, date: '2025-04-14' },
  { id: 'INV-2025-005', customer: 'شركة البناء الحديث', amount: 25300, status: 'paid' as const, date: '2025-04-12' },
  { id: 'INV-2025-004', customer: 'مجموعة النخبة', amount: 6210, status: 'draft' as const, date: '2025-04-10' },
]

export const AI_INSIGHTS = [
  { icon: 'fa-arrow-trend-up', color: '#10B981', text: 'المبيعات ارتفعت 12.4% هذا الشهر مقارنة بالشهر الماضي' },
  { icon: 'fa-triangle-exclamation', color: '#F59E0B', text: '3 فواتير متأخرة بإجمالي 78,050 ر.س — يحتاج متابعة' },
  { icon: 'fa-box-open', color: '#EF4444', text: 'صنفان وصلا للحد الأدنى: طابعة HP و حبر طابعة' },
  { icon: 'fa-users', color: '#2563EB', text: '14 عميل جديد هذا الشهر — أعلى رقم في 2025' },
]
