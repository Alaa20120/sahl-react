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

export const CUSTOMERS: Customer[] = []
