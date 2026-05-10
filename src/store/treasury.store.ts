import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch } from '@/lib/supabase'
import { TRANSACTIONS, ACCOUNTS, type Transaction, type TxCategory, type TxType } from '@/lib/mock-data/treasury'

interface TreasuryAccount {
  id: string
  label: string
  balance: number
  icon: string
  color: string
}

interface TreasuryStore {
  transactions: Transaction[]
  accounts: TreasuryAccount[]
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  addTransaction: (data: { date: string; description: string; type: TxType; category: TxCategory; amount: number; account: string; ref?: string }) => Promise<void>
}

export const useTreasuryStore = create<TreasuryStore>()(
  persist(
    (set, get) => ({
      transactions: TRANSACTIONS,
      accounts: ACCOUNTS,
      loading: false,
      error: null,

      async fetch() {
        if (!isSupabaseConfigured()) return
        set({ loading: true, error: null })
        try {
          const [txData, accData] = await Promise.all([
            supaFetch('treasury_transactions', { select: '*', limit: 500 }),
            supaFetch('treasury_accounts', { select: '*', limit: 100 }),
          ])
          const mappedTx = (txData || []).map((t: any): Transaction => ({
            id: t.id,
            date: t.date,
            description: t.description,
            type: t.type,
            category: t.category,
            amount: Number(t.amount) || 0,
            balance: Number(t.balance) || 0,
            ref: t.ref || undefined,
            account: t.account_id,
          }))
          const mappedAcc = (accData || []).map((a: any): TreasuryAccount => ({
            id: a.id,
            label: a.label,
            balance: Number(a.balance) || 0,
            icon: a.icon || 'fa-wallet',
            color: a.color || '#2563EB',
          }))
          set({ transactions: mappedTx, accounts: mappedAcc, loading: false })
        } catch (e: any) {
          set({ error: e.message, loading: false })
        }
      },

      async addTransaction(data) {
        const state = get()
        const accountIndex = state.accounts.findIndex(a => a.id === data.account)
        if (accountIndex === -1) return

        const accounts = [...state.accounts]
        const acc = { ...accounts[accountIndex] }
        if (data.type === 'in') acc.balance += data.amount
        else acc.balance -= data.amount
        accounts[accountIndex] = acc

        const newTx: Transaction = {
          id: `TX-${new Date().getFullYear()}-${String(state.transactions.length + 1).padStart(3, '0')}`,
          ...data,
          balance: acc.balance,
        }

        // Update local state immediately
        set({ transactions: [newTx, ...state.transactions], accounts })

        // Persist to Supabase
        if (isSupabaseConfigured()) {
          await supaFetch('treasury_transactions', {
            method: 'POST',
            body: {
              date: data.date,
              description: data.description,
              type: data.type,
              category: data.category,
              amount: data.amount,
              balance: acc.balance,
              account_id: data.account,
              ref: data.ref || null,
            },
          })
          await supaFetch('treasury_accounts', {
            method: 'PATCH',
            filter: 'id=eq.' + data.account,
            body: { balance: acc.balance },
          })
        }
      },
    }),
    { name: 'sahl-treasury-v6' }
  )
)
