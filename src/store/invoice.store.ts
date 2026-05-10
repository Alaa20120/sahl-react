import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch } from '@/lib/supabase'
import { INVOICES, type Invoice, type InvoiceStatus, getNextInvoiceNumber, generateBarcode } from '@/lib/mock-data/invoices'
import { useInventoryStore } from './inventory.store'
import { useCustomerStore } from './customer.store'
import { useTreasuryStore } from './treasury.store'

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
        try {
          // Fetch invoices and their items in two calls, then join client-side
          const [invoicesData, itemsData] = await Promise.all([
            supaFetch('invoices', { select: '*', limit: 500 }),
            supaFetch('invoice_items', { select: '*', limit: 2000 }),
          ])
          const itemsByInvoice: Record<string, any[]> = {}
          for (const it of (itemsData || [])) {
            if (!itemsByInvoice[it.invoice_id]) itemsByInvoice[it.invoice_id] = []
            itemsByInvoice[it.invoice_id].push(it)
          }
          const mapped = (invoicesData || []).map((inv: any): Invoice => ({
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
            items: (itemsByInvoice[inv.id] || []).map((it: any) => ({
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
        } catch (e: any) {
          set({ error: e.message, loading: false })
        }
      },

      nextNumber() {
        const next = get().globalCounter + 1
        const year = new Date().getFullYear()
        return `INV-${year}-${String(next).padStart(4, '0')}`
      },

      async addInvoice(data) {
        const year = new Date().getFullYear()
        const prefix = `INV-${year}-`
        // Get real max invoice number from Supabase
        let seq = get().globalCounter + 1
        try {
          const rows = await supaFetch('invoices', { select: 'number', limit: 1000 })
          if (Array.isArray(rows) && rows.length > 0) {
            const max = rows
              .map((r: any) => parseInt((r.number || '').replace(prefix, '').split('-')[0]) || 0)
              .reduce((a: number, b: number) => Math.max(a, b), 0)
            seq = max + 1
          }
        } catch { /* use local counter */ }
        const newCounter = seq
        const number = `${prefix}${String(seq).padStart(4, '0')}`
        const barcode = generateBarcode(number)

        const invoice: Invoice = {
          ...data,
          id: `INV-${Date.now()}`,
          number,
          barcode,
          attachments: [],
        }

        if (isSupabaseConfigured()) {
          const result = await supaFetch('invoices', {
            method: 'POST',
            body: {
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
            },
          })
          const inserted = Array.isArray(result) ? result[0] : result
          if (!inserted) throw new Error('Failed to insert invoice')

          if (data.items.length > 0) {
            await supaFetch('invoice_items', {
              method: 'POST',
              body: data.items.map(it => ({
                invoice_id: inserted.id,
                description: it.description,
                product_id: it.productId || null,
                qty: it.qty,
                price: it.price,
                total: it.total,
              })),
            })
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
          // Treasury: record cash payment immediately if paid in full
          if (data.paymentMethod === 'cash' && (data.paidAmount || 0) >= data.total) {
            await useTreasuryStore.getState().addTransaction({
              date: data.date,
              description: `فاتورة مبيعات ${number} - ${data.customer}`,
              type: 'in',
              category: 'invoice',
              amount: data.total,
              account: 'cash',
              ref: number,
            })
          }
        }

        set(state => ({ invoices: [invoice, ...state.invoices], globalCounter: newCounter }))
        return invoice
      },

      async updateStatus(id, status) {
        if (isSupabaseConfigured()) {
          await supaFetch('invoices', { method: 'PATCH', filter: 'id=eq.' + id, body: { status } })
        }
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
          await supaFetch('invoices', {
            method: 'PATCH',
            filter: 'id=eq.' + id,
            body: { paid_amount: newPaid, status: newStatus },
          })
          await supaFetch('treasury_transactions', {
            method: 'POST',
            body: {
              date: new Date().toISOString().slice(0, 10),
              description: `دفعة فاتورة ${invoice.number}`,
              type: 'in', category: 'collection', amount,
              balance: amount, account_id: 'cash', ref: invoice.number,
            },
          })
        }
        set(state => ({ invoices: state.invoices.map(inv => inv.id === id ? { ...inv, paidAmount: newPaid, status: newStatus } : inv) }))
      },

      async confirmInvoice(id) {
        if (isSupabaseConfigured()) {
          await supaFetch('invoices', { method: 'PATCH', filter: 'id=eq.' + id, body: { status: 'confirmed' } })
        }
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
          const result = await supaFetch('invoices', {
            method: 'POST',
            body: {
              number: returnNumber, barcode: returnInvoice.barcode,
              customer: original.customer, customer_id: original.customerId || null,
              date: returnInvoice.date, amount: returnAmount, tax: returnTax,
              total: returnTotal, paid_amount: returnTotal, status: 'returned',
              payment_method: original.paymentMethod || null,
              is_return: true, original_invoice_id: originalInvoiceId, return_reason: reason,
            },
          })
          const inserted = Array.isArray(result) ? result[0] : result

          if (inserted) {
            returnInvoice.id = inserted.id
            await supaFetch('invoice_items', {
              method: 'POST',
              body: returnedItems.map(it => ({
                invoice_id: inserted.id, description: it.description,
                product_id: it.productId || null, qty: it.qty, price: it.price, total: it.total,
              })),
            })
          }
        }

        // Restore stock regardless of Supabase
        for (const item of returnedItems) {
          if (item.productId) await useInventoryStore.getState().addStock(item.productId, item.qty, `return_${returnNumber}`)
        }
        // Deduct from customer balance
        if (original.customerId) await useCustomerStore.getState().updateBalance(original.customerId, -returnTotal)
        // Treasury: record refund as outgoing
        await useTreasuryStore.getState().addTransaction({
          date: returnInvoice.date,
          description: `مرتجع فاتورة ${original.number} - ${original.customer}`,
          type: 'out',
          category: 'invoice',
          amount: returnTotal,
          account: 'cash',
          ref: returnNumber,
        })

        // Mark original invoice as returned — update BOTH local state AND Supabase
        if (isSupabaseConfigured()) {
          await supaFetch('invoices', {
            method: 'PATCH',
            filter: 'id=eq.' + originalInvoiceId,
            body: { status: 'returned' },
          })
        }
        const currentInvoices = get().invoices
        const updatedInvoices = currentInvoices.map((inv: Invoice) => inv.id === originalInvoiceId ? { ...inv, status: 'returned' as const } : inv)
        set({ invoices: [returnInvoice, ...updatedInvoices] })
        return returnInvoice
      },
    }),
    { name: 'sahl-invoices-v4' }
  )
)
