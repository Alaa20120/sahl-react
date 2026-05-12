import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured, supaFetch } from '@/lib/supabase'
import {
  DELEGATES,
  type Delegate,
  type DelegateTransaction,
  type DelegateWarehouseItem,
  type DelegateInvoice,
} from '@/lib/mock-data/delegates'
import { useTreasuryStore } from './treasury.store'
import { useInventoryStore } from './inventory.store'
import { useCustomerStore } from './customer.store'

interface WarehouseTransfer {
  id: string
  productId: string
  productName: string
  productSku: string
  qty: number
  costPrice: number
  date: string
  type: 'in' | 'out' // in = from company, out = return to company
  source: 'company' | 'purchase' | 'sale' | 'return'
}

interface DelegateStore {
  delegates: Delegate[]
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  addDelegate: (data: { name: string; phone: string; email: string; zone: string; username?: string; password?: string; baseSalary?: number; commissionRate?: number }) => Promise<Delegate>
  setDelegateStatus: (delegateId: string, status: 'active' | 'inactive') => Promise<void>

  // Invoice operations
  addInvoice: (delegateId: string, invoice: Omit<DelegateInvoice, 'id' | 'number'>) => Promise<DelegateInvoice>
  updateInvoiceStatus: (delegateId: string, invoiceId: string, status: DelegateInvoice['status']) => Promise<void>
  payDelegateInvoice: (delegateId: string, invoiceId: string, amount: number) => Promise<void>
  confirmDelegateInvoice: (delegateId: string, invoiceId: string) => Promise<{ success: boolean; failedItem?: string }>
  voidDelegateInvoice: (delegateId: string, invoiceId: string, reason?: string) => Promise<void>

  // Financial operations
  addCollectionTransaction: (delegateId: string, amount: number, description: string, reference?: string) => Promise<void>
  withdrawFromDelegate: (delegateId: string, amount: number, description: string) => Promise<void>
  remitToCompany: (delegateId: string, amount: number, description: string) => Promise<void>
  resetDelegateData: (delegateId: string) => Promise<void>

  // NEW Warehouse operations
  getDelegateStock: (delegateId: string, productId: string) => number
  getAvailableStock: (delegateId: string, productId: string) => number
  transferFromMainWarehouse: (delegateId: string, productId: string, qty: number) => Promise<void>
  returnToMainWarehouse: (delegateId: string, productId: string, qty: number) => Promise<void>
  addPurchaseToWarehouse: (delegateId: string, items: { productId: string; productName: string; productSku?: string; qty: number; costPrice: number }[]) => Promise<void>

  // Salary operations
  updateDelegateSalary: (delegateId: string, baseSalary: number, commissionRate: number) => Promise<void>

  // Legacy support
  deductFromWarehouse: (delegateId: string, productId: string, qty: number) => boolean
  addToWarehouse: (delegateId: string, item: Omit<DelegateWarehouseItem, 'id' | 'status'>) => Promise<void>
  setWarehouseQty: (delegateId: string, warehouseItemId: string, newQty: number) => void

  // Auth
  validateLogin: (username: string, password: string) => Delegate | null
}

function generateUsername(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0].toLowerCase()}.${parts[parts.length - 1].toLowerCase()}`
  return name.toLowerCase().replace(/\s+/g, '.')
}

function generatePassword(): string {
  return Math.random().toString(36).slice(-6) + Math.floor(Math.random() * 100)
}

export const useDelegateStore = create<DelegateStore>()(
  persist(
    (set, get) => ({
      delegates: DELEGATES,
      loading: false,
      error: null,

      async fetch() {
        if (!isSupabaseConfigured()) return
        set({ loading: true, error: null })
        try {
          const [data, whAll, invAll, txAll, itemsAll] = await Promise.all([
            supaFetch('delegates', { select: '*', limit: 200 }),
            supaFetch('delegate_warehouse', { select: '*', limit: 5000 }).catch(() => []),
            supaFetch('delegate_invoices', { select: '*', limit: 5000 }).catch(() => []),
            supaFetch('delegate_transactions', { select: '*', limit: 5000 }).catch(() => []),
            supaFetch('delegate_invoice_items', { select: '*', limit: 20000 }).catch(() => []),
          ])
          if (!Array.isArray(data) || data.length === 0) { set({ loading: false }); return }

          const whByDelegate: Record<string, any[]> = {}
          for (const w of (whAll || [])) {
            if (!whByDelegate[w.delegate_id]) whByDelegate[w.delegate_id] = []
            whByDelegate[w.delegate_id].push(w)
          }
          const invByDelegate: Record<string, any[]> = {}
          for (const i of (invAll || [])) {
            if (!invByDelegate[i.delegate_id]) invByDelegate[i.delegate_id] = []
            invByDelegate[i.delegate_id].push(i)
          }
          const txByDelegate: Record<string, any[]> = {}
          for (const t of (txAll || [])) {
            if (!txByDelegate[t.delegate_id]) txByDelegate[t.delegate_id] = []
            txByDelegate[t.delegate_id].push(t)
          }
          const itemsByInvoice: Record<string, any[]> = {}
          for (const it of (itemsAll || [])) {
            if (!itemsByInvoice[it.invoice_id]) itemsByInvoice[it.invoice_id] = []
            itemsByInvoice[it.invoice_id].push(it)
          }

          const delegates = data.map((d: any): Delegate => {
            return {
              id: d.id, name: d.name, phone: d.phone || '', email: d.email || '',
              zone: d.zone || '', status: d.status, username: d.username, password: d.password_hash,
              avatar: d.avatar || d.name.split(' ').slice(0, 2).map((w: string) => w[0]).join(''),
              location: { lat: d.location_lat || 24.7136, lng: d.location_lng || 46.6753, address: d.location_address || 'غير محدد', timestamp: new Date().toISOString() },
              locationHistory: [],
              warehouse: (whByDelegate[d.id] || []).map((w: any): DelegateWarehouseItem => ({
                id: w.id, productId: w.product_id, productName: w.product_name, productSku: w.product_sku || '',
                qty: w.qty, costPrice: Number(w.cost_price) || 0, receivedDate: w.received_date,
                status: w.status, source: w.source,
              })),
              invoices: (invByDelegate[d.id] || []).map((i: any): DelegateInvoice => ({
                id: i.id, number: i.number, date: i.date, type: i.type, party: i.party,
                customerId: i.customer_id,
                items: (itemsByInvoice[i.id] || []).map((it: any) => ({
                  productId: it.product_id || undefined,
                  description: it.description || '',
                  qty: Number(it.qty) || 0,
                  price: Number(it.price) || 0,
                  total: Number(it.total) || 0,
                })),
                subtotal: Number(i.subtotal) || 0, tax: Number(i.tax) || 0, total: Number(i.total) || 0,
                paidAmount: Number(i.paid_amount) || 0, status: i.status,
                paymentMethod: i.payment_method, confirmedAt: i.confirmed_at,
              })),
              transactions: (txByDelegate[d.id] || []).map((t: any): DelegateTransaction => ({
                id: t.id, date: t.date, type: t.type, amount: Number(t.amount) || 0,
                description: t.description || '', reference: t.reference,
                balanceAfter: Number(t.balance_after) || 0,
              })),
              stats: {
                totalSales: Number(d.stats_total_sales) || 0,
                totalPurchases: Number(d.stats_total_purchases) || 0,
                collected: Number(d.stats_collected) || 0,
                balance: Number(d.stats_balance) || 0,
                externalCredit: Number(d.stats_external_credit) || 0,
                expenses: Number(d.stats_expenses) || 0,
                companyEntrusted: Number(d.stats_company_entrusted) || 0,
              },
              baseSalary: Number(d.base_salary) || 0,
              commissionRate: Number(d.commission_rate) || 5,
            }
          })
          set({ delegates, loading: false })
        } catch (e: any) {
          set({ error: e.message, loading: false })
        }
      },

      async addDelegate({ name, phone, email, zone, username, password, baseSalary, commissionRate }) {
        const avatar = name.split(' ').slice(0, 2).map(w => w[0]).join('')
        const finalUsername = username?.trim() || generateUsername(name)
        const finalPassword = password || generatePassword()
        let dbId = `DEL-${Date.now()}`

        if (isSupabaseConfigured()) {
          const inserted = await supaFetch('delegates', {
            method: 'POST',
            body: {
              name,
              phone: phone || null,
              email: email || null,
              zone: zone || null,
              username: finalUsername,
              password_hash: finalPassword,
              avatar,
              status: 'active',
              base_salary: baseSalary || 0,
              commission_rate: commissionRate || 5,
            },
            select: 'id',
          })
          const row = Array.isArray(inserted) ? inserted[0] : inserted
          if (!row?.id) throw new Error('لم يتم التأكد من الحفظ في قاعدة البيانات')
          dbId = row.id
        }

        const newDel: Delegate = {
          id: dbId, name, phone, email, zone,
          status: 'active',
          username: finalUsername,
          password: finalPassword,
          avatar,
          location: { lat: 24.7136, lng: 46.6753, address: 'غير محدد', timestamp: new Date().toISOString() },
          locationHistory: [],
          warehouse: [], invoices: [], transactions: [],
          stats: { totalSales: 0, totalPurchases: 0, collected: 0, balance: 0, externalCredit: 0, expenses: 0, companyEntrusted: 0 },
          baseSalary: baseSalary || 0,
          commissionRate: commissionRate || 5,
        }
        set(state => ({ delegates: [...state.delegates, newDel] }))
        return newDel
      },

      async setDelegateStatus(delegateId, status) {
        if (isSupabaseConfigured()) {
          await supaFetch('delegates', { method: 'PATCH', filter: `id=eq.${delegateId}`, body: { status } })
        }
        set(state => ({ delegates: state.delegates.map(d => d.id === delegateId ? { ...d, status } : d) }))
      },

      validateLogin(username, password) {
        const local = get().delegates.find(d => d.username === username && d.password === password)
        if (local) return local
        return get().delegates.find(d =>
          d.username?.trim() === username?.trim() &&
          d.password?.trim() === password?.trim()
        ) || null
      },

      // ========== WAREHOUSE CALCULATIONS ==========
      getDelegateStock(delegateId, productId) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) return 0
        // Total stock = company transfers + purchases
        return delegate.warehouse
          .filter(w => w.productId === productId)
          .reduce((s, w) => s + w.qty, 0)
      },

      getAvailableStock(delegateId, productId) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) return 0
        // Total stock
        const totalStock = get().getDelegateStock(delegateId, productId)
        // Deduct confirmed/paid sales
        const sold = delegate.invoices
          .filter(inv => inv.type === 'sale' && (inv.status === 'confirmed' || inv.status === 'paid'))
          .reduce((s, inv) => {
            const itemQty = inv.items.find(it => it.productId === productId)?.qty || 0
            return s + itemQty
          }, 0)
        return Math.max(0, totalStock - sold)
      },

      async transferFromMainWarehouse(delegateId, productId, qty) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) throw new Error('المندوب غير موجود')

        // Check main inventory
        const mainStock = useInventoryStore.getState().getProductStock(productId)
        if (mainStock < qty) throw new Error(`الكمية غير متوفرة في المخزون الرئيسي. المتاح: ${mainStock}`)

        const product = useInventoryStore.getState().products.find(p => p.id === productId)
        const productName = product?.name || 'غير معروف'
        const productSku = product?.sku || ''
        const costPrice = product?.costPrice || 0

        // Deduct from main warehouse
        await useInventoryStore.getState().transferToDelegate(productId, delegateId, qty)

        // Add to delegate warehouse
        const today = new Date().toISOString().slice(0, 10)
        if (isSupabaseConfigured()) {
          await supabase.from('delegate_warehouse').insert({
            delegate_id: delegateId,
            product_id: productId,
            product_name: productName,
            product_sku: productSku,
            qty,
            cost_price: costPrice,
            received_date: today,
            status: 'in-stock',
            source: 'company',
          })
        }

        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            // Check if product already exists in warehouse
            const existing = d.warehouse.find(w => w.productId === productId && w.source === 'company')
            if (existing) {
              return {
                ...d,
                warehouse: d.warehouse.map(w =>
                  w.id === existing.id ? { ...w, qty: w.qty + qty } : w
                ),
                stats: { ...d.stats, companyEntrusted: d.stats.companyEntrusted + (qty * costPrice) }
              }
            }
            const newItem: DelegateWarehouseItem = {
              id: `WH-${Date.now()}`,
              productId,
              productName,
              productSku,
              qty,
              costPrice,
              receivedDate: today,
              status: 'in-stock',
              source: 'company',
            }
            return {
              ...d,
              warehouse: [...d.warehouse, newItem],
              stats: { ...d.stats, companyEntrusted: d.stats.companyEntrusted + (qty * costPrice) }
            }
          })
        }))
      },

      async returnToMainWarehouse(delegateId, productId, qty) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) throw new Error('المندوب غير موجود')

        // Check available stock
        const available = get().getAvailableStock(delegateId, productId)
        if (available < qty) throw new Error(`الكمية المتاحة للسحب: ${available} فقط`)

        // Add back to main warehouse
        await useInventoryStore.getState().returnFromDelegate(productId, delegateId, qty)

        // Deduct from delegate warehouse
        if (isSupabaseConfigured()) {
          const whItems = delegate.warehouse.filter(w => w.productId === productId)
          let remaining = qty
          for (const item of whItems) {
            if (remaining <= 0) break
            const deduct = Math.min(item.qty, remaining)
            remaining -= deduct
            const newQty = item.qty - deduct
            await supaFetch('delegate_warehouse', {
              method: 'PATCH',
              filter: `id=eq.${item.id}`,
              body: { qty: newQty, status: newQty <= 0 ? 'transferred' : 'in-stock' },
            })
          }
        }

        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            let remaining = qty
            const updatedWarehouse = d.warehouse.map(w => {
              if (w.productId !== productId || remaining <= 0) return w
              const deduct = Math.min(w.qty, remaining)
              remaining -= deduct
              return { ...w, qty: w.qty - deduct }
            }).filter(w => w.qty > 0)
            const returnedValue = qty * (d.warehouse.find(w => w.productId === productId)?.costPrice || 0)
            return {
              ...d,
              warehouse: updatedWarehouse,
              stats: { ...d.stats, companyEntrusted: Math.max(0, d.stats.companyEntrusted - returnedValue) }
            }
          })
        }))
      },

      async addPurchaseToWarehouse(delegateId, items) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) return

        const today = new Date().toISOString().slice(0, 10)

        for (const item of items) {
          if (!item.productId || item.qty <= 0) continue

          if (isSupabaseConfigured()) {
            await supabase.from('delegate_warehouse').insert({
              delegate_id: delegateId,
              product_id: item.productId,
              product_name: item.productName,
              product_sku: item.productSku || '',
              qty: item.qty,
              cost_price: item.costPrice,
              received_date: today,
              status: 'in-stock',
              source: 'purchased',
            })
          }
        }

        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const newItems: DelegateWarehouseItem[] = items
              .filter(it => it.productId && it.qty > 0)
              .map(it => ({
                id: `WH-${Date.now()}-${it.productId}`,
                productId: it.productId,
                productName: it.productName,
                productSku: it.productSku || '',
                qty: it.qty,
                costPrice: it.costPrice,
                receivedDate: today,
                status: 'in-stock',
                source: 'purchased',
              }))
            return {
              ...d,
              warehouse: [...d.warehouse, ...newItems],
            }
          })
        }))
      },

      // ========== INVOICE OPERATIONS ==========
      async addInvoice(delegateId, invoice) {
        const year = new Date().getFullYear()
        const prefix = `D-${year}-`
        let seq = (get().delegates.find(d => d.id === delegateId)?.invoices.length || 0) + 1
        if (isSupabaseConfigured()) {
          try {
            const rows = await supaFetch('delegate_invoices', { select: 'number', filter: `delegate_id=eq.${delegateId}`, limit: 500 })
            if (Array.isArray(rows) && rows.length > 0) {
              const max = rows.map((r: any) => parseInt((r.number || '').replace(prefix, '')) || 0).reduce((a: number, b: number) => Math.max(a, b), 0)
              seq = max + 1
            }
          } catch { /* use local count */ }
        }
        let newInvoice: DelegateInvoice = { ...invoice, id: `DINV-${Date.now()}`, number: `${prefix}${String(seq).padStart(3, '0')}` }

        if (isSupabaseConfigured()) {
          const { data: inserted } = await supabase.from('delegate_invoices').insert({
            delegate_id: delegateId, number: newInvoice.number, date: invoice.date,
            type: invoice.type, party: invoice.party, customer_id: invoice.customerId || null,
            subtotal: invoice.subtotal, tax: invoice.tax, total: invoice.total,
            paid_amount: invoice.paidAmount || 0, status: invoice.status,
            payment_method: invoice.paymentMethod || null,
          }).select().single()
          if (inserted) {
            newInvoice = { ...newInvoice, id: inserted.id }
            if (invoice.items.length > 0) {
              await supabase.from('delegate_invoice_items').insert(
                invoice.items.map(it => ({ invoice_id: inserted.id, product_id: it.productId || null, description: it.description, qty: it.qty, price: it.price, total: it.total }))
              )
            }
          }
        }

        // If purchase: add items to delegate warehouse
        if (invoice.type === 'purchase') {
          await get().addPurchaseToWarehouse(delegateId, invoice.items.map(it => ({
            productId: it.productId || `PROD-${Date.now()}`,
            productName: it.description,
            productSku: '',
            qty: it.qty,
            costPrice: it.price,
          })))
        }

        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const totalSales = d.stats.totalSales + (invoice.type === 'sale' ? invoice.total : 0)
            const totalPurchases = d.stats.totalPurchases + (invoice.type === 'purchase' ? invoice.total : 0)
            const externalCredit = invoice.type === 'sale' && invoice.status !== 'paid' ? d.stats.externalCredit + invoice.total : d.stats.externalCredit
            return { ...d, invoices: [newInvoice, ...d.invoices], stats: { ...d.stats, totalSales, totalPurchases, externalCredit } }
          }),
        }))
        return newInvoice
      },

      async updateInvoiceStatus(delegateId, invoiceId, status) {
        if (isSupabaseConfigured()) await supabase.from('delegate_invoices').update({ status }).eq('id', invoiceId)
        set(state => ({
          delegates: state.delegates.map(d => d.id !== delegateId ? d : { ...d, invoices: d.invoices.map(inv => inv.id === invoiceId ? { ...inv, status } : inv) }),
        }))
      },

      async payDelegateInvoice(delegateId, invoiceId, amount) {
        if (isSupabaseConfigured()) {
          const invoice = get().delegates.find(d => d.id === delegateId)?.invoices.find(inv => inv.id === invoiceId)
          if (invoice) {
            const newPaid = (invoice.paidAmount || 0) + amount
            const newStatus: DelegateInvoice['status'] = newPaid >= invoice.total ? 'paid' : 'pending'
            await supabase.from('delegate_invoices').update({ paid_amount: newPaid, status: newStatus }).eq('id', invoiceId)
          }
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const invoice = d.invoices.find(inv => inv.id === invoiceId)
            const wasPending = invoice?.status === 'pending' || invoice?.status === 'overdue'
            return {
              ...d,
              invoices: d.invoices.map(inv => {
                if (inv.id !== invoiceId) return inv
                const newPaid = (inv.paidAmount || 0) + amount
                return { ...inv, paidAmount: newPaid, status: newPaid >= inv.total ? 'paid' : 'pending' as DelegateInvoice['status'] }
              }),
              stats: { ...d.stats, externalCredit: wasPending ? Math.max(0, d.stats.externalCredit - amount) : d.stats.externalCredit, balance: d.stats.balance + amount },
            }
          }),
        }))
      },

      async confirmDelegateInvoice(delegateId, invoiceId) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) return { success: false, failedItem: 'المندوب غير موجود' }
        const invoice = delegate.invoices.find(inv => inv.id === invoiceId)
        if (!invoice) return { success: false, failedItem: 'الفاتورة غير موجودة' }
        if (invoice.type !== 'sale') return { success: false, failedItem: 'التأكيد للمبيعات فقط' }
        if (invoice.status === 'confirmed' || invoice.status === 'paid') return { success: false, failedItem: 'الفاتورة مؤكدة بالفعل' }

        // Check available stock BEFORE confirming
        for (const item of invoice.items) {
          if (!item.productId) continue
          const available = get().getAvailableStock(delegateId, item.productId)
          if (available < item.qty) return { success: false, failedItem: item.description }
        }

        // Deduct sold items from delegate warehouse in Supabase
        if (isSupabaseConfigured()) {
          for (const item of invoice.items) {
            if (!item.productId) continue
            let remaining = item.qty
            const whItems = delegate.warehouse.filter(w => w.productId === item.productId && w.qty > 0)
            for (const whItem of whItems) {
              if (remaining <= 0) break
              const deduct = Math.min(whItem.qty, remaining)
              remaining -= deduct
              const newQty = whItem.qty - deduct
              await supaFetch('delegate_warehouse', {
                method: 'PATCH',
                filter: `id=eq.${whItem.id}`,
                body: { qty: newQty, status: newQty <= 0 ? 'transferred' : 'in-stock' },
              })
            }
          }
        }

        // Mark as confirmed
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            let remainingItems = [...d.warehouse]
            for (const item of invoice.items) {
              if (!item.productId) continue
              let remaining = item.qty
              remainingItems = remainingItems.map(w => {
                if (w.productId !== item.productId || remaining <= 0) return w
                const deduct = Math.min(w.qty, remaining)
                remaining -= deduct
                return { ...w, qty: w.qty - deduct }
              }).filter(w => w.qty > 0)
            }
            return {
              ...d,
              invoices: d.invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'confirmed' as const, confirmedAt: new Date().toISOString().slice(0, 10) } : inv),
              warehouse: remainingItems,
              stats: {
                ...d.stats,
                totalSales: d.stats.totalSales + invoice.total,
                externalCredit: d.stats.externalCredit + (invoice.paymentMethod === 'credit' ? invoice.total : 0),
              },
            }
          }),
        }))

        // Sync to Supabase
        if (isSupabaseConfigured()) {
          await supaFetch('delegate_invoices', {
            method: 'PATCH',
            filter: `id=eq.${invoiceId}`,
            body: { status: 'confirmed', confirmed_at: new Date().toISOString().slice(0, 10) },
          })
        }
        return { success: true }
      },

      async addCollectionTransaction(delegateId, amount, description, reference) {
        if (isSupabaseConfigured()) {
          const delegate = get().delegates.find(d => d.id === delegateId)
          await supabase.from('delegate_transactions').insert({
            delegate_id: delegateId, date: new Date().toISOString().slice(0, 10),
            type: 'collection', amount, description, reference,
            balance_after: (delegate?.stats.balance || 0) + amount,
          })
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const tx: DelegateTransaction = { id: `TRX-${Date.now()}`, date: new Date().toISOString().slice(0, 10), type: 'collection', amount, description, reference, balanceAfter: d.stats.balance + amount }
            return { ...d, transactions: [tx, ...d.transactions], stats: { ...d.stats, balance: d.stats.balance + amount } }
          }),
        }))
      },

      async withdrawFromDelegate(delegateId, amount, description) {
        if (isSupabaseConfigured()) {
          const delegate = get().delegates.find(d => d.id === delegateId)
          await supabase.from('delegate_transactions').insert({
            delegate_id: delegateId, date: new Date().toISOString().slice(0, 10),
            type: 'withdrawal', amount: -amount, description,
            reference: `WD-${Date.now()}`, balance_after: (delegate?.stats.balance || 0) - amount,
          })
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const tx: DelegateTransaction = { id: `TRX-${Date.now()}`, date: new Date().toISOString().slice(0, 10), type: 'withdrawal', amount: -amount, description, reference: `WD-${Date.now()}`, balanceAfter: d.stats.balance - amount }
            return { ...d, transactions: [tx, ...d.transactions], stats: { ...d.stats, balance: d.stats.balance - amount } }
          }),
        }))
      },

      async remitToCompany(delegateId, amount, description) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        const today = new Date().toISOString().slice(0, 10)
        const ref = `REM-${Date.now()}`
        if (isSupabaseConfigured()) {
          await supabase.from('delegate_transactions').insert({
            delegate_id: delegateId, date: today,
            type: 'remittance', amount: -amount, description, reference: ref,
            balance_after: (delegate?.stats.balance || 0) - amount,
          })
          // Sync to main treasury as incoming cash
          await useTreasuryStore.getState().addTransaction({
            date: today,
            description: `تحصيل من مندوب: ${delegate?.name || delegateId} - ${description}`,
            type: 'in',
            category: 'collection',
            amount,
            account: 'cash',
            ref,
          })
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const tx: DelegateTransaction = { id: `TRX-${Date.now()}`, date: today, type: 'remittance', amount: -amount, description, reference: ref, balanceAfter: d.stats.balance - amount }
            return { ...d, transactions: [tx, ...d.transactions], stats: { ...d.stats, balance: Math.max(0, d.stats.balance - amount) } }
          }),
        }))
      },

      async resetDelegateData(delegateId) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) return
        // Return all warehouse stock to main inventory
        for (const item of delegate.warehouse) {
          if (item.productId) {
            await useInventoryStore.getState().addStock(item.productId, item.qty, `delegate_reset_${delegateId}`)
          }
        }
        if (isSupabaseConfigured()) {
          await supabase.from('delegate_warehouse').delete().eq('delegate_id', delegateId)
          await supabase.from('delegate_invoices').delete().eq('delegate_id', delegateId)
          await supabase.from('delegate_transactions').delete().eq('delegate_id', delegateId)
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            return { ...d, warehouse: [], invoices: [], transactions: [], stats: { totalSales: 0, totalPurchases: 0, balance: 0, externalCredit: 0, companyEntrusted: 0, collected: 0, expenses: 0 } }
          }),
        }))
      },

      async voidDelegateInvoice(delegateId, invoiceId, reason) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) return
        const invoice = delegate.invoices.find(inv => inv.id === invoiceId)
        if (!invoice) return
        if (invoice.status === 'draft' || invoice.status === 'cancelled') return

        // Reverse stock for confirmed/paid sale invoices
        if (invoice.type === 'sale' && (invoice.status === 'confirmed' || invoice.status === 'paid')) {
          // Stock is already "virtually" deducted, confirming again would be wrong
          // Since we use available stock calculation, voiding just marks it as draft
          // The available stock will automatically increase
        }

        // Reverse customer balance for credit sales
        if (invoice.type === 'sale' && invoice.paymentMethod === 'credit' && invoice.customerId) {
          await useCustomerStore.getState().updateBalance(invoice.customerId, invoice.total)
        }

        // Update invoice status to draft and record void info
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const wasPending = invoice.status === 'pending' || invoice.status === 'overdue'
            const totalSales = Math.max(0, d.stats.totalSales - (invoice.type === 'sale' ? invoice.total : 0))
            const totalPurchases = Math.max(0, d.stats.totalPurchases - (invoice.type === 'purchase' ? invoice.total : 0))
            const externalCredit = wasPending
              ? Math.max(0, d.stats.externalCredit - invoice.total)
              : d.stats.externalCredit
            return {
              ...d,
              invoices: d.invoices.map(inv =>
                inv.id === invoiceId
                  ? { ...inv, status: 'draft' as const, voidReason: reason, voidedAt: new Date().toISOString().slice(0, 10) }
                  : inv
              ),
              stats: { ...d.stats, totalSales, totalPurchases, externalCredit: Math.max(0, externalCredit) },
            }
          }),
        }))

        if (isSupabaseConfigured()) {
          await supabase.from('delegate_invoices').update({
            status: 'draft',
            void_reason: reason,
            voided_at: new Date().toISOString().slice(0, 10),
          }).eq('id', invoiceId)
        }
      },

      async updateDelegateSalary(delegateId, baseSalary, commissionRate) {
        if (isSupabaseConfigured()) {
          await supaFetch('delegates', {
            method: 'PATCH',
            filter: `id=eq.${delegateId}`,
            body: { base_salary: baseSalary, commission_rate: commissionRate }
          })
        }
        set(state => ({
          delegates: state.delegates.map(d =>
            d.id === delegateId ? { ...d, baseSalary, commissionRate } : d
          )
        }))
      },

      deductFromWarehouse(delegateId, productId, qty) {
        let success = false
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const item = d.warehouse.find(w => w.productId === productId && w.status === 'in-stock')
            if (!item || item.qty < qty) return d
            success = true
            return { ...d, warehouse: d.warehouse.map(w => w.id !== item.id ? w : { ...w, qty: w.qty - qty }).filter(w => w.qty > 0 || w.status !== 'transferred') }
          }),
        }))
        return success
      },

      async addToWarehouse(delegateId, item) {
        if (isSupabaseConfigured()) {
          await supabase.from('delegate_warehouse').insert({
            delegate_id: delegateId, product_id: item.productId || null,
            product_name: item.productName, product_sku: item.productSku,
            qty: item.qty, cost_price: item.costPrice, received_date: item.receivedDate,
            status: 'in-stock', source: item.source || 'purchased',
          })
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const existing = d.warehouse.find(w => w.productId === item.productId && w.status === 'in-stock' && (w.source ?? 'purchased') === (item.source ?? 'purchased'))
            if (existing) {
              return { ...d, warehouse: d.warehouse.map(w => w.id === existing.id ? { ...w, qty: w.qty + item.qty } : w) }
            }
            const newItem: DelegateWarehouseItem = { ...item, id: `WH-${Date.now()}`, status: 'in-stock' }
            return { ...d, warehouse: [...d.warehouse, newItem] }
          }),
        }))
      },

      setWarehouseQty(delegateId, warehouseItemId, newQty) {
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            return {
              ...d,
              warehouse: d.warehouse.map(w => w.id === warehouseItemId ? { ...w, qty: Math.max(0, newQty) } : w)
            }
          }),
        }))
      },
    }),
    { name: 'sahl-delegates-v9' }
  )
)
