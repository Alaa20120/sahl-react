import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch } from '@/lib/supabase'

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
  buildingNumber?: string
  postalCode?: string
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

  fetch: () => Promise<void>
  updateCompany: (data: Partial<CompanyInfo>) => Promise<void>
  setCurrency: (c: string) => Promise<void>
  setVatRate: (r: number) => Promise<void>
  setBranch: (b: string) => Promise<void>
  setInvoiceNotes: (n: string) => Promise<void>
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

async function saveCompanySettings(state: Partial<AppState>) {
  if (!isSupabaseConfigured()) return
  const body: any = { id: 'default', updated_at: new Date().toISOString() }
  if (state.company) {
    body.name = state.company.name
    body.name_en = state.company.nameEn
    body.cr = state.company.cr
    body.vat = state.company.vat
    body.phone = state.company.phone
    body.email = state.company.email
    body.address = state.company.address
    body.city = state.company.city
    body.country = state.company.country
    body.logo = state.company.logo
  }
  if (state.currency !== undefined) body.currency = state.currency
  if (state.vatRate !== undefined) body.vat_rate = state.vatRate
  if (state.branch !== undefined) body.branch = state.branch
  if (state.fiscalYearStart !== undefined) body.fiscal_year_start = state.fiscalYearStart
  if (state.invoiceNotes !== undefined) body.invoice_notes = state.invoiceNotes
  await supaFetch('company_settings', { method: 'POST', body })
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      company: DEFAULT_COMPANY,
      currency: 'SAR',
      vatRate: 15,
      branch: 'الرئيسي',
      fiscalYearStart: '01-01',
      invoiceNotes: 'شكراً لتعاملكم معنا. يُرجى الدفع خلال 30 يوماً من تاريخ الفاتورة.',
      companyName: 'شركتي',

      async fetch() {
        if (!isSupabaseConfigured()) return
        try {
          const data = await supaFetch('company_settings', { select: '*', filter: "id=eq.default" })
          const row = Array.isArray(data) ? data[0] : data
          if (!row) return
          const mapped: CompanyInfo = {
            name: row.name || DEFAULT_COMPANY.name,
            nameEn: row.name_en || DEFAULT_COMPANY.nameEn,
            cr: row.cr || '',
            vat: row.vat || '',
            phone: row.phone || '',
            email: row.email || '',
            address: row.address || '',
            city: row.city || '',
            country: row.country || DEFAULT_COMPANY.country,
            logo: row.logo || null,
          }
          set({
            company: mapped,
            companyName: mapped.name,
            currency: row.currency || 'SAR',
            vatRate: row.vat_rate ?? 15,
            branch: row.branch || 'الرئيسي',
            fiscalYearStart: row.fiscal_year_start || '01-01',
            invoiceNotes: row.invoice_notes || DEFAULT_COMPANY.name,
          })
        } catch (e: any) {
          console.error('Failed to fetch company settings:', e)
        }
      },

      async updateCompany(data) {
        const newCompany = { ...DEFAULT_COMPANY, ...get().company, ...data }
        set({ company: newCompany, companyName: newCompany.name })
        await saveCompanySettings({ company: newCompany })
      },

      async setCurrency(currency) {
        set({ currency })
        await saveCompanySettings({ currency })
      },

      async setVatRate(vatRate) {
        set({ vatRate })
        await saveCompanySettings({ vatRate })
      },

      async setBranch(branch) {
        set({ branch })
        await saveCompanySettings({ branch })
      },

      async setInvoiceNotes(invoiceNotes) {
        set({ invoiceNotes })
        await saveCompanySettings({ invoiceNotes })
      },
    }),
    { name: 'sahl-app-v2' }
  )
)
