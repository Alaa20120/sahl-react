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

export const USERS: AppUser[] = []

export const USER_STATS = {
  total: 0,
  active: 0,
  inactive: 0,
  suspended: 0,
}
