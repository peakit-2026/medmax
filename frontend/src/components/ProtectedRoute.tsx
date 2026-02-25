import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
