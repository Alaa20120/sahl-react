import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DELEGATES,
  type Delegate,
  type DelegateTransaction,
  type DelegateWarehouseItem,
  type DelegateInvoice,
} from '@/lib/mock-data/delegates'

interface DelegateStore {
  delegates: Delegate[]
  addDelegate: (data: { name: string; phone: string; email: string; zone: string; username?: string; password?: string }) => Delegate
  setDelegateStatus: (delegateId: string, status: 'active' | 'inactive') => void
  addInvoice: (delegateId: string, invoice: Omit<DelegateInvoice, 'id' | 'number'>) => DelegateInvoice
  updateInvoiceStatus: (delegateId: string, invoiceId: string, status: DelegateInvoice['status']) => void
  payDelegateInvoice: (delegateId: string, invoiceId: string, amount: number) => void
  confirmDelegateInvoice: (delegateId: string, invoiceId: string) => { success: boolean; failedItem?: string }
  addCollectionTransaction: (delegateId: string, amount: number, description: string, reference?: string) => void
  deductFromWarehouse: (delegateId: string, productId: string, qty: number) => boolean
  addToWarehouse: (delegateId: string, item: Omit<DelegateWarehouseItem, 'id' | 'status'>) => void
  withdrawFromDelegate: (delegateId: string, amount: number, description: string) => void
  transferToMainWarehouse: (delegateId: string, warehouseItemId: string, qty: number) => void
  remitToCompany: (delegateId: string, amount: number, description: string) => void
  validateLogin: (username: string, password: string) => Delegate | null
}

function generateUsername(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0].toLowerCase()}.${parts[parts.length - 1].toLowerCase()}`
  }
  return name.toLowerCase().replace(/\s+/g, '.')
}

function generatePassword(): string {
  return Math.random().toString(36).slice(-6) + Math.floor(Math.random() * 100)
}

export const useDelegateStore = create<DelegateStore>()(
  persist(
    (set, get) => ({
      delegates: DELEGATES,

      addDelegate({ name, phone, email, zone, username, password }) {
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
        set(state => ({ delegates: [...state.delegates, newDel] }))
        return newDel as Delegate
      },

      setDelegateStatus(delegateId, status) {
        set(state => ({
          delegates: state.delegates.map(d =>
            d.id === delegateId ? { ...d, status } : d
          ),
        }))
      },

      validateLogin(username, password) {
        const d = get().delegates.find(
          del => del.username === username && del.password === password
        )
        return d || null
      },

      addInvoice(delegateId, invoice) {
        const year = new Date().getFullYear()
        const count = (get().delegates.find(d => d.id === delegateId)?.invoices.length || 0) + 1
        const newInvoice: DelegateInvoice = {
          ...invoice,
          id: `DINV-${Date.now()}`,
          number: `D-${year}-${String(count).padStart(3, '0')}`,
        }
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const totalSales = d.stats.totalSales + (invoice.type === 'sale' ? invoice.total : 0)
            const totalPurchases = d.stats.totalPurchases + (invoice.type === 'purchase' ? invoice.total : 0)
            const externalCredit = invoice.type === 'sale' && invoice.status !== 'paid'
              ? d.stats.externalCredit + invoice.total
              : d.stats.externalCredit
            return {
              ...d,
              invoices: [newInvoice, ...d.invoices],
              stats: { ...d.stats, totalSales, totalPurchases, externalCredit },
            }
          }),
        }))
        return newInvoice
      },

      updateInvoiceStatus(delegateId, invoiceId, status) {
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            return {
              ...d,
              invoices: d.invoices.map(inv =>
                inv.id === invoiceId ? { ...inv, status } : inv
              ),
            }
          }),
        }))
      },

      payDelegateInvoice(delegateId, invoiceId, amount) {
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const invoice = d.invoices.find(inv => inv.id === invoiceId)
            const wasPending = invoice?.status === 'pending' || invoice?.status === 'overdue'
            return {
              ...d,
              invoices: d.invoices.map(inv => {
                if (inv.id !== invoiceId) return inv
                const newPaid = (inv.paidAmount ?? 0) + amount
                const newStatus: DelegateInvoice['status'] = newPaid >= inv.total ? 'paid' : 'pending'
                return { ...inv, paidAmount: newPaid, status: newStatus }
              }),
              stats: {
                ...d.stats,
                // When paying a pending invoice: reduce externalCredit AND increase collected balance
                externalCredit: wasPending ? Math.max(0, d.stats.externalCredit - amount) : d.stats.externalCredit,
                balance: d.stats.balance + amount,
              },
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

        // Check warehouse availability for all items
        for (const item of invoice.items) {
          if (!item.productId) continue
          const whItem = delegate.warehouse.find(w => w.productId === item.productId && w.status === 'in-stock')
          if (!whItem || whItem.qty < item.qty) {
            return { success: false, failedItem: item.description }
          }
        }

        // All available — deduct and confirm
        let success = true
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            let warehouse = [...d.warehouse]
            for (const item of invoice.items) {
              if (!item.productId) continue
              warehouse = warehouse.map(w => {
                if (w.productId !== item.productId || w.status !== 'in-stock') return w
                const newQty = w.qty - item.qty
                return newQty <= 0
                  ? { ...w, qty: 0, status: 'transferred' as const }
                  : { ...w, qty: newQty }
              }).filter(w => w.qty > 0 || w.status !== 'transferred')
            }
            const collectionTx: DelegateTransaction = {
              id: `TRX-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              type: 'collection',
              amount: invoice.total,
              description: `تأكيد تسليم ${invoice.number}`,
              reference: invoice.number,
              balanceAfter: d.stats.balance + (invoice.paymentMethod === 'cash' ? invoice.total : 0),
            }
            return {
              ...d,
              warehouse,
              invoices: d.invoices.map(inv =>
                inv.id === invoiceId
                  ? { ...inv, status: 'confirmed' as const, confirmedAt: new Date().toISOString().slice(0, 10) }
                  : inv
              ),
              transactions: [collectionTx, ...d.transactions],
            }
          }),
        }))
        return { success }
      },

      addCollectionTransaction(delegateId, amount, description, reference) {
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const tx: DelegateTransaction = {
              id: `TRX-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              type: 'collection',
              amount,
              description,
              reference,
              balanceAfter: d.stats.balance + amount,
            }
            return {
              ...d,
              transactions: [tx, ...d.transactions],
              stats: { ...d.stats, balance: d.stats.balance + amount },
            }
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
            return {
              ...d,
              warehouse: d.warehouse.map(w => {
                if (w.id !== item.id) return w
                const newQty = w.qty - qty
                return newQty <= 0
                  ? { ...w, qty: 0, status: 'transferred' as const }
                  : { ...w, qty: newQty }
              }).filter(w => w.qty > 0 || w.status !== 'transferred'),
            }
          }),
        }))
        return success
      },

      addToWarehouse(delegateId, item) {
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const itemSource = item.source ?? 'purchased'
            const existing = d.warehouse.find(
              w => w.productId === item.productId && w.status === 'in-stock' && (w.source ?? 'purchased') === itemSource
            )
            const companyIncrease = itemSource === 'company' ? item.qty * item.costPrice : 0
            if (existing) {
              return {
                ...d,
                warehouse: d.warehouse.map(w =>
                  w.id === existing.id ? { ...w, qty: w.qty + item.qty } : w
                ),
                stats: { ...d.stats, companyEntrusted: d.stats.companyEntrusted + companyIncrease },
              }
            }
            const newItem: DelegateWarehouseItem = { ...item, id: `WH-${Date.now()}`, status: 'in-stock', source: itemSource }
            return {
              ...d,
              warehouse: [...d.warehouse, newItem],
              stats: { ...d.stats, companyEntrusted: d.stats.companyEntrusted + companyIncrease },
            }
          }),
        }))
      },

      withdrawFromDelegate(delegateId, amount, description) {
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const tx: DelegateTransaction = {
              id: `TRX-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              type: 'withdrawal',
              amount: -amount,
              description,
              reference: `WD-${Date.now()}`,
              balanceAfter: d.stats.balance - amount,
            }
            return {
              ...d,
              transactions: [tx, ...d.transactions],
              stats: { ...d.stats, balance: d.stats.balance - amount },
            }
          }),
        }))
      },

      transferToMainWarehouse(delegateId, warehouseItemId, qty) {
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const item = d.warehouse.find(w => w.id === warehouseItemId)
            const companyDeduct = item?.source === 'company'
              ? Math.min(qty, item.qty) * item.costPrice
              : 0
            return {
              ...d,
              warehouse: d.warehouse.map(w => {
                if (w.id !== warehouseItemId) return w
                const newQty = w.qty - qty
                return { ...w, qty: newQty, status: newQty <= 0 ? 'transferred' as const : w.status }
              }).filter(w => w.qty > 0),
              stats: { ...d.stats, companyEntrusted: Math.max(0, d.stats.companyEntrusted - companyDeduct) },
            }
          }),
        }))
      },

      remitToCompany(delegateId, amount, description) {
        set(state => ({
          delegates: state.delegates.map(d => {
            if (d.id !== delegateId) return d
            const tx: DelegateTransaction = {
              id: `TRX-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              type: 'remittance',
              amount: -amount,
              description,
              reference: `REM-${Date.now()}`,
              balanceAfter: d.stats.balance,
            }
            return {
              ...d,
              transactions: [tx, ...d.transactions],
              stats: { ...d.stats, companyEntrusted: Math.max(0, d.stats.companyEntrusted - amount) },
            }
          }),
        }))
      },
    }),
    { name: 'sahl-delegates-v3' }
  )
)
