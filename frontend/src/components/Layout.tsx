import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import OfflineIndicator from './OfflineIndicator'

function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">Окулус-Фельдшер</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.full_name}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{user?.role === 'doctor' ? 'Врач' : 'Хирург'}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-700">
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <Outlet />
      </main>
      <OfflineIndicator />
    </div>
  )
}

export default Layout
