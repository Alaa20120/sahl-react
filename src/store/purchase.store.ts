import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { PURCHASES, type Purchase, type PurchaseStatus } from '@/lib/mock-data/purchases'
import { useInventoryStore } from './inventory.store'

interface PurchaseStore {
  purchases: Purchase[]
  yearCounters: Record<number, number>
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  nextNumber: () => string
  addPurchase: (data: Omit<Purchase, 'id'>) => Promise<Purchase>
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
        const { data, error } = await supabase.from('purchases').select('*, purchase_items(*)').order('created_at', { ascending: false })
        if (error) {
          set({ error: error.message, loading: false })
        } else {
          const mapped = (data || []).map((p: any): Purchase => ({
            id: p.id,
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
            lineItems: (p.purchase_items || []).map((it: any) => ({
              description: it.description,
              productId: it.product_id || undefined,
              qty: it.qty,
              price: Number(it.price) || 0,
              total: Number(it.total) || 0,
            })),
            createdBy: p.created_by || undefined,
          }))
          set({ purchases: mapped, loading: false })
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
        const n = (counters[year] ?? 0) + 1
        counters[year] = n
        const purchase: Purchase = { ...data, id: `PO-${year}-${String(n).padStart(3, '0')}` }

        if (isSupabaseConfigured()) {
          const { data: inserted, error } = await supabase.from('purchases').insert({
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
          }).select().single()
          if (error) throw new Error(error.message)

          if (data.lineItems.length > 0) {
            await supabase.from('purchase_items').insert(
              data.lineItems.map(it => ({
                purchase_id: inserted.id,
                description: it.description,
                product_id: it.productId || null,
                qty: it.qty,
                price: it.price,
                total: it.total,
              }))
            )
          }
          purchase.id = inserted.id
          for (const item of data.lineItems) {
            if (item.productId) {
              await useInventoryStore.getState().addStock(item.productId, item.qty, `purchase_${purchase.id}`)
            }
          }
        }

        set(state => ({ purchases: [purchase, ...state.purchases], yearCounters: counters }))
        return purchase
      },

      async updateStatus(id, status) {
        if (isSupabaseConfigured()) await supabase.from('purchases').update({ status }).eq('id', id)
        set(state => ({ purchases: state.purchases.map(p => p.id === id ? { ...p, status } : p) }))
      },

      async addPayment(id, amount) {
        const purchase = get().purchases.find(p => p.id === id)
        if (!purchase) return
        const newPaid = purchase.paid + amount
        const newStatus: PurchaseStatus = newPaid >= purchase.total ? 'received' : 'partial'

        if (isSupabaseConfigured()) {
          await supabase.from('purchases').update({ paid: newPaid, status: newStatus }).eq('id', id)
          await supabase.from('treasury_transactions').insert({
            date: new Date().toISOString().slice(0, 10),
            description: `دفعة مشتريات ${purchase.id}`,
            type: 'out', category: 'purchase', amount,
            balance: -amount, account_id: 'cash', ref: purchase.id,
          })
        }
        set(state => ({ purchases: state.purchases.map(p => p.id === id ? { ...p, paid: newPaid, status: newStatus } : p) }))
      },

      async confirmReceipt(id) {
        if (isSupabaseConfigured()) await supabase.from('purchases').update({ status: 'received' }).eq('id', id)
        set(state => ({ purchases: state.purchases.map(p => p.id === id ? { ...p, status: 'received' as PurchaseStatus } : p) }))
      },
    }),
    { name: 'sahl-purchases-v3' }
  )
)
