export type EmployeeStatus = 'active' | 'leave' | 'inactive'

export interface Employee {
  id: string
  name: string
  position: string
  department: string
  salary: number
  allowances: number
  deductions: number
  netSalary: number
  phone: string
  email: string
  iqama?: string
  joinDate: string
  status: EmployeeStatus
}

export const EMPLOYEES: Employee[] = []

export const DEPARTMENTS = ['الكل', 'المبيعات', 'المالية', 'التقنية', 'HR', 'التسويق', 'العمليات', 'الإدارة']
