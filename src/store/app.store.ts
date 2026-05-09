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
  name: '',
  nameEn: '',
  cr: '',
  vat: '',
  phone: '',
  email: '',
  address: '',
  city: 'الرياض',
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
      companyName: '',

      updateCompany: (data) => set(state => ({
        company: { ...state.company, ...data },
        companyName: data.name ?? state.company.name,
      })),
      setCurrency: (currency) => set({ currency }),
      setVatRate: (vatRate) => set({ vatRate }),
      setBranch: (branch) => set({ branch }),
      setInvoiceNotes: (invoiceNotes) => set({ invoiceNotes }),
    }),
    { name: 'sahl-app-v2' }
  )
)
