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
  {
    id: 'EMP-001',
    name: 'أحمد محمد العلي',
    position: 'مدير عام',
    department: 'الإدارة',
    salary: 25000,
    allowances: 5000,
    deductions: 1500,
    netSalary: 28500,
    phone: '0501111111',
    email: 'ahmed@company.sa',
    iqama: '2001234567',
    joinDate: '2020-01-10',
    status: 'active',
  },
  {
    id: 'EMP-002',
    name: 'خالد عبدالرحمن',
    position: 'مدير مبيعات',
    department: 'المبيعات',
    salary: 18000,
    allowances: 3500,
    deductions: 1200,
    netSalary: 20300,
    phone: '0502222222',
    email: 'khaled@company.sa',
    iqama: '2002345678',
    joinDate: '2021-03-15',
    status: 'active',
  },
  {
    id: 'EMP-003',
    name: 'سارة أحمد الفهد',
    position: 'محاسبة',
    department: 'المالية',
    salary: 15000,
    allowances: 2500,
    deductions: 1000,
    netSalary: 16500,
    phone: '0503333333',
    email: 'sara@company.sa',
    iqama: '2003456789',
    joinDate: '2021-06-01',
    status: 'active',
  },
  {
    id: 'EMP-004',
    name: 'فهد سالم الدوسري',
    position: 'مندوب مبيعات',
    department: 'المبيعات',
    salary: 10000,
    allowances: 4000,
    deductions: 800,
    netSalary: 13200,
    phone: '0504444444',
    email: 'fahd@company.sa',
    iqama: '2004567890',
    joinDate: '2022-01-20',
    status: 'active',
  },
  {
    id: 'EMP-005',
    name: 'نورة عبدالله القحطاني',
    position: 'أخصائية موارد بشرية',
    department: 'HR',
    salary: 14000,
    allowances: 3000,
    deductions: 1100,
    netSalary: 15900,
    phone: '0505555555',
    email: 'noura@company.sa',
    iqama: '2005678901',
    joinDate: '2022-04-12',
    status: 'active',
  },
  {
    id: 'EMP-006',
    name: 'محمد سلمان الحربي',
    position: 'مطور برمجيات',
    department: 'التقنية',
    salary: 22000,
    allowances: 4000,
    deductions: 1400,
    netSalary: 24600,
    phone: '0506666666',
    email: 'mohammed@company.sa',
    iqama: '2006789012',
    joinDate: '2022-08-05',
    status: 'active',
  },
  {
    id: 'EMP-007',
    name: 'لينا يوسف الحميد',
    position: 'مسؤولة تسويق',
    department: 'التسويق',
    salary: 13000,
    allowances: 2500,
    deductions: 950,
    netSalary: 14550,
    phone: '0507777777',
    email: 'lina@company.sa',
    iqama: '2007890123',
    joinDate: '2023-02-01',
    status: 'active',
  },
  {
    id: 'EMP-008',
    name: 'عبدالعزيز ناصر الشمري',
    position: 'مندوب مبيعات',
    department: 'المبيعات',
    salary: 9500,
    allowances: 3500,
    deductions: 750,
    netSalary: 12250,
    phone: '0508888888',
    email: 'aziz@company.sa',
    iqama: '2008901234',
    joinDate: '2023-05-15',
    status: 'active',
  },
]

export const DEPARTMENTS = ['الكل', 'المبيعات', 'المالية', 'التقنية', 'HR', 'التسويق', 'العمليات', 'الإدارة']
