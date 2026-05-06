export type InvoiceStatus = 'paid' | 'partial' | 'pending' | 'overdue' | 'draft' | 'confirmed'

export type PaymentMethod = 'cash' | 'credit'

export interface InvoiceAttachment {
  id: string
  name: string
  type: string
  dataUrl: string
  uploadedAt: string
}

export interface Invoice {
  id: string
  number: string
  barcode?: string
  customer: string
  customerId?: string
  date: string
  dueDate?: string
  amount: number
  tax: number
  total: number
  paidAmount?: number
  status: InvoiceStatus
  paymentMethod?: PaymentMethod
  items: InvoiceItem[]
  createdBy?: string
  attachments: InvoiceAttachment[]
}

export interface InvoiceItem {
  description: string
  productId?: string
  qty: number
  price: number
  total: number
}

let _globalInvoiceCounter = 0

export function getNextInvoiceNumber(): string {
  _globalInvoiceCounter++
  const year = new Date().getFullYear()
  return `INV-${year}-${String(_globalInvoiceCounter).padStart(4, '0')}`
}

export function generateBarcode(invoiceNumber: string): string {
  return `SAHL-${invoiceNumber}`
}

export const INVOICES: Invoice[] = []
