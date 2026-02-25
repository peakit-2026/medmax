import { useState, useEffect } from 'react'
import { syncPendingRequests, getPendingRequests } from '../store/offline'

function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const updateOnline = () => setIsOnline(true)
    const updateOffline = () => setIsOnline(false)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOffline)

    getPendingRequests().then((r) => setPendingCount(r.length))

    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOffline)
    }
  }, [])

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      setSyncing(true)
      syncPendingRequests().then((synced) => {
        setPendingCount((prev) => prev - synced)
        setSyncing(false)
      })
    }
  }, [isOnline, pendingCount])

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-2 text-center text-sm text-white ${isOnline ? 'bg-blue-600' : 'bg-red-600'}`}>
      {!isOnline && 'Нет соединения — данные сохраняются локально'}
      {isOnline && syncing && `Синхронизация... (${pendingCount})`}
      {isOnline && !syncing && pendingCount > 0 && `Несинхронизированных записей: ${pendingCount}`}
    </div>
  )
}

export default OfflineIndicator
