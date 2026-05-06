import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TRANSACTIONS, ACCOUNTS, type Transaction, type TxCategory, type TxType } from '@/lib/mock-data/treasury'

interface Account {
  id: string
  label: string
  balance: number
  icon: string
  color: string
}

interface TreasuryStore {
  transactions: Transaction[]
  accounts: Account[]
  addTransaction: (data: { date: string; description: string; type: TxType; category: TxCategory; amount: number; account: string; ref?: string }) => void
}

export const useTreasuryStore = create<TreasuryStore>()(
  persist(
    (set) => ({
      transactions: TRANSACTIONS,
      accounts: ACCOUNTS,

      addTransaction: (data) => set(state => {
        const accountIndex = state.accounts.findIndex(a => a.id === data.account)
        if (accountIndex === -1) return state

        const accounts = [...state.accounts]
        const acc = { ...accounts[accountIndex] }
        
        // Update account balance
        if (data.type === 'in') {
          acc.balance += data.amount
        } else {
          acc.balance -= data.amount
        }
        
        accounts[accountIndex] = acc

        const newTx: Transaction = {
          id: `TX-${new Date().getFullYear()}-${String(state.transactions.length + 1).padStart(3, '0')}`,
          ...data,
          balance: acc.balance,
        }

        return {
          transactions: [newTx, ...state.transactions],
          accounts
        }
      })
    }),
    { name: 'sahl-treasury-v3' }
  )
)
