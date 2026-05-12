import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supaFetch, supabase } from '@/lib/supabase'
import { type Employee } from '@/lib/mock-data/hr'
import { useTreasuryStore } from './treasury.store'

interface SalaryPayment {
  id: string
  employeeId?: string
  delegateId?: string
  name: string
  month: string
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  paidAt: string
}

interface PayrollOverride {
  id: string
  employeeId?: string
  delegateId?: string
  month: string
  basicSalary?: number
  allowances?: number
  deductions?: number
  advance?: number
}

interface HRStore {
  employees: Employee[]
  salaryPayments: SalaryPayment[]
  payrollOverrides: Record<string, { basic?: number; allowances?: number; deductions?: number; advance?: number }>
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  addEmployee: (data: Omit<Employee, 'id'>) => Promise<void>
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>

  // Salary operations
  addSalaryPayment: (payment: Omit<SalaryPayment, 'id' | 'paidAt'>) => Promise<void>
  getEmployeeSalaryHistory: (employeeId: string) => SalaryPayment[]
  getMonthSalaryPayments: (month: string) => SalaryPayment[]
  runPayroll: (month: string, items: { employeeId?: string; delegateId?: string; name: string; basicSalary: number; allowances: number; deductions: number; netSalary: number }[]) => Promise<void>

  // Payroll override operations
  fetchPayrollOverrides: (month: string) => Promise<void>
  savePayrollOverride: (data: { personId: string; employeeId?: string; delegateId?: string; month: string; basicSalary?: number; allowances?: number; deductions?: number; advance?: number }) => Promise<void>
}

export const useHRStore = create<HRStore>()(
  persist(
    (set, get) => ({
      employees: [],
      salaryPayments: [],
      payrollOverrides: {},
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
        let dbId = `EMP-${String(get().employees.length + 1).padStart(3, '0')}`

        if (isSupabaseConfigured()) {
          const inserted = await supaFetch('employees', {
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
          const row = Array.isArray(inserted) ? inserted[0] : inserted
          if (row?.id) dbId = row.id
        }
        const employee: Employee = { ...data, id: dbId }
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

      async deleteEmployee(id) {
        if (isSupabaseConfigured()) {
          await supaFetch('employees', { method: 'DELETE', filter: 'id=eq.' + id })
        }
        set(state => ({
          employees: state.employees.filter(e => e.id !== id),
        }))
      },

      async addSalaryPayment(payment) {
        const id = `SAL-${Date.now()}-${Math.random().toString(36).slice(-4)}`
        const paidAt = new Date().toISOString()
        const newPayment: SalaryPayment = { ...payment, id, paidAt }

        if (isSupabaseConfigured()) {
          await supaFetch('salary_payments', {
            method: 'POST',
            body: {
              employee_id: payment.employeeId || null,
              delegate_id: payment.delegateId || null,
              month: payment.month,
              basic_salary: payment.basicSalary,
              allowances: payment.allowances,
              deductions: payment.deductions,
              net_salary: payment.netSalary,
              paid_at: paidAt,
            },
          })
        }
        set(state => ({ salaryPayments: [newPayment, ...state.salaryPayments] }))
      },

      getEmployeeSalaryHistory(employeeId) {
        return get().salaryPayments.filter(p => p.employeeId === employeeId || p.delegateId === employeeId)
      },

      getMonthSalaryPayments(month) {
        return get().salaryPayments.filter(p => p.month === month)
      },

      async runPayroll(month, items) {
        const totalNet = items.reduce((s, i) => s + i.netSalary, 0)

        // Deduct from treasury
        await useTreasuryStore.getState().addTransaction({
          date: new Date().toISOString().slice(0, 10),
          description: `مسير رواتب شهر ${month} — ${items.length} موظف/مندوب`,
          type: 'out',
          category: 'salary',
          amount: totalNet,
          account: 'bank',
          ref: `PAYROLL-${month}`,
        })

        // Record individual payments
        for (const item of items) {
          await get().addSalaryPayment({
            employeeId: item.employeeId,
            delegateId: item.delegateId,
            name: item.name,
            month,
            basicSalary: item.basicSalary,
            allowances: item.allowances,
            deductions: item.deductions,
            netSalary: item.netSalary,
          })
        }
      },

      async fetchPayrollOverrides(month: string) {
        if (!isSupabaseConfigured()) return
        try {
          const data = await supaFetch('payroll_overrides', { select: '*', filter: `month=eq.${month}`, limit: 2000 })
          const mapped: Record<string, { basic?: number; allowances?: number; deductions?: number; advance?: number }> = {}
          for (const o of (data || [])) {
            const pid = o.employee_id || o.delegate_id
            if (!pid) continue
            mapped[pid] = {
              basic: o.basic_salary !== null ? Number(o.basic_salary) : undefined,
              allowances: o.allowances !== null ? Number(o.allowances) : undefined,
              deductions: o.deductions !== null ? Number(o.deductions) : undefined,
              advance: o.advance !== null ? Number(o.advance) : undefined,
            }
          }
          set({ payrollOverrides: mapped })
        } catch (e: any) {
          set({ error: e.message })
        }
      },

      async savePayrollOverride(data) {
        const { personId, employeeId, delegateId, month, basicSalary, allowances, deductions, advance } = data
        if (!personId) return

        const body: any = {
          month,
          basic_salary: basicSalary ?? null,
          allowances: allowances ?? null,
          deductions: deductions ?? null,
          advance: advance ?? null,
        }
        if (employeeId) body.employee_id = employeeId
        if (delegateId) body.delegate_id = delegateId

        if (isSupabaseConfigured()) {
          // Try upsert via POST with onConflict
          const { error } = await supabase
            .from('payroll_overrides')
            .upsert(body, { onConflict: employeeId ? 'employee_id,month' : 'delegate_id,month' })
          if (error) {
            console.error('Failed to save payroll override:', error)
          }
        }

        // Update local state
        set(state => ({
          payrollOverrides: {
            ...state.payrollOverrides,
            [personId]: { basic: basicSalary, allowances, deductions, advance },
          },
        }))
      },
    }),
    { name: 'sahl-hr-v2' }
  )
)
