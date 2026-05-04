import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import NotificationsDrawer from './NotificationsDrawer'
import GlobalSearch from './GlobalSearch'

export default function AppShell() {
  return (
    <div className="app">
      <Sidebar />
      <Topbar />
      <main className="main">
        <Outlet />
      </main>
      <NotificationsDrawer />
      <GlobalSearch />
    </div>
  )
}
