import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PURCHASES, type Purchase, type PurchaseStatus } from '@/lib/mock-data/purchases'

interface PurchaseStore {
  purchases: Purchase[]
  yearCounters: Record<number, number>
  nextNumber: () => string
  addPurchase: (data: Omit<Purchase, 'id'>) => Purchase
  updateStatus: (id: string, status: PurchaseStatus) => void
  addPayment: (id: string, amount: number) => void
  confirmReceipt: (id: string) => void
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    (set, get) => ({
      purchases: PURCHASES,
      yearCounters: {},

      nextNumber() {
        const year = new Date().getFullYear()
        const n = (get().yearCounters[year] ?? 0) + 1
        return `PO-${year}-${String(n).padStart(3, '0')}`
      },

      addPurchase(data) {
        const year = new Date().getFullYear()
        const counters = { ...get().yearCounters }
        const n = (counters[year] ?? 0) + 1
        counters[year] = n
        const purchase: Purchase = {
          ...data,
          id: `PO-${year}-${String(n).padStart(3, '0')}`,
        }
        set(state => ({ purchases: [purchase, ...state.purchases], yearCounters: counters }))
        return purchase
      },

      updateStatus(id, status) {
        set(state => ({
          purchases: state.purchases.map(p => p.id === id ? { ...p, status } : p),
        }))
      },

      addPayment(id, amount) {
        set(state => ({
          purchases: state.purchases.map(p => {
            if (p.id !== id) return p
            const newPaid = p.paid + amount
            const newStatus: PurchaseStatus = newPaid >= p.total ? 'received' : 'partial'
            return { ...p, paid: newPaid, status: newStatus }
          }),
        }))
      },

      confirmReceipt(id) {
        set(state => ({
          purchases: state.purchases.map(p => p.id === id ? { ...p, status: 'received' } : p),
        }))
      },
    }),
    { name: 'sahl-purchases-v3' }
  )
)
