export type UserRole = 'admin' | 'accountant' | 'cashier' | 'sales' | 'hr' | 'viewer'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLogin: string
  branch: string
  avatar?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير النظام',
  accountant: 'محاسب',
  cashier: 'أمين صندوق',
  sales: 'مبيعات',
  hr: 'موارد بشرية',
  viewer: 'عرض فقط',
}

export const USERS: AppUser[] = [
  { id: 'U001', name: 'أحمد محمد السعيد',   email: 'ahmed@sahl.sa',   role: 'admin',      status: 'active',    lastLogin: '2025-04-16', branch: 'الرئيسي' },
  { id: 'U002', name: 'سارة عبدالله العمري', email: 'sara@sahl.sa',    role: 'accountant', status: 'active',    lastLogin: '2025-04-16', branch: 'الرئيسي' },
  { id: 'U003', name: 'محمد خالد الغامدي',   email: 'moh@sahl.sa',     role: 'sales',      status: 'active',    lastLogin: '2025-04-15', branch: 'الفرع الشمالي' },
  { id: 'U004', name: 'نورة سعد الزهراني',   email: 'noura@sahl.sa',   role: 'hr',         status: 'active',    lastLogin: '2025-04-14', branch: 'الرئيسي' },
  { id: 'U005', name: 'خالد عمر المطيري',    email: 'khalid@sahl.sa',  role: 'cashier',    status: 'active',    lastLogin: '2025-04-16', branch: 'الرئيسي' },
  { id: 'U006', name: 'ريم فهد الحربي',      email: 'reem@sahl.sa',    role: 'sales',      status: 'inactive',  lastLogin: '2025-03-20', branch: 'الفرع الجنوبي' },
  { id: 'U007', name: 'عبدالله ناصر الدوسري',email: 'abd@sahl.sa',     role: 'viewer',     status: 'active',    lastLogin: '2025-04-10', branch: 'الرئيسي' },
  { id: 'U008', name: 'هدى محمد القحطاني',   email: 'huda@sahl.sa',    role: 'accountant', status: 'suspended', lastLogin: '2025-02-15', branch: 'الفرع الشمالي' },
]

export const USER_STATS = {
  total: 8,
  active: 6,
  inactive: 1,
  suspended: 1,
}
