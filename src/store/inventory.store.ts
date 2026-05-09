import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch } from '@/lib/supabase'
import { type Product, type Withdrawal, PRODUCTS, WITHDRAWALS } from '@/lib/mock-data/inventory'

interface InventoryStore {
  products: Product[]
  withdrawals: Withdrawal[]
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  deductStock: (productId: string, qty: number) => Promise<void>
  addStock: (productId: string, qty: number, reference?: string) => Promise<void>
  deductFromInventory: (items: { productId?: string; qty: number }[]) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProducts: (ids: string[]) => Promise<void>
  addProduct: (product: Product) => Promise<void>
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: PRODUCTS,
      withdrawals: WITHDRAWALS,
      loading: false,
      error: null,

      async fetch() {
        if (!isSupabaseConfigured()) return
        set({ loading: true, error: null })
        try {
          const data = await supaFetch('products', { select: '*', limit: 500 })
          const mapped = (data || []).map((p: any): Product => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category || '',
            unit: p.unit || 'قطعة',
            costPrice: Number(p.cost_price) || 0,
            sellPrice: Number(p.sell_price) || 0,
            stock: p.stock || 0,
            minStock: p.min_stock || 0,
            status: p.status || 'active',
          }))
          set({ products: mapped, loading: false })
        } catch (e: any) {
          set({ error: e.message, loading: false })
        }
      },

      async deductStock(productId, qty) {
        const product = get().products.find(p => p.id === productId)
        if (!product) return
        const newStock = Math.max(0, product.stock - qty)
        if (isSupabaseConfigured()) {
          await supaFetch('products', { method: 'PATCH', filter: 'id=eq.' + productId, body: { stock: newStock } })
          await supaFetch('stock_movements', {
            method: 'POST',
            body: { product_id: productId, type: 'out', qty, reference: 'manual_deduction' },
          })
        }
        set(state => ({
          products: state.products.map(p => p.id === productId ? { ...p, stock: newStock } : p),
        }))
      },

      async addStock(productId, qty, reference) {
        const product = get().products.find(p => p.id === productId)
        if (!product) return
        const newStock = product.stock + qty
        if (isSupabaseConfigured()) {
          await supaFetch('products', { method: 'PATCH', filter: 'id=eq.' + productId, body: { stock: newStock } })
          await supaFetch('stock_movements', {
            method: 'POST',
            body: { product_id: productId, type: 'in', qty, reference: reference || 'manual_addition' },
          })
        }
        set(state => ({
          products: state.products.map(p => p.id === productId ? { ...p, stock: newStock } : p),
        }))
      },

      async deductFromInventory(items) {
        const current = get().products
        const updated = [...current]
        for (const item of items) {
          if (!item.productId) continue
          const idx = updated.findIndex(p => p.id === item.productId)
          if (idx === -1) continue
          const newStock = Math.max(0, updated[idx].stock - item.qty)
          updated[idx] = { ...updated[idx], stock: newStock }
          if (isSupabaseConfigured()) {
            await supaFetch('products', { method: 'PATCH', filter: 'id=eq.' + item.productId, body: { stock: newStock } })
            await supaFetch('stock_movements', {
              method: 'POST',
              body: { product_id: item.productId, type: 'out', qty: item.qty, reference: 'invoice' },
            })
          }
        }
        set({ products: updated })
      },

      async updateProduct(id, updates) {
        const dbUpdates: any = {}
        if (updates.sku !== undefined) dbUpdates.sku = updates.sku
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.category !== undefined) dbUpdates.category = updates.category
        if (updates.unit !== undefined) dbUpdates.unit = updates.unit
        if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice
        if (updates.sellPrice !== undefined) dbUpdates.sell_price = updates.sellPrice
        if (updates.stock !== undefined) dbUpdates.stock = updates.stock
        if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock
        if (updates.status !== undefined) dbUpdates.status = updates.status

        if (isSupabaseConfigured()) {
          await supaFetch('products', { method: 'PATCH', filter: 'id=eq.' + id, body: dbUpdates })
        }
        set(state => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p),
        }))
      },

      async deleteProducts(ids) {
        if (isSupabaseConfigured()) {
          for (const id of ids) {
            await supaFetch('products', { method: 'DELETE', filter: 'id=eq.' + id })
          }
        }
        set(state => ({
          products: state.products.filter(p => !ids.includes(p.id)),
        }))
      },

      async addProduct(product) {
        if (isSupabaseConfigured()) {
          const result = await supaFetch('products', {
            method: 'POST',
            body: {
              id: product.id,
              sku: product.sku,
              name: product.name,
              category: product.category || null,
              unit: product.unit || 'قطعة',
              cost_price: product.costPrice || 0,
              sell_price: product.sellPrice || 0,
              stock: product.stock || 0,
              min_stock: product.minStock || 0,
              status: product.status || 'active',
            },
          })
          const data = Array.isArray(result) ? result[0] : result
          if (!data) throw new Error('Failed to insert product')
          const mapped: Product = {
            id: data.id, sku: data.sku, name: data.name,
            category: data.category || '', unit: data.unit || 'قطعة',
            costPrice: Number(data.cost_price) || 0, sellPrice: Number(data.sell_price) || 0,
            stock: data.stock || 0, minStock: data.min_stock || 0, status: data.status || 'active',
          }
          set(state => ({ products: [...state.products, mapped] }))
        } else {
          set(state => ({ products: [...state.products, product] }))
        }
      },
    }),
    { name: 'sahl-inventory-v3' }
  )
)
