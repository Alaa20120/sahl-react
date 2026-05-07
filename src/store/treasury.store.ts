import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
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
        const [txRes, accRes] = await Promise.all([
          supabase.from('treasury_transactions').select('*').order('created_at', { ascending: false }),
          supabase.from('treasury_accounts').select('*'),
        ])
        if (txRes.error || accRes.error) {
          set({ error: (txRes.error || accRes.error)?.message || 'Unknown error', loading: false })
        } else {
          const mappedTx = (txRes.data || []).map((t: any): Transaction => ({
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
          const mappedAcc = (accRes.data || []).map((a: any): TreasuryAccount => ({
            id: a.id,
            label: a.label,
            balance: Number(a.balance) || 0,
            icon: a.icon || 'fa-wallet',
            color: a.color || '#2563EB',
          }))
          set({ transactions: mappedTx, accounts: mappedAcc, loading: false })
        }
      },

      async addTransaction(data) {
        set(state => {
          const accountIndex = state.accounts.findIndex(a => a.id === data.account)
          if (accountIndex === -1) return state

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

          if (isSupabaseConfigured()) {
            supabase.from('treasury_transactions').insert({
              date: data.date,
              description: data.description,
              type: data.type,
              category: data.category,
              amount: data.amount,
              balance: acc.balance,
              account_id: data.account,
              ref: data.ref || null,
            })
            supabase.from('treasury_accounts').update({ balance: acc.balance }).eq('id', data.account)
          }

          return { transactions: [newTx, ...state.transactions], accounts }
        })
      },
    }),
    { name: 'sahl-treasury-v3' }
  )
)
