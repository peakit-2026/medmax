import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <span className="text-lg font-semibold">Окулус-Фельдшер</span>
        <div className="flex items-center gap-4">
          <span>{user?.full_name}</span>
          <span className="text-sm bg-gray-200 px-2 py-1 rounded">{user?.role}</span>
          <button onClick={logout} className="text-red-600">
            Выйти
          </button>
        </div>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
