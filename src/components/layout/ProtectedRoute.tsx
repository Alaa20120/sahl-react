import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hasHydrated = useAuthStore(s => s.hasHydrated)
  const location = useLocation()

  if (!hasHydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)', fontSize: 14, gap: 12 }}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: 20 }} />
        جارٍ التحميل...
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  const role = user.role

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  if (role === 'delegate' && location.pathname.startsWith('/erp')) {
    return <Navigate to="/delegate/home" replace />
  }

  if (role !== 'delegate' && location.pathname.startsWith('/delegate')) {
    return <Navigate to="/erp/dashboard" replace />
  }

  return <>{children}</>
}
