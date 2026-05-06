import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { initials } from '@/lib/format'

interface Props {
  onOpenSidebar: () => void
}

export default function Topbar({ onOpenSidebar }: Props) {
  const { openNotif, openSearch, notifCount } = useUiStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSearch])

  return (
    <header className="topbar">
      <div className="topbar-right">
        {/* Hamburger for mobile */}
        <button
          className="topbar-icon-btn mobile-menu-btn"
          onClick={onOpenSidebar}
          title="القائمة"
        >
          <i className="fa fa-bars" />
        </button>

        <div className="search-box desktop-only" onClick={openSearch} style={{ cursor: 'pointer' }}>
          <i className="fa fa-search icon" />
          <input
            readOnly
            placeholder="ابحث عن أي شيء... (Ctrl+K)"
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--border)', padding: '2px 6px', borderRadius: 4 }}>K</span>
        </div>

        {/* Mobile search icon */}
        <button
          className="topbar-icon-btn mobile-search-btn"
          onClick={openSearch}
          title="بحث"
        >
          <i className="fa fa-search" />
        </button>
      </div>

      <div className="topbar-left">
        <button className="topbar-icon-btn desktop-only" title="المساعدة" onClick={() => navigate('/erp/help')}>
          <i className="fa fa-question-circle" />
        </button>

        <button className="topbar-icon-btn" onClick={openNotif} title="الإشعارات">
          <i className="fa fa-bell" />
          {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
        </button>

        <div
          className="avatar-sm"
          title={user?.name || 'المستخدم'}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/erp/settings')}
        >
          {user ? initials(user.name) : 'أع'}
        </div>
      </div>
    </header>
  )
}
