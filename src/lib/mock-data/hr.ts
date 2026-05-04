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

export const EMPLOYEES: Employee[] = [
  { id: '1', name: 'أحمد محمد الشهري', position: 'مدير المبيعات', department: 'المبيعات', salary: 12000, allowances: 2500, deductions: 1200, netSalary: 13300, phone: '0501234567', email: 'ahmed@company.sa', joinDate: '2020-03-01', status: 'active' },
  { id: '2', name: 'فاطمة علي القحطاني', position: 'محاسبة أولى', department: 'المالية', salary: 9500, allowances: 1800, deductions: 950, netSalary: 10350, phone: '0556789012', email: 'fatima@company.sa', joinDate: '2021-07-15', status: 'active' },
  { id: '3', name: 'محمد عبدالله الدوسري', position: 'مبرمج أول', department: 'التقنية', salary: 14000, allowances: 3000, deductions: 1400, netSalary: 15600, phone: '0534567890', email: 'mohammed@company.sa', joinDate: '2019-11-01', status: 'active' },
  { id: '4', name: 'نورة خالد السبيعي', position: 'موارد بشرية', department: 'HR', salary: 8000, allowances: 1500, deductions: 800, netSalary: 8700, phone: '0512345678', email: 'noura@company.sa', joinDate: '2022-02-10', status: 'leave' },
  { id: '5', name: 'عمر سعد الغامدي', position: 'مندوب مبيعات', department: 'المبيعات', salary: 7000, allowances: 2000, deductions: 700, netSalary: 8300, phone: '0567890123', email: 'omar@company.sa', joinDate: '2023-01-05', status: 'active' },
  { id: '6', name: 'ريم محمد العتيبي', position: 'مصممة جرافيك', department: 'التسويق', salary: 8500, allowances: 1600, deductions: 850, netSalary: 9250, phone: '0523456789', email: 'reem@company.sa', joinDate: '2022-09-20', status: 'active' },
]

export const DEPARTMENTS = ['الكل', 'المبيعات', 'المالية', 'التقنية', 'HR', 'التسويق', 'العمليات']
