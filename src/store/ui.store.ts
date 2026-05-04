import { create } from 'zustand'

interface UiState {
  notifOpen: boolean
  searchOpen: boolean
  notifCount: number
  sidebarCollapsed: boolean
  openNotif: () => void
  closeNotif: () => void
  openSearch: () => void
  closeSearch: () => void
  setNotifCount: (n: number) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  notifOpen: false,
  searchOpen: false,
  notifCount: 5,
  sidebarCollapsed: false,
  openNotif: () => set({ notifOpen: true }),
  closeNotif: () => set({ notifOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  setNotifCount: (n) => set({ notifCount: n }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
