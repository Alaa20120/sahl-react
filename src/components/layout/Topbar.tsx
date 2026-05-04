import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { initials } from '@/lib/format'

export default function Topbar() {
  const { openNotif, openSearch, notifCount, toggleSidebar } = useUiStore()
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
        <button className="topbar-icon-btn" onClick={toggleSidebar} title="تصغير/توسيع القائمة">
          <i className="fa fa-bars" />
        </button>

        <div className="search-box" onClick={openSearch} style={{ cursor: 'pointer' }}>
          <i className="fa fa-search icon" />
          <input
            readOnly
            placeholder="ابحث عن أي شيء... (Ctrl+K)"
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--border)', padding: '2px 6px', borderRadius: 4 }}>K</span>
        </div>
      </div>

      <div className="topbar-left">
        <button className="topbar-icon-btn" title="المساعدة" onClick={() => navigate('/erp/help')}>
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
