import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { toast } from '@/lib/toast'

interface NavItem {
  label: string
  icon: string
  href: string
}

interface NavSep {
  sep: true
}

type NavEntry = NavItem | NavSep

const ADMIN_NAV: NavEntry[] = [
  { label: 'الرئيسية',            icon: 'fa-th-large',       href: '/erp/dashboard' },
  { label: 'التقارير والتحليلات',  icon: 'fa-chart-line',     href: '/erp/insights' },
  { sep: true },
  { label: 'الفواتير',             icon: 'fa-file-invoice',   href: '/erp/invoices' },
  { label: 'المشتريات',            icon: 'fa-shopping-cart',  href: '/erp/purchases' },
  { label: 'إدارة المخزون',        icon: 'fa-warehouse',      href: '/erp/inventory' },
  { sep: true },
  { label: 'الموردون والعملاء',    icon: 'fa-handshake',      href: '/erp/customers' },
  { label: 'أرصدة العملاء والموردين', icon: 'fa-balance-scale', href: '/erp/customers-balance' },
  { label: 'المندوبون',            icon: 'fa-user-tie',       href: '/erp/delegates' },
  { label: 'الموارد البشرية',      icon: 'fa-users',          href: '/erp/hr' },
  { sep: true },
  { label: 'الخزينة',              icon: 'fa-university',     href: '/erp/treasury' },
  { label: 'ZATCA والضريبة',       icon: 'fa-shield-alt',     href: '/erp/zatca' },
  { sep: true },
  { label: 'التقارير',             icon: 'fa-scroll',         href: '/erp/reports' },
  { label: 'كشف الحساب',           icon: 'fa-file-alt',       href: '/erp/account-statement' },
  { label: 'القوالب',              icon: 'fa-copy',           href: '/erp/templates' },
  { sep: true },
  { label: 'الإعدادات',            icon: 'fa-cog',            href: '/erp/settings' },
]

const DELEGATE_NAV: NavEntry[] = [
  { label: 'لوحة التحكم',          icon: 'fa-th-large',       href: '/delegate/home' },
  { sep: true },
  { label: 'نقطة البيع',           icon: 'fa-cash-register',  href: '/delegate/pos' },
  { label: 'فواتيري',              icon: 'fa-file-invoice',   href: '/delegate/invoices' },
  { label: 'مستودعي',              icon: 'fa-warehouse',      href: '/delegate/warehouse' },
  { label: 'العملاء',              icon: 'fa-handshake',      href: '/delegate/customers' },
  { sep: true },
  { label: 'الإعدادات',            icon: 'fa-cog',            href: '/delegate/settings' },
]

interface SidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { sidebarCollapsed, toggleSidebar } = useUiStore()

  const isDelegate = user?.role === 'delegate'
  const NAV = isDelegate ? DELEGATE_NAV : ADMIN_NAV

  const handleLogout = () => {
    logout()
    toast('تم تسجيل الخروج بنجاح', 'success')
    navigate('/', { replace: true })
  }

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={onCloseMobile}
      />
      <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileOpen ? ' open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-icon" style={{ background: 'none', padding: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="36" height="36">
              <rect x="8" y="8" width="104" height="104" rx="20" fill="#0D1117" />
              <rect x="24" y="68" width="8" height="20" fill="#FFFFFF" />
              <rect x="38" y="68" width="8" height="20" fill="#FFFFFF" />
              <rect x="52" y="68" width="8" height="20" fill="#FFFFFF" />
              <rect x="20" y="88" width="80" height="4" fill="#FFFFFF" />
              <circle cx="78" cy="48" r="10" fill="#FFFFFF" />
              <circle cx="78" cy="48" r="4" fill="#0D1117" />
              <rect x="94" y="24" width="6" height="56" fill="#FFFFFF" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="brand">سهل</div>
              <div className="edition">Enterprise v5.0</div>
            </>
          )}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            className="desktop-only"
            style={{
              marginRight: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 6,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            <i className={`fa ${sidebarCollapsed ? 'fa-chevron-left' : 'fa-chevron-right'}`} />
          </button>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="mobile-only"
            style={{
              marginRight: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 6,
              fontSize: 16,
              flexShrink: 0,
              display: 'none',
            }}
          >
            <i className="fa fa-times" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0,
              }}>
                {user.avatar || user.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              {!sidebarCollapsed && (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {isDelegate ? 'مندوب مبيعات' : user.role === 'admin' ? 'مدير النظام' : user.role}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {NAV.map((item, i) => {
            if ('sep' in item) {
              return <div key={i} style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            }
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <NavLink
                key={item.href}
                to={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`nav-item${active ? ' active' : ''}`}
                onClick={handleNavClick}
              >
                <i className={`fa ${item.icon} nav-icon`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink to={isDelegate ? '/delegate/settings' : '/erp/help'} title={sidebarCollapsed ? 'المساعدة' : undefined} className="nav-item" onClick={handleNavClick}>
            <i className="fa fa-question-circle nav-icon" />
            {!sidebarCollapsed && <span>المساعدة</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'تسجيل الخروج' : undefined}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}
          >
            <i className="fa fa-sign-out-alt nav-icon" />
            {!sidebarCollapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
