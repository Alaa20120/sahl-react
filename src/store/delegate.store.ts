import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  DELEGATES,
  type Delegate,
  type DelegateTransaction,
  type DelegateWarehouseItem,
  type DelegateInvoice,
} from '@/lib/mock-data/delegates'

interface DelegateStore {
  delegates: Delegate[]
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  addDelegate: (data: { name: string; phone: string; email: string; zone: string; username?: string; password?: string }) => Promise<Delegate>
  setDelegateStatus: (delegateId: string, status: 'active' | 'inactive') => Promise<void>
  addInvoice: (delegateId: string, invoice: Omit<DelegateInvoice, 'id' | 'number'>) => Promise<DelegateInvoice>
  updateInvoiceStatus: (delegateId: string, invoiceId: string, status: DelegateInvoice['status']) => Promise<void>
  payDelegateInvoice: (delegateId: string, invoiceId: string, amount: number) => Promise<void>
  confirmDelegateInvoice: (delegateId: string, invoiceId: string) => { success: boolean; failedItem?: string }
  addCollectionTransaction: (delegateId: string, amount: number, description: string, reference?: string) => Promise<void>
  deductFromWarehouse: (delegateId: string, productId: string, qty: number) => boolean
  addToWarehouse: (delegateId: string, item: Omit<DelegateWarehouseItem, 'id' | 'status'>) => Promise<void>
  withdrawFromDelegate: (delegateId: string, amount: number, description: string) => Promise<void>
  transferToMainWarehouse: (delegateId: string, warehouseItemId: string, qty: number) => Promise<void>
  remitToCompany: (delegateId: string, amount: number, description: string) => Promise<void>
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
        const { data, error } = await supabase.from('delegates').select('*').order('created_at', { ascending: false })
        if (error) {
          set({ error: error.message, loading: false })
          return
        }
        // Fetch related data for each delegate
        const delegatesWithData = await Promise.all((data || []).map(async (d: any) => {
          const [whRes, invRes, txRes] = await Promise.all([
            supabase.from('delegate_warehouse').select('*').eq('delegate_id', d.id),
            supabase.from('delegate_invoices').select('*, delegate_invoice_items(*)').eq('delegate_id', d.id),
            supabase.from('delegate_transactions').select('*').eq('delegate_id', d.id),
          ])
          return {
            id: d.id,
            name: d.name,
            phone: d.phone || '',
            email: d.email || '',
            zone: d.zone || '',
            status: d.status,
            username: d.username,
            password: d.password_hash,
            avatar: d.avatar || d.name.split(' ').slice(0, 2).map((w: string) => w[0]).join(''),
            location: { lat: d.location_lat || 24.7136, lng: d.location_lng || 46.6753, address: d.location_address || 'غير محدد', timestamp: new Date().toISOString() },
            locationHistory: [],
            warehouse: (whRes.data || []).map((w: any): DelegateWarehouseItem => ({
              id: w.id, productId: w.product_id, productName: w.product_name, productSku: w.product_sku,
              qty: w.qty, costPrice: Number(w.cost_price) || 0, receivedDate: w.received_date,
              status: w.status, source: w.source,
            })),
            invoices: (invRes.data || []).map((i: any): DelegateInvoice => ({
              id: i.id, number: i.number, date: i.date, type: i.type, party: i.party,
              customerId: i.customer_id, items: (i.delegate_invoice_items || []).map((it: any) => ({
                productId: it.product_id, description: it.description, qty: it.qty,
                price: Number(it.price) || 0, total: Number(it.total) || 0,
              })),
              subtotal: Number(i.subtotal) || 0, tax: Number(i.tax) || 0, total: Number(i.total) || 0,
              paidAmount: Number(i.paid_amount) || 0, status: i.status,
              paymentMethod: i.payment_method, confirmedAt: i.confirmed_at,
            })),
            transactions: (txRes.data || []).map((t: any): DelegateTransaction => ({
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
          } as Delegate
        }))
        set({ delegates: delegatesWithData, loading: false })
      },

      async addDelegate({ name, phone, email, zone, username, password }) {
        const id = `DEL-${String(get().delegates.length + 1).padStart(3, '0')}`
        const avatar = name.split(' ').slice(0, 2).map(w => w[0]).join('')
        const finalUsername = username?.trim() || generateUsername(name)
        const finalPassword = password || generatePassword()
        const newDel: Delegate = {
          id, name, phone, email, zone,
          status: 'active',
          username: finalUsername,
          password: finalPassword,
          avatar,
          location: { lat: 24.7136, lng: 46.6753, address: 'غير محدد', timestamp: new Date().toISOString() },
          locationHistory: [],
          warehouse: [],
          invoices: [],
          transactions: [],
          stats: { totalSales: 0, totalPurchases: 0, collected: 0, balance: 0, externalCredit: 0, expenses: 0, companyEntrusted: 0 },
        }

        if (isSupabaseConfigured()) {
          await supabase.from('delegates').insert({
            id, name, phone: phone || null, email: email || null, zone: zone || null,
            username: finalUsername, password_hash: finalPassword, avatar,
          })
        }
        set(state => ({ delegates: [...state.delegates, newDel] }))
        return newDel
      },

      async setDelegateStatus(delegateId, status) {
        if (isSupabaseConfigured()) await supabase.from('delegates').update({ status }).eq('id', delegateId)
        set(state => ({ delegates: state.delegates.map(d => d.id === delegateId ? { ...d, status } : d) }))
      },

      validateLogin(username, password) {
        return get().delegates.find(d => d.username === username && d.password === password) || null
      },

      async addInvoice(delegateId, invoice) {
        const year = new Date().getFullYear()
        const count = (get().delegates.find(d => d.id === delegateId)?.invoices.length || 0) + 1
        const newInvoice: DelegateInvoice = { ...invoice, id: `DINV-${Date.now()}`, number: `D-${year}-${String(count).padStart(3, '0')}` }

        if (isSupabaseConfigured()) {
          const { data: inserted } = await supabase.from('delegate_invoices').insert({
            delegate_id: delegateId, number: newInvoice.number, date: invoice.date,
            type: invoice.type, party: invoice.party, customer_id: invoice.customerId || null,
            subtotal: invoice.subtotal, tax: invoice.tax, total: invoice.total,
            paid_amount: invoice.paidAmount || 0, status: invoice.status,
            payment_method: invoice.paymentMethod || null,
          }).select().single()
          if (inserted && invoice.items.length > 0) {
            await supabase.from('delegate_invoice_items').insert(
              invoice.items.map(it => ({ invoice_id: inserted.id, product_id: it.productId || null, description: it.description, qty: it.qty, price: it.price, total: it.total }))
            )
          }
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

      confirmDelegateInvoice(delegateId, invoiceId) {
        const delegate = get().delegates.find(d => d.id === delegateId)
        if (!delegate) return { success: false, failedItem: 'المندوب غير موجود' }
        const invoice = delegate.invoices.find(inv => inv.id === invoiceId)
        if (!invoice) return { success: false, failedItem: 'الفاتورة غير موجودة' }
        if (invoice.type !== 'sale') return { success: false, failedItem: 'التأكيد للمبيعات فقط' }
        for (const item of invoice.items) {
          if (!item.productId) continue
          const whItem = delegate.warehouse.find(w => w.productId === item.productId && w.status === 'in-stock')
          if (!whItem || whItem.qty < item.qty) return { success: false, failedItem: item.description }
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            let warehouse = [...d.warehouse]
            for (const item of invoice.items) {
              if (!item.productId) continue
              warehouse = warehouse.map(w => {
                if (w.productId !== item.productId || w.status !== 'in-stock') return w
                const newQty = w.qty - item.qty
                return newQty <= 0 ? { ...w, qty: 0, status: 'transferred' as const } : { ...w, qty: newQty }
              }).filter(w => w.qty > 0 || w.status !== 'transferred')
            }
            return {
              ...d, warehouse,
              invoices: d.invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'confirmed' as const, confirmedAt: new Date().toISOString().slice(0, 10) } : inv),
            }
          }),
        }))
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

      async transferToMainWarehouse(delegateId, warehouseItemId, qty) {
        if (isSupabaseConfigured()) {
          const item = get().delegates.find(d => d.id === delegateId)?.warehouse.find(w => w.id === warehouseItemId)
          if (item) {
            await supabase.from('delegate_warehouse').update({ qty: item.qty - qty }).eq('id', warehouseItemId)
          }
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            return { ...d, warehouse: d.warehouse.map(w => w.id !== warehouseItemId ? w : { ...w, qty: w.qty - qty }).filter(w => w.qty > 0) }
          }),
        }))
      },

      async remitToCompany(delegateId, amount, description) {
        if (isSupabaseConfigured()) {
          await supabase.from('delegate_transactions').insert({
            delegate_id: delegateId, date: new Date().toISOString().slice(0, 10),
            type: 'remittance', amount: -amount, description,
            reference: `REM-${Date.now()}`,
          })
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const tx: DelegateTransaction = { id: `TRX-${Date.now()}`, date: new Date().toISOString().slice(0, 10), type: 'remittance', amount: -amount, description, reference: `REM-${Date.now()}`, balanceAfter: d.stats.balance }
            return { ...d, transactions: [tx, ...d.transactions], stats: { ...d.stats, companyEntrusted: Math.max(0, d.stats.companyEntrusted - amount) } }
          }),
        }))
      },
    }),
    { name: 'sahl-delegates-v3' }
  )
)
