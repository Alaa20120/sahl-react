import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import NotificationsDrawer from './NotificationsDrawer'
import GlobalSearch from './GlobalSearch'

export default function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="app">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <Topbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
      <main className="main">
        <Outlet />
      </main>
      <BottomNav />
      <NotificationsDrawer />
      <GlobalSearch />
    </div>
  )
}
