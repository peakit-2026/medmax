import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import OfflineIndicator from './OfflineIndicator'

function Layout() {
  return (
    <div className="flex h-screen bg-surface-secondary">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
      <OfflineIndicator />
    </div>
  )
}

export default Layout
