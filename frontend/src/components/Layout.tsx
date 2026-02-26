import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import OfflineIndicator from './OfflineIndicator'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen bg-surface-secondary">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 flex items-center justify-center w-10 h-10 rounded-[12px] bg-surface border border-border cursor-pointer"
        style={{
          boxShadow: '0px 4px 2px 0px rgba(16,16,18,0.01), 0px 2px 2px 0px rgba(16,16,18,0.02), 0px 1px 1px 0px rgba(16,16,18,0.04), 0px 0px 1px 0px rgba(16,16,18,0.12)',
        }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: hidden on mobile unless open, always visible on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <Outlet />
      </main>
      <OfflineIndicator />
    </div>
  )
}

export default Layout
