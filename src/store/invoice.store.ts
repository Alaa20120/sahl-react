import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { INVOICES, type Invoice, type InvoiceStatus, getNextInvoiceNumber, generateBarcode } from '@/lib/mock-data/invoices'
import { useInventoryStore } from './inventory.store'
import { useCustomerStore } from './customer.store'

interface InvoiceStore {
  invoices: Invoice[]
  globalCounter: number
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  nextNumber: () => string
  addInvoice: (data: Omit<Invoice, 'id' | 'number' | 'barcode' | 'attachments'>) => Promise<Invoice>
  updateStatus: (id: string, status: InvoiceStatus) => Promise<void>
  addPayment: (id: string, amount: number) => Promise<void>
  confirmInvoice: (id: string) => Promise<void>
  addAttachment: (invoiceId: string, file: { name: string; type: string; dataUrl: string }) => Promise<void>
  removeAttachment: (invoiceId: string, attachmentId: string) => Promise<void>
  createReturn: (originalInvoiceId: string, returnedItems: { productId?: string; description: string; qty: number; price: number; total: number }[], reason: string) => Promise<Invoice | null>
}

const initialCounter = 0

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: INVOICES,
      globalCounter: initialCounter,
      loading: false,
      error: null,

      async fetch() {
        if (!isSupabaseConfigured()) return
        set({ loading: true, error: null })
        const { data, error } = await supabase.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false })
        if (error) {
          set({ error: error.message, loading: false })
        } else {
          const mapped = (data || []).map((inv: any): Invoice => ({
            id: inv.id,
            number: inv.number,
            barcode: inv.barcode || undefined,
            customer: inv.customer,
            customerId: inv.customer_id || undefined,
            date: inv.date,
            dueDate: inv.due_date || undefined,
            amount: Number(inv.amount) || 0,
            tax: Number(inv.tax) || 0,
            total: Number(inv.total) || 0,
            paidAmount: Number(inv.paid_amount) || 0,
            status: inv.status,
            paymentMethod: inv.payment_method || undefined,
            items: (inv.invoice_items || []).map((it: any) => ({
              description: it.description,
              productId: it.product_id || undefined,
              qty: it.qty,
              price: Number(it.price) || 0,
              total: Number(it.total) || 0,
            })),
            createdBy: inv.created_by || undefined,
            attachments: [],
          }))
          set({ invoices: mapped, loading: false })
        }
      },

      nextNumber() {
        const next = get().globalCounter + 1
        const year = new Date().getFullYear()
        return `INV-${year}-${String(next).padStart(4, '0')}`
      },

      async addInvoice(data) {
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

        if (isSupabaseConfigured()) {
          const { data: inserted, error } = await supabase.from('invoices').insert({
            number,
            barcode,
            customer: data.customer,
            customer_id: data.customerId || null,
            date: data.date,
            due_date: data.dueDate || null,
            amount: data.amount,
            tax: data.tax,
            total: data.total,
            paid_amount: data.paidAmount || 0,
            status: data.status,
            payment_method: data.paymentMethod || null,
            created_by: data.createdBy || null,
          }).select().single()
          if (error) throw new Error(error.message)

          if (data.items.length > 0) {
            await supabase.from('invoice_items').insert(
              data.items.map(it => ({
                invoice_id: inserted.id,
                description: it.description,
                product_id: it.productId || null,
                qty: it.qty,
                price: it.price,
                total: it.total,
              }))
            )
          }
          invoice.id = inserted.id
          for (const item of data.items) {
            if (item.productId) {
              await useInventoryStore.getState().deductStock(item.productId, item.qty)
            }
          }
          if (data.customerId) {
            await useCustomerStore.getState().updateBalance(data.customerId, data.total)
          }
        }

        set(state => ({ invoices: [invoice, ...state.invoices], globalCounter: newCounter }))
        return invoice
      },

      async updateStatus(id, status) {
        if (isSupabaseConfigured()) await supabase.from('invoices').update({ status }).eq('id', id)
        set(state => ({ invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv) }))
      },

      async addPayment(id, amount) {
        const invoice = get().invoices.find(inv => inv.id === id)
        if (!invoice) return
        const newPaid = (invoice.paidAmount || 0) + amount
        let newStatus: InvoiceStatus = invoice.status
        if (newPaid >= invoice.total) newStatus = 'paid'
        else if (newPaid > 0) newStatus = 'partial'

        if (isSupabaseConfigured()) {
          await supabase.from('invoices').update({ paid_amount: newPaid, status: newStatus }).eq('id', id)
          await supabase.from('treasury_transactions').insert({
            date: new Date().toISOString().slice(0, 10),
            description: `دفعة فاتورة ${invoice.number}`,
            type: 'in', category: 'collection', amount,
            balance: amount, account_id: 'cash', ref: invoice.number,
          })
        }
        set(state => ({ invoices: state.invoices.map(inv => inv.id === id ? { ...inv, paidAmount: newPaid, status: newStatus } : inv) }))
      },

      async confirmInvoice(id) {
        if (isSupabaseConfigured()) await supabase.from('invoices').update({ status: 'confirmed' }).eq('id', id)
        set(state => ({ invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status: 'confirmed' as InvoiceStatus } : inv) }))
      },

      async addAttachment(invoiceId, file) {
        const attachment = { id: `ATT-${Date.now()}`, name: file.name, type: file.type, dataUrl: file.dataUrl, uploadedAt: new Date().toISOString() }
        set(state => ({ invoices: state.invoices.map(inv => inv.id === invoiceId ? { ...inv, attachments: [...inv.attachments, attachment] } : inv) }))
      },

      async removeAttachment(invoiceId, attachmentId) {
        set(state => ({ invoices: state.invoices.map(inv => inv.id === invoiceId ? { ...inv, attachments: inv.attachments.filter(a => a.id !== attachmentId) } : inv) }))
      },

      async createReturn(originalInvoiceId, returnedItems, reason) {
        const original = get().invoices.find(inv => inv.id === originalInvoiceId)
        if (!original) return null
        const returnTotal = returnedItems.reduce((s, it) => s + it.total, 0)
        const returnTax = Math.round(returnTotal * 0.15 * 10) / 10
        const returnAmount = returnTotal - returnTax
        const returnNumber = `RET-${original.number}`
        const returnInvoice: Invoice = {
          id: `RET-${Date.now()}`,
          number: returnNumber,
          barcode: generateBarcode(returnNumber),
          customer: original.customer,
          customerId: original.customerId,
          date: new Date().toISOString().slice(0, 10),
          amount: returnAmount,
          tax: returnTax,
          total: returnTotal,
          paidAmount: returnTotal,
          status: 'returned',
          paymentMethod: original.paymentMethod,
          items: returnedItems,
          createdBy: original.createdBy,
          attachments: [],
        }

        if (isSupabaseConfigured()) {
          const { data: inserted } = await supabase.from('invoices').insert({
            number: returnNumber, barcode: returnInvoice.barcode,
            customer: original.customer, customer_id: original.customerId || null,
            date: returnInvoice.date, amount: returnAmount, tax: returnTax,
            total: returnTotal, paid_amount: returnTotal, status: 'returned',
            payment_method: original.paymentMethod || null,
            is_return: true, original_invoice_id: originalInvoiceId, return_reason: reason,
          }).select().single()

          if (inserted) {
            returnInvoice.id = inserted.id
            await supabase.from('invoice_items').insert(returnedItems.map(it => ({
              invoice_id: inserted.id, description: it.description,
              product_id: it.productId || null, qty: it.qty, price: it.price, total: it.total,
            })))
          }
          for (const item of returnedItems) {
            if (item.productId) await useInventoryStore.getState().addStock(item.productId, item.qty, `return_${returnNumber}`)
          }
          if (original.customerId) await useCustomerStore.getState().updateBalance(original.customerId, -returnTotal)
        }

        set(state => ({ invoices: [returnInvoice, ...state.invoices] }))
        return returnInvoice
      },
    }),
    { name: 'sahl-invoices-v4' }
  )
)
