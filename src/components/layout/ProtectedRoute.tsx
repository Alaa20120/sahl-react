import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const location = useLocation()

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
