export type CustomerType = 'customer' | 'supplier' | 'both'

export interface Customer {
  id: string
  name: string
  type: CustomerType
  phone: string
  email: string
  address: string
  vatNumber?: string
  balance: number
  totalInvoices: number
  status: 'active' | 'inactive'
  since: string
}

export const CUSTOMERS: Customer[] = [
  { id: '1', name: 'شركة الرياض للتجارة', type: 'customer', phone: '0112345678', email: 'info@riyadh-co.sa', address: 'الرياض، حي العليا', vatNumber: '300012345600003', balance: 14375, totalInvoices: 12, status: 'active', since: '2023-01-15' },
  { id: '2', name: 'مؤسسة الأمل للخدمات', type: 'customer', phone: '0501234567', email: 'amal@amal.sa', address: 'جدة، الشرفية', vatNumber: '310987654300002', balance: 9430, totalInvoices: 8, status: 'active', since: '2023-03-20' },
  { id: '3', name: 'شركة الخليج المتحدة', type: 'both', phone: '0133456789', email: 'gulf@gulf-united.sa', address: 'الدمام، الكورنيش', vatNumber: '300456789100001', balance: -35650, totalInvoices: 24, status: 'active', since: '2022-11-05' },
  { id: '4', name: 'مجموعة النخبة', type: 'customer', phone: '0556789012', email: 'nakhba@nakhba.sa', address: 'الرياض، النزهة', balance: 6210, totalInvoices: 5, status: 'active', since: '2024-01-10' },
  { id: '5', name: 'شركة البناء الحديث', type: 'customer', phone: '0112233445', email: 'modern@modern-build.sa', address: 'الرياض، صلاح الدين', vatNumber: '300789456100004', balance: 0, totalInvoices: 18, status: 'active', since: '2022-06-01' },
  { id: '6', name: 'مورد المواد الخام', type: 'supplier', phone: '0501122334', email: 'supply@raw-materials.sa', address: 'جدة، المنطقة الصناعية', vatNumber: '310112233400001', balance: -22000, totalInvoices: 35, status: 'active', since: '2021-09-15' },
  { id: '7', name: 'شركة الرواد للإلكترونيات', type: 'supplier', phone: '0133322111', email: 'ruwad@ruwad-elec.sa', address: 'الدمام، الفيصلية', vatNumber: '300334455600003', balance: -54050, totalInvoices: 42, status: 'active', since: '2021-01-20' },
  { id: '8', name: 'مؤسسة الإبداع الرقمي', type: 'customer', phone: '0569988776', email: 'ibda3@ibda3.sa', address: 'الرياض، الملقا', balance: 7475, totalInvoices: 6, status: 'inactive', since: '2023-08-12' },
]
