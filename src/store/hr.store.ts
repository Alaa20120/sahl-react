import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch } from '@/lib/supabase'
import { EMPLOYEES, type Employee } from '@/lib/mock-data/hr'

interface HRStore {
  employees: Employee[]
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  addEmployee: (data: Omit<Employee, 'id'>) => Promise<void>
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>
}

export const useHRStore = create<HRStore>()(
  persist(
    (set, get) => ({
      employees: EMPLOYEES,
      loading: false,
      error: null,

      async fetch() {
        if (!isSupabaseConfigured()) return
        set({ loading: true, error: null })
        try {
          const data = await supaFetch('employees', { select: '*', limit: 500 })
          const mapped = (data || []).map((e: any): Employee => ({
            id: e.id,
            name: e.name,
            position: e.position || '',
            department: e.department || '',
            salary: Number(e.salary) || 0,
            allowances: Number(e.allowances) || 0,
            deductions: Number(e.deductions) || 0,
            netSalary: Number(e.net_salary) || 0,
            phone: e.phone || '',
            email: e.email || '',
            iqama: e.iqama || undefined,
            joinDate: e.join_date || '',
            status: e.status || 'active',
          }))
          set({ employees: mapped, loading: false })
        } catch (e: any) {
          set({ error: e.message, loading: false })
        }
      },

      async addEmployee(data) {
        const id = `EMP-${String(get().employees.length + 1).padStart(3, '0')}`
        const employee: Employee = { ...data, id }

        if (isSupabaseConfigured()) {
          await supaFetch('employees', {
            method: 'POST',
            body: {
              name: data.name,
              position: data.position || null,
              department: data.department || null,
              salary: data.salary || 0,
              allowances: data.allowances || 0,
              deductions: data.deductions || 0,
              net_salary: data.netSalary || 0,
              phone: data.phone || null,
              email: data.email || null,
              iqama: data.iqama || null,
              join_date: data.joinDate || null,
              status: data.status || 'active',
            },
          })
        }
        set(state => ({ employees: [...state.employees, employee] }))
      },

      async updateEmployee(id, data) {
        const dbUpdates: any = {}
        if (data.name !== undefined) dbUpdates.name = data.name
        if (data.position !== undefined) dbUpdates.position = data.position
        if (data.department !== undefined) dbUpdates.department = data.department
        if (data.salary !== undefined) dbUpdates.salary = data.salary
        if (data.allowances !== undefined) dbUpdates.allowances = data.allowances
        if (data.deductions !== undefined) dbUpdates.deductions = data.deductions
        if (data.netSalary !== undefined) dbUpdates.net_salary = data.netSalary
        if (data.phone !== undefined) dbUpdates.phone = data.phone
        if (data.email !== undefined) dbUpdates.email = data.email
        if (data.iqama !== undefined) dbUpdates.iqama = data.iqama
        if (data.joinDate !== undefined) dbUpdates.join_date = data.joinDate
        if (data.status !== undefined) dbUpdates.status = data.status

        if (isSupabaseConfigured()) {
          await supaFetch('employees', { method: 'PATCH', filter: 'id=eq.' + id, body: dbUpdates })
        }
        set(state => ({
          employees: state.employees.map(e => e.id === id ? { ...e, ...data } : e),
        }))
      },
    }),
    { name: 'sahl-hr-v6' }
  )
)
