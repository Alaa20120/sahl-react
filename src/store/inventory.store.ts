import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRODUCTS, WITHDRAWALS, type Product, type Withdrawal } from '@/lib/mock-data/inventory'

interface InventoryStore {
  products: Product[]
  withdrawals: Withdrawal[]
  deductStock: (productId: string, qty: number) => void
  addStock: (productId: string, qty: number) => void
  deductFromInventory: (items: { productId?: string; qty: number }[]) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProducts: (ids: string[]) => void
  addProduct: (product: Product) => void
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set) => ({
      products: PRODUCTS,
      withdrawals: WITHDRAWALS,

      deductStock(productId, qty) {
        set(state => ({
          products: state.products.map(p =>
            p.id === productId ? { ...p, stock: Math.max(0, p.stock - qty) } : p
          ),
        }))
      },

      addStock(productId, qty) {
        set(state => ({
          products: state.products.map(p =>
            p.id === productId ? { ...p, stock: p.stock + qty } : p
          ),
        }))
      },

      deductFromInventory(items) {
        set(state => {
          let products = [...state.products]
          for (const item of items) {
            if (!item.productId) continue
            products = products.map(p =>
              p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p
            )
          }
          return { products }
        })
      },

      updateProduct(id, updates) {
        set(state => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p),
        }))
      },

      deleteProducts(ids) {
        set(state => ({
          products: state.products.filter(p => !ids.includes(p.id)),
        }))
      },

      addProduct(product) {
        set(state => ({ products: [...state.products, product] }))
      },
    }),
    { name: 'sahl-inventory-v3' }
  )
)
