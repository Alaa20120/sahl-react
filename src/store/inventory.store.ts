import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
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
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        if (error) {
          set({ error: error.message, loading: false })
        } else {
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
        }
      },

      async deductStock(productId, qty) {
        const product = get().products.find(p => p.id === productId)
        if (!product) return
        const newStock = Math.max(0, product.stock - qty)
        if (isSupabaseConfigured()) {
          await supabase.from('products').update({ stock: newStock }).eq('id', productId)
          await supabase.from('stock_movements').insert({
            product_id: productId, type: 'out', qty, reference: 'manual_deduction',
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
          await supabase.from('products').update({ stock: newStock }).eq('id', productId)
          await supabase.from('stock_movements').insert({
            product_id: productId, type: 'in', qty, reference: reference || 'manual_addition',
          })
        }
        set(state => ({
          products: state.products.map(p => p.id === productId ? { ...p, stock: newStock } : p),
        }))
      },

      async deductFromInventory(items) {
        set(state => {
          let products = [...state.products]
          for (const item of items) {
            if (!item.productId) continue
            const p = products.find(pr => pr.id === item.productId)
            if (!p) continue
            const newStock = Math.max(0, p.stock - item.qty)
            products = products.map(pr => pr.id === item.productId ? { ...pr, stock: newStock } : pr)
            if (isSupabaseConfigured()) {
              supabase.from('products').update({ stock: newStock }).eq('id', item.productId)
              supabase.from('stock_movements').insert({
                product_id: item.productId, type: 'out', qty: item.qty, reference: 'invoice',
              })
            }
          }
          return { products }
        })
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
          const { error } = await supabase.from('products').update(dbUpdates).eq('id', id)
          if (error) throw new Error(error.message)
        }
        set(state => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p),
        }))
      },

      async deleteProducts(ids) {
        if (isSupabaseConfigured()) {
          for (const id of ids) {
            await supabase.from('products').delete().eq('id', id)
          }
        }
        set(state => ({
          products: state.products.filter(p => !ids.includes(p.id)),
        }))
      },

      async addProduct(product) {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase.from('products').insert({
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
          }).select().single()
          if (error) throw new Error(error.message)
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
