import { openDB } from 'idb'

const DB_NAME = 'medmax-offline'
const STORE_NAME = 'pending-requests'

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
    },
  })
}

export async function queueRequest(method: string, url: string, data?: unknown) {
  const db = await getDb()
  await db.add(STORE_NAME, { method, url, data, timestamp: Date.now() })
}

export async function getPendingRequests() {
  const db = await getDb()
  return db.getAll(STORE_NAME)
}

export async function clearPendingRequests() {
  const db = await getDb()
  await db.clear(STORE_NAME)
}

export async function syncPendingRequests() {
  const requests = await getPendingRequests()
  if (requests.length === 0) return 0

  let synced = 0
  const db = await getDb()

  for (const req of requests) {
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(req.url, {
        method: req.method,
        headers,
        body: req.data ? JSON.stringify(req.data) : undefined,
      })

      await db.delete(STORE_NAME, req.id)
      synced++
    } catch {
      break
    }
  }

  return synced
}
