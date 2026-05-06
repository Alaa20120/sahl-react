import { NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

const DELEGATE_LINKS = [
  { label: 'الرئيسية', icon: 'fa-th-large', href: '/delegate/home' },
  { label: 'نقطة البيع', icon: 'fa-cash-register', href: '/delegate/pos' },
  { label: 'فواتيري', icon: 'fa-file-invoice', href: '/delegate/invoices' },
  { label: 'مستودعي', icon: 'fa-warehouse', href: '/delegate/warehouse' },
  { label: 'العملاء', icon: 'fa-handshake', href: '/delegate/customers' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const user = useAuthStore(s => s.user)

  // Only show for delegates
  if (user?.role !== 'delegate') return null

  return (
    <nav className="bottom-nav">
      {DELEGATE_LINKS.map(link => {
        const active = pathname === link.href || pathname.startsWith(link.href + '/')
        return (
          <NavLink
            key={link.href}
            to={link.href}
            className={`bottom-nav-item${active ? ' active' : ''}`}
          >
            <i className={`fa ${link.icon}`} />
            <span>{link.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
