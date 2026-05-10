import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CompanyInfo {
  name: string
  nameEn: string
  cr: string
  vat: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  logo: string | null
}

interface AppState {
  company: CompanyInfo
  currency: string
  vatRate: number
  branch: string
  fiscalYearStart: string
  invoiceNotes: string

  // Legacy - kept for backward compat
  companyName: string

  updateCompany: (data: Partial<CompanyInfo>) => void
  setCurrency: (c: string) => void
  setVatRate: (r: number) => void
  setBranch: (b: string) => void
  setInvoiceNotes: (n: string) => void
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: 'شركتي',
  nameEn: 'My Company',
  cr: '',
  vat: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  country: 'المملكة العربية السعودية',
  logo: null,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      company: DEFAULT_COMPANY,
      currency: 'SAR',
      vatRate: 15,
      branch: 'الرئيسي',
      fiscalYearStart: '01-01',
      invoiceNotes: 'شكراً لتعاملكم معنا. يُرجى الدفع خلال 30 يوماً من تاريخ الفاتورة.',
      companyName: 'شركتي',

      updateCompany: (data) => set(state => {
        const newCompany = { ...state.company, ...data }
        return {
          company: newCompany,
          companyName: newCompany.name,
        }
      }),
      setCurrency: (currency) => set({ currency }),
      setVatRate: (vatRate) => set({ vatRate }),
      setBranch: (branch) => set({ branch }),
      setInvoiceNotes: (invoiceNotes) => set({ invoiceNotes }),
    }),
    { name: 'sahl-app-v2' }
  )
)
