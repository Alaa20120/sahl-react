import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch } from '@/lib/supabase'
import type { Customer } from '@/lib/mock-data/customers'

export interface CustomerPayment {
  id: string
  customerId: string
  date: string
  amount: number
  type: 'in' | 'out'
  method: string
  description: string
  refId: string
  balanceBefore: number
  balanceAfter: number
}

interface CustomerStore {
  customers: Customer[]
  payments: CustomerPayment[]
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  addCustomer: (data: Omit<Customer, 'id' | 'since' | 'totalInvoices'>) => Promise<Customer>
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'since'>>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  updateBalance: (customerId: string, delta: number) => Promise<void>
  addPayment: (payment: Omit<CustomerPayment, 'id' | 'refId'>) => Promise<CustomerPayment>
  getPayments: (customerId: string) => CustomerPayment[]
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      payments: [],
      loading: false,
      error: null,

      async fetch() {
        if (!isSupabaseConfigured()) return
        set({ loading: true, error: null })
        try {
          const [customersData, paymentsData] = await Promise.all([
            supaFetch('customers', { select: '*', limit: 500 }),
            supaFetch('customer_payments', { select: '*', limit: 2000 }),
          ])
          const mapped = (customersData || []).map((c: any): Customer => ({
            id: c.id,
            name: c.name,
            type: c.type,
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            vatNumber: c.vat_number || undefined,
            commercialReg: c.commercial_reg || undefined,
            balance: Number(c.balance) || 0,
            totalInvoices: c.total_invoices || 0,
            status: c.status,
            since: c.since,
          }))
          const mappedPayments: CustomerPayment[] = (paymentsData || []).map((p: any) => ({
            id: p.id,
            customerId: p.customer_id,
            date: p.date,
            amount: Number(p.amount) || 0,
            type: p.type,
            method: p.method || '',
            description: p.description || '',
            refId: p.ref_id || p.id,
            balanceBefore: Number(p.balance_before) || 0,
            balanceAfter: Number(p.balance_after) || 0,
          }))
          set({ customers: mapped, payments: mappedPayments, loading: false })
        } catch (e: any) {
          set({ error: e.message, loading: false })
        }
      },

      async addCustomer(data) {
        const dbRow = {
          name: data.name,
          type: data.type,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          vat_number: data.vatNumber || null,
          commercial_reg: data.commercialReg || null,
          balance: data.balance || 0,
          status: data.status || 'active',
        }
        if (isSupabaseConfigured()) {
          const result = await supaFetch('customers', { method: 'POST', body: dbRow })
          const inserted = Array.isArray(result) ? result[0] : result
          if (!inserted) throw new Error('Failed to insert customer')
          const newCustomer: Customer = {
            id: inserted.id,
            name: inserted.name,
            type: inserted.type,
            phone: inserted.phone || '',
            email: inserted.email || '',
            address: inserted.address || '',
            vatNumber: inserted.vat_number || undefined,
            commercialReg: inserted.commercial_reg || undefined,
            balance: Number(inserted.balance) || 0,
            totalInvoices: 0,
            status: inserted.status,
            since: inserted.since,
          }
          set(state => ({ customers: [newCustomer, ...state.customers] }))
          return newCustomer
        }
        // Fallback: local only
        const id = `C-${String(get().customers.length + 1).padStart(3, '0')}`
        const newCustomer: Customer = { ...data, id, since: new Date().toISOString().slice(0, 10), totalInvoices: 0 }
        set(state => ({ customers: [newCustomer, ...state.customers] }))
        return newCustomer
      },

      async updateCustomer(id, updates) {
        const dbUpdates: any = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.type !== undefined) dbUpdates.type = updates.type
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone
        if (updates.email !== undefined) dbUpdates.email = updates.email
        if (updates.address !== undefined) dbUpdates.address = updates.address
        if (updates.vatNumber !== undefined) dbUpdates.vat_number = updates.vatNumber
        if (updates.commercialReg !== undefined) dbUpdates.commercial_reg = updates.commercialReg
        if (updates.balance !== undefined) dbUpdates.balance = updates.balance
        if (updates.status !== undefined) dbUpdates.status = updates.status

        if (isSupabaseConfigured()) {
          await supaFetch('customers', { method: 'PATCH', filter: 'id=eq.' + id, body: dbUpdates })
        }
        set(state => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c),
        }))
      },

      async deleteCustomer(id) {
        if (isSupabaseConfigured()) {
          await supaFetch('customers', { method: 'DELETE', filter: 'id=eq.' + id })
        }
        set(state => ({ customers: state.customers.filter(c => c.id !== id) }))
      },

      async updateBalance(customerId, delta) {
        const customer = get().customers.find(c => c.id === customerId)
        if (!customer) return
        const newBalance = customer.balance + delta
        if (isSupabaseConfigured()) {
          await supaFetch('customers', { method: 'PATCH', filter: 'id=eq.' + customerId, body: { balance: newBalance } })
        }
        set(state => ({
          customers: state.customers.map(c => c.id === customerId ? { ...c, balance: newBalance } : c),
        }))
      },

      async addPayment(payment) {
        const id = `PAY-${Date.now()}`
        const refId = `RCP-${Date.now()}`
        const newPayment: CustomerPayment = { ...payment, id, refId }
        if (isSupabaseConfigured()) {
          await supaFetch('customer_payments', {
            method: 'POST',
            body: {
              customer_id: payment.customerId,
              date: payment.date,
              amount: payment.amount,
              type: payment.type,
              method: payment.method,
              description: payment.description,
              ref_id: refId,
              balance_before: payment.balanceBefore,
              balance_after: payment.balanceAfter,
            },
          })
        }
        set(state => ({
          payments: [newPayment, ...state.payments],
          customers: state.customers.map(c =>
            c.id === payment.customerId ? { ...c, balance: payment.balanceAfter } : c
          ),
        }))
        return newPayment
      },

      getPayments(customerId) {
        return get().payments.filter(p => p.customerId === customerId)
      },
    }),
    { name: 'sahl-customers-v7' }
  )
)
