export type CustomerType = 'customer' | 'supplier' | 'both'

export interface Customer {
  id: string
  name: string
  type: CustomerType
  phone: string
  email: string
  address: string
  vatNumber?: string
  commercialReg?: string
  balance: number
  totalInvoices: number
  status: 'active' | 'inactive'
  since: string
}

export const CUSTOMERS: Customer[] = [
  {
    id: 'C001',
    name: 'شركة الرواد التجارية',
    type: 'customer',
    phone: '0501234567',
    email: 'info@rowad.com',
    address: 'الرياض، حي العليا',
    vatNumber: '300123456700003',
    balance: -12500,
    totalInvoices: 12,
    status: 'active',
    since: '2023-01-15',
  },
  {
    id: 'C002',
    name: 'مؤسسة الإبداع الرقمي',
    type: 'customer',
    phone: '0559876543',
    email: 'contact@ibdaa.sa',
    address: 'جدة، حي الصفا',
    vatNumber: '300987654300003',
    balance: -8400,
    totalInvoices: 8,
    status: 'active',
    since: '2023-03-20',
  },
  {
    id: 'C003',
    name: 'مجموعة النخبة',
    type: 'customer',
    phone: '0561122334',
    email: 'sales@nukhba.com',
    address: 'الدمام، حي الشاطئ',
    balance: -5600,
    totalInvoices: 6,
    status: 'active',
    since: '2023-06-10',
  },
  {
    id: 'C004',
    name: 'شركة البناء الحديث',
    type: 'customer',
    phone: '0534455667',
    email: 'procurement@bnaa.com',
    address: 'الرياض، حي الملز',
    balance: -18200,
    totalInvoices: 15,
    status: 'active',
    since: '2022-11-05',
  },
  {
    id: 'C005',
    name: 'مؤسسة التميز للخدمات',
    type: 'customer',
    phone: '0547788990',
    email: 'hello@tamayoz.sa',
    address: 'مكة، العزيزية',
    balance: -3200,
    totalInvoices: 4,
    status: 'active',
    since: '2024-01-08',
  },
  {
    id: 'C006',
    name: 'مؤسسة التقنية المتقدمة',
    type: 'supplier',
    phone: '0593344556',
    email: 'orders@taqnia.com',
    address: 'الرياض، حي النرجس',
    balance: 25000,
    totalInvoices: 0,
    status: 'active',
    since: '2022-08-15',
  },
  {
    id: 'C007',
    name: 'شركة الأمل للتوريدات',
    type: 'supplier',
    phone: '0586677889',
    email: 'sales@amal-supply.sa',
    address: 'جدة، حي البوادي',
    balance: 18000,
    totalInvoices: 0,
    status: 'active',
    since: '2023-02-22',
  },
]
