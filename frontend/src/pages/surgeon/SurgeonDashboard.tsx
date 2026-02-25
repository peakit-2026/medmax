import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import type { Patient } from '../../types/index'

type Filter = 'all' | 'yellow' | 'red' | 'green'

function SurgeonDashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Patient[]>('/patients').then((res) => {
      setPatients(res.data)
      setLoading(false)
    })
  }, [])

  const filtered = patients.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const yellowCount = patients.filter((p) => p.status === 'yellow').length
  const redCount = patients.filter((p) => p.status === 'red').length
  const greenCount = patients.filter((p) => p.status === 'green').length

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Кабинет хирурга</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded border ${filter === 'all' ? 'bg-gray-800 text-white' : ''}`}
        >
          Все ({patients.length})
        </button>
        <button
          onClick={() => setFilter('yellow')}
          className={`px-3 py-1 rounded border ${filter === 'yellow' ? 'bg-amber-600 text-white' : 'bg-amber-50'}`}
        >
          Ожидают проверки ({yellowCount})
        </button>
        <button
          onClick={() => setFilter('red')}
          className={`px-3 py-1 rounded border ${filter === 'red' ? 'bg-red-600 text-white' : 'bg-red-50'}`}
        >
          Требуют доработки ({redCount})
        </button>
        <button
          onClick={() => setFilter('green')}
          className={`px-3 py-1 rounded border ${filter === 'green' ? 'bg-green-600 text-white' : 'bg-green-50'}`}
        >
          Готовы ({greenCount})
        </button>
      </div>

      <input
        type="text"
        placeholder="Поиск по ФИО..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">ФИО</th>
            <th className="p-2">Диагноз</th>
            <th className="p-2">Тип операции</th>
            <th className="p-2">Статус</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr
              key={p.id}
              onClick={() => navigate(`/surgeon/patient/${p.id}`)}
              className="border-b cursor-pointer hover:bg-gray-50"
            >
              <td className="p-2">{p.full_name}</td>
              <td className="p-2">{p.diagnosis_text}</td>
              <td className="p-2">{p.operation_type}</td>
              <td className="p-2">
                <StatusBadge status={p.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p className="text-gray-500 mt-4 text-center">Нет пациентов</p>
      )}
    </div>
  )
}

export default SurgeonDashboard
