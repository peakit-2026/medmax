import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { usePatientStore } from '../../store/patients'

type Filter = 'all' | 'yellow' | 'red' | 'green'

function SurgeonDashboard() {
  const patients = usePatientStore((s) => s.patientList)
  const fetchPatients = usePatientStore((s) => s.fetchPatients)
  const fetchPatient = usePatientStore((s) => s.fetchPatient)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchPatients()
  }, [])

  const filtered = patients.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const yellowCount = patients.filter((p) => p.status === 'yellow').length
  const redCount = patients.filter((p) => p.status === 'red').length
  const greenCount = patients.filter((p) => p.status === 'green').length

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Кабинет хирурга</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 rounded text-sm font-medium ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
        >
          Все ({patients.length})
        </button>
        <button
          onClick={() => setFilter('yellow')}
          className={`px-3 py-2 rounded text-sm font-medium ${filter === 'yellow' ? 'bg-amber-600 text-white' : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'}`}
        >
          Ожидают проверки ({yellowCount})
        </button>
        <button
          onClick={() => setFilter('red')}
          className={`px-3 py-2 rounded text-sm font-medium ${filter === 'red' ? 'bg-red-600 text-white' : 'bg-red-50 border border-red-200 text-red-800 hover:bg-red-100'}`}
        >
          Требуют доработки ({redCount})
        </button>
        <button
          onClick={() => setFilter('green')}
          className={`px-3 py-2 rounded text-sm font-medium ${filter === 'green' ? 'bg-green-600 text-white' : 'bg-green-50 border border-green-200 text-green-800 hover:bg-green-100'}`}
        >
          Готовы ({greenCount})
        </button>
      </div>

      <input
        type="text"
        placeholder="Поиск по ФИО..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-gray-300 px-3 py-2 rounded w-full mb-6"
      />

      <div className="bg-white rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">ФИО</th>
              <th className="px-4 py-3">Диагноз</th>
              <th className="px-4 py-3">Тип операции</th>
              <th className="px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/surgeon/patient/${p.id}`)}
                onMouseEnter={() => fetchPatient(p.id)}
                className="border-b cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3">{p.full_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.diagnosis_text}</td>
                <td className="px-4 py-3 text-sm">{p.operation_type}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 mt-6 text-center">Нет пациентов</p>
      )}
    </div>
  )
}

export default SurgeonDashboard
