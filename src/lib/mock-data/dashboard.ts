export const DASHBOARD_STATS = {
  revenue: 284500,
  revenueChange: 14.2,
  expenses: 186200,
  expensesChange: -3.5,
  profit: 98300,
  profitChange: 18.7,
  cashBalance: 455750,
  cashChange: 8.3,
  pendingInvoices: 3,
  overdueInvoices: 2,
  newCustomers: 7,
  activeEmployees: 8,
}

export const MONTHLY_DATA: { month: string; revenue: number; expenses: number }[] = [
  { month: 'أغسطس 2024', revenue: 185000, expenses: 142000 },
  { month: 'سبتمبر 2024', revenue: 192000, expenses: 148000 },
  { month: 'أكتوبر 2024', revenue: 210000, expenses: 155000 },
  { month: 'نوفمبر 2024', revenue: 225000, expenses: 160000 },
  { month: 'ديسمبر 2024', revenue: 238000, expenses: 165000 },
  { month: 'يناير 2025', revenue: 245000, expenses: 168000 },
  { month: 'فبراير 2025', revenue: 260000, expenses: 172000 },
  { month: 'مارس 2025', revenue: 275000, expenses: 178000 },
  { month: 'أبريل 2025', revenue: 310000, expenses: 185000 },
  { month: 'مايو 2025', revenue: 284500, expenses: 186200 },
]

export const RECENT_INVOICES: { id: string; customer: string; amount: number; status: 'paid' | 'overdue' | 'pending' | 'draft' | 'confirmed' | 'partial'; date: string }[] = [
  { id: 'INV-2025-010', customer: 'مؤسسة التميز للخدمات', amount: 2415, status: 'paid', date: '2025-04-25' },
  { id: 'INV-2025-009', customer: 'مجموعة النخبة', amount: 5175, status: 'draft', date: '2025-05-03' },
  { id: 'INV-2025-008', customer: 'شركة البناء الحديث', amount: 12880, status: 'confirmed', date: '2025-05-02' },
  { id: 'INV-2025-004', customer: 'مجموعة النخبة', amount: 3680, status: 'pending', date: '2025-04-22' },
  { id: 'INV-2025-003', customer: 'شركة البناء الحديث', amount: 17480, status: 'partial', date: '2025-04-20' },
  { id: 'INV-2025-002', customer: 'مؤسسة الإبداع الرقمي', amount: 7820, status: 'paid', date: '2025-04-18' },
]

export const AI_INSIGHTS: { icon: string; color: string; text: string }[] = [
  { icon: 'fa-arrow-trend-up', color: '#10B981', text: 'الإيرادات ارتفعت 14.2% مقارنة بالشهر الماضي — أداء ممتاز في قسم المبيعات' },
  { icon: 'fa-exclamation-triangle', color: '#F59E0B', text: 'فاتورتان متأخرتان على شركة البناء الحديث بقيمة 30,255 ر.س — يُنصح بمتابعة التحصيل' },
  { icon: 'fa-boxes-stacked', color: '#3B82F6', text: 'مخزون حبر طابعة HP منخفض (12 قطعة) — يُنصح بإعادة الطلب عند الوصول للحد الأدنى' },
  { icon: 'fa-users', color: '#8B5CF6', text: '7 عملاء جدد هذا الشهر — زيادة بنسبة 40% عن المتوسط الشهري' },
]
