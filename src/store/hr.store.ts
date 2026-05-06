import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { EMPLOYEES, type Employee } from '@/lib/mock-data/hr'

interface HRStore {
  employees: Employee[]
  addEmployee: (data: Omit<Employee, 'id'>) => void
  updateEmployee: (id: string, data: Partial<Employee>) => void
}

export const useHRStore = create<HRStore>()(
  persist(
    (set, get) => ({
      employees: EMPLOYEES,

      addEmployee(data) {
        const id = `EMP-${String(get().employees.length + 1).padStart(3, '0')}`
        set(state => ({ employees: [...state.employees, { ...data, id }] }))
      },

      updateEmployee(id, data) {
        set(state => ({
          employees: state.employees.map(e => e.id === id ? { ...e, ...data } : e),
        }))
      },
    }),
    { name: 'sahl-hr-v1' }
  )
)
