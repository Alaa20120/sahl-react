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

const NAV: NavEntry[] = [
  { label: 'الرئيسية',            icon: 'fa-th-large',       href: '/erp/dashboard' },
  { label: 'التقارير المالية',     icon: 'fa-chart-line',     href: '/erp/financial-reports' },
  { label: 'التحليلات المتقدمة',   icon: 'fa-chart-bar',      href: '/erp/analytics' },
  { sep: true },
  { label: 'الفواتير',             icon: 'fa-file-invoice',   href: '/erp/invoices' },
  { label: 'المشتريات',            icon: 'fa-shopping-cart',  href: '/erp/purchases' },
  { label: 'نقطة البيع',           icon: 'fa-cash-register',  href: '/erp/pos' },
  { label: 'إدارة المخزون',        icon: 'fa-warehouse',      href: '/erp/inventory' },
  { sep: true },
  { label: 'CRM والمبيعات',        icon: 'fa-funnel-dollar',  href: '/erp/crm' },
  { label: 'الموردون والعملاء',    icon: 'fa-handshake',      href: '/erp/customers' },
  { label: 'المندوبون',            icon: 'fa-user-tie',       href: '/erp/delegates' },
  { label: 'الموارد البشرية',      icon: 'fa-users',          href: '/erp/hr' },
  { sep: true },
  { label: 'الخزينة',              icon: 'fa-university',     href: '/erp/treasury' },
  { label: 'المصروفات والسلف',     icon: 'fa-receipt',        href: '/erp/expenses' },
  { label: 'الميزانية التقديرية',  icon: 'fa-balance-scale',  href: '/erp/budget' },
  { label: 'الأصول الثابتة',       icon: 'fa-building',       href: '/erp/fixed-assets' },
  { label: 'ZATCA والضريبة',       icon: 'fa-shield-alt',     href: '/erp/zatca' },
  { sep: true },
  { label: 'التقارير',             icon: 'fa-scroll',         href: '/erp/reports' },
  { label: 'كشف الحساب',           icon: 'fa-file-alt',       href: '/erp/account-statement' },
  { label: 'القوالب',              icon: 'fa-copy',           href: '/erp/templates' },
  { sep: true },
  { label: 'المستخدمون',           icon: 'fa-users-cog',      href: '/erp/users' },
  { label: 'الإعدادات',            icon: 'fa-cog',            href: '/erp/settings' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const { sidebarCollapsed, toggleSidebar } = useUiStore()

  const handleLogout = () => {
    logout()
    toast('تم تسجيل الخروج بنجاح', 'success')
    navigate('/', { replace: true })
  }

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
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
      </div>

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
            >
              <i className={`fa ${item.icon} nav-icon`} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/erp/help" title={sidebarCollapsed ? 'المساعدة' : undefined} className="nav-item">
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
  )
}
