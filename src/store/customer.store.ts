import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CUSTOMERS, type Customer } from '@/lib/mock-data/customers'

export interface CustomerPayment {
  id: string
  customerId: string
  date: string
  amount: number
  type: 'in' | 'out' // in = received from customer, out = paid to customer/supplier
  method: string
  description: string
  refId: string
  balanceBefore: number
  balanceAfter: number
}

interface CustomerStore {
  customers: Customer[]
  payments: CustomerPayment[]
  addCustomer: (data: Omit<Customer, 'id' | 'since' | 'totalInvoices'>) => Customer
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'since'>>) => void
  deleteCustomer: (id: string) => void
  updateBalance: (customerId: string, delta: number) => void
  addPayment: (payment: Omit<CustomerPayment, 'id' | 'refId'>) => CustomerPayment
  getPayments: (customerId: string) => CustomerPayment[]
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: CUSTOMERS,
      payments: [],

      addCustomer(data) {
        const id = `C-${String(get().customers.length + 1).padStart(3, '0')}`
        const newCustomer: Customer = {
          ...data,
          id,
          since: new Date().toISOString().slice(0, 10),
          totalInvoices: 0,
        }
        set(state => ({ customers: [...state.customers, newCustomer] }))
        return newCustomer
      },

      updateCustomer(id, updates) {
        set(state => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c),
        }))
      },

      deleteCustomer(id) {
        set(state => ({ customers: state.customers.filter(c => c.id !== id) }))
      },

      updateBalance(customerId, delta) {
        set(state => ({
          customers: state.customers.map(c =>
            c.id === customerId ? { ...c, balance: c.balance + delta } : c
          ),
        }))
      },

      addPayment(payment) {
        const id = `PAY-${Date.now()}`
        const refId = `RCP-${Date.now()}`
        const newPayment: CustomerPayment = { ...payment, id, refId }
        set(state => ({
          payments: [newPayment, ...state.payments],
          customers: state.customers.map(c =>
            c.id === payment.customerId
              ? { ...c, balance: payment.balanceAfter }
              : c
          ),
        }))
        return newPayment
      },

      getPayments(customerId) {
        return get().payments.filter(p => p.customerId === customerId)
      },
    }),
    { name: 'sahl-customers-v3' }
  )
)
