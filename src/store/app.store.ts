import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  companyName: string
  currency: string
  vatRate: number
  branch: string
  fiscalYearStart: string
  setCompany: (name: string) => void
  setCurrency: (c: string) => void
  setVatRate: (r: number) => void
  setBranch: (b: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      companyName: 'شركة النور للتجارة',
      currency: 'SAR',
      vatRate: 15,
      branch: 'الرئيسي',
      fiscalYearStart: '01-01',
      setCompany: (name) => set({ companyName: name }),
      setCurrency: (currency) => set({ currency }),
      setVatRate: (vatRate) => set({ vatRate }),
      setBranch: (branch) => set({ branch }),
    }),
    { name: 'sahl-app' }
  )
)
