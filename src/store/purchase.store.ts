import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch } from '@/lib/supabase'
import { PURCHASES, type Purchase, type PurchaseStatus } from '@/lib/mock-data/purchases'
import { useInventoryStore } from './inventory.store'
import { useCustomerStore } from './customer.store'

interface PurchaseStore {
  purchases: Purchase[]
  yearCounters: Record<number, number>
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  nextNumber: () => string
  addPurchase: (data: Omit<Purchase, 'id' | 'number'>) => Promise<Purchase>
  updateStatus: (id: string, status: PurchaseStatus) => Promise<void>
  addPayment: (id: string, amount: number) => Promise<void>
  confirmReceipt: (id: string) => Promise<void>
}

export const usePurchaseStore = create<PurchaseStore>()(
  persist(
    (set, get) => ({
      purchases: PURCHASES,
      yearCounters: {},
      loading: false,
      error: null,

      async fetch() {
        if (!isSupabaseConfigured()) return
        set({ loading: true, error: null })
        try {
          // Fetch purchases and their items in two calls, then join client-side
          const [purchasesData, itemsData] = await Promise.all([
            supaFetch('purchases', { select: '*', limit: 500 }),
            supaFetch('purchase_items', { select: '*', limit: 2000 }),
          ])
          const itemsByPurchase: Record<string, any[]> = {}
          for (const it of (itemsData || [])) {
            if (!itemsByPurchase[it.purchase_id]) itemsByPurchase[it.purchase_id] = []
            itemsByPurchase[it.purchase_id].push(it)
          }
          const mapped = (purchasesData || []).map((p: any): Purchase => ({
            id: p.id,
            number: p.number || p.id,
            date: p.date,
            dueDate: p.due_date || undefined,
            supplier: p.supplier,
            supplierVat: p.supplier_vat || undefined,
            itemCount: p.item_count || 0,
            amount: Number(p.amount) || 0,
            tax: Number(p.tax) || 0,
            total: Number(p.total) || 0,
            paid: Number(p.paid) || 0,
            status: p.status,
            lineItems: (itemsByPurchase[p.id] || []).map((it: any) => ({
              description: it.description,
              productId: it.product_id || undefined,
              qty: it.qty,
              price: Number(it.price) || 0,
              total: Number(it.total) || 0,
            })),
            createdBy: p.created_by || undefined,
          }))
          set({ purchases: mapped, loading: false })
        } catch (e: any) {
          set({ error: e.message, loading: false })
        }
      },

      nextNumber() {
        const year = new Date().getFullYear()
        const n = (get().yearCounters[year] ?? 0) + 1
        return `PO-${year}-${String(n).padStart(3, '0')}`
      },

      async addPurchase(data) {
        const year = new Date().getFullYear()
        const counters = { ...get().yearCounters }
        const prefix = `PO-${year}-`

        // Always get the real max number from Supabase to avoid duplicates
        let n = 1
        try {
          const rows = await supaFetch('purchases', { select: 'number', limit: 500 })
          if (Array.isArray(rows) && rows.length > 0) {
            const max = rows
              .map((r: any) => parseInt((r.number || '').replace(prefix, '').split('-')[0]) || 0)
              .reduce((a: number, b: number) => Math.max(a, b), 0)
            n = max + 1
          }
        } catch {
          n = (counters[year] ?? 0) + 1
        }

        counters[year] = n
        const number = `${prefix}${String(n).padStart(3,'0')}`
        const purchase: Purchase = { ...data, id: number, number }

        if (isSupabaseConfigured()) {
          const result = await supaFetch('purchases', {
            method: 'POST',
            body: {
              number: purchase.id,
              date: data.date,
              due_date: data.dueDate || null,
              supplier: data.supplier,
              supplier_vat: data.supplierVat || null,
              item_count: data.itemCount || 0,
              amount: data.amount,
              tax: data.tax,
              total: data.total,
              paid: data.paid || 0,
              status: data.status,
              created_by: data.createdBy || null,
            },
          })
          const inserted = Array.isArray(result) ? result[0] : result
          if (!inserted) throw new Error('Failed to insert purchase')

          if (data.lineItems.length > 0) {
            await supaFetch('purchase_items', {
              method: 'POST',
              body: data.lineItems.map(it => ({
                purchase_id: inserted.id,
                description: it.description,
                product_id: it.productId || null,
                qty: it.qty,
                price: it.price,
                total: it.total,
              })),
            })
          }
          purchase.id = inserted.id
          // Only add to stock if purchase is received (cash payment = received immediately)
          if (data.status === 'received') {
            for (const item of data.lineItems) {
              if (item.productId) {
                await useInventoryStore.getState().addStock(item.productId, item.qty, `purchase_${purchase.id}`)
              }
            }
          }
        }

        // Update supplier balance (increase — we owe them)
        const customerStore = useCustomerStore.getState()
        const supplier = customerStore.customers.find(c => c.name === data.supplier || c.id === (data as any).supplierId)
        if (supplier) {
          customerStore.updateBalance(supplier.id, data.total)
        }

        set(state => ({ purchases: [purchase, ...state.purchases], yearCounters: counters }))
        return purchase
      },

      async updateStatus(id, status) {
        if (isSupabaseConfigured()) {
          await supaFetch('purchases', { method: 'PATCH', filter: 'id=eq.' + id, body: { status } })
        }
        set(state => ({ purchases: state.purchases.map(p => p.id === id ? { ...p, status } : p) }))
      },

      async addPayment(id, amount) {
        const purchase = get().purchases.find(p => p.id === id || p.number === id)
        if (!purchase) return
        const newPaid = purchase.paid + amount
        const newStatus: PurchaseStatus = newPaid >= purchase.total ? 'received' : 'partial'

        if (isSupabaseConfigured()) {
          await supaFetch('purchases', {
            method: 'PATCH',
            filter: 'id=eq.' + id,
            body: { paid: newPaid, status: newStatus },
          })
          await supaFetch('treasury_transactions', {
            method: 'POST',
            body: {
              date: new Date().toISOString().slice(0, 10),
              description: `دفعة مشتريات ${purchase.id}`,
              type: 'out', category: 'purchase', amount,
              balance: -amount, account_id: 'cash', ref: purchase.id,
            },
          })
        }
        // Decrease supplier balance when we pay
        const customerStore = useCustomerStore.getState()
        const supplier = customerStore.customers.find(c => c.name === purchase.supplier)
        if (supplier) {
          customerStore.updateBalance(supplier.id, -amount)
        }

        set(state => ({ purchases: state.purchases.map(p => p.id === id || p.number === id ? { ...p, paid: newPaid, status: newStatus } : p) }))
      },

      async confirmReceipt(id) {
        if (isSupabaseConfigured()) {
          await supaFetch('purchases', { method: 'PATCH', filter: 'id=eq.' + id, body: { status: 'received' } })
          // Add to stock when confirmed as received
          const purchase = get().purchases.find(p => p.id === id || p.number === id)
          if (purchase && purchase.status !== 'received') {
            for (const item of purchase.lineItems) {
              if (item.productId) {
                await useInventoryStore.getState().addStock(item.productId, item.qty, `confirm_${id}`)
              }
            }
          }
        }
        set(state => ({ purchases: state.purchases.map(p => p.id === id || p.number === id ? { ...p, status: 'received' as PurchaseStatus } : p) }))
      },
    }),
    { name: 'sahl-purchases-v3' }
  )
)
