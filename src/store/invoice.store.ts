import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { INVOICES, type Invoice, type InvoiceStatus, getNextInvoiceNumber, generateBarcode } from '@/lib/mock-data/invoices'

interface InvoiceStore {
  invoices: Invoice[]
  globalCounter: number
  nextNumber: () => string
  addInvoice: (data: Omit<Invoice, 'id' | 'number' | 'barcode' | 'attachments'>) => Invoice
  updateStatus: (id: string, status: InvoiceStatus) => void
  addPayment: (id: string, amount: number) => void
  confirmInvoice: (id: string) => void
  addAttachment: (invoiceId: string, file: { name: string; type: string; dataUrl: string }) => void
  removeAttachment: (invoiceId: string, attachmentId: string) => void
}

// Start from 0 — no mock data
const initialCounter = 0

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: INVOICES,
      globalCounter: initialCounter,

      nextNumber() {
        const next = get().globalCounter + 1
        const year = new Date().getFullYear()
        return `INV-${year}-${String(next).padStart(4, '0')}`
      },

      addInvoice(data) {
        const newCounter = get().globalCounter + 1
        const number = getNextInvoiceNumber()
        const barcode = generateBarcode(number)

        const invoice: Invoice = {
          ...data,
          id: `INV-${Date.now()}`,
          number,
          barcode,
          attachments: [],
        }

        set(state => ({
          invoices: [invoice, ...state.invoices],
          globalCounter: newCounter,
        }))

        return invoice
      },

      updateStatus(id, status) {
        set(state => ({
          invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv),
        }))
      },

      addPayment(id, amount) {
        set(state => ({
          invoices: state.invoices.map(inv => {
            if (inv.id !== id) return inv
            const newPaid = (inv.paidAmount || 0) + amount
            let newStatus = inv.status
            if (newPaid >= inv.total) newStatus = 'paid'
            else if (newPaid > 0) newStatus = 'partial'
            return { ...inv, paidAmount: newPaid, status: newStatus }
          })
        }))
      },

      confirmInvoice(id) {
        set(state => ({
          invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status: 'confirmed' } : inv)
        }))
      },

      addAttachment(invoiceId, file) {
        set(state => ({
          invoices: state.invoices.map(inv => {
            if (inv.id !== invoiceId) return inv
            return {
              ...inv,
              attachments: [
                ...inv.attachments,
                {
                  id: `ATT-${Date.now()}`,
                  name: file.name,
                  type: file.type,
                  dataUrl: file.dataUrl,
                  uploadedAt: new Date().toISOString(),
                }
              ]
            }
          })
        }))
      },

      removeAttachment(invoiceId, attachmentId) {
        set(state => ({
          invoices: state.invoices.map(inv => {
            if (inv.id !== invoiceId) return inv
            return {
              ...inv,
              attachments: inv.attachments.filter(a => a.id !== attachmentId)
            }
          })
        }))
      },
    }),
    { name: 'sahl-invoices-v4' }
  )
)
