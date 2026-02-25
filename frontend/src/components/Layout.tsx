import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import OfflineIndicator from './OfflineIndicator'

function Layout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>MedMAX</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#374151' }}>{user?.full_name}</span>
            <span style={{ fontSize: '12px', background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '4px' }}>
              {user?.role === 'doctor' ? 'Врач' : 'Хирург'}
            </span>
            <button onClick={logout} style={{ fontSize: '14px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px' }}>
        <Outlet />
      </main>
      <OfflineIndicator />
    </div>
  )
}

export default Layout
