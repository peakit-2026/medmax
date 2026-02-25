import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import type { Patient } from '../../types/index'

function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Patient[]>('/patients').then((res) => {
      setPatients(res.data)
      setLoading(false)
    })
  }, [])

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const redCount = patients.filter((p) => p.status === 'red').length
  const yellowCount = patients.filter((p) => p.status === 'yellow').length
  const greenCount = patients.filter((p) => p.status === 'green').length

  if (loading) return <div className="text-gray-500">Загрузка...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Пациенты</h1>
        <button
          onClick={() => navigate('/doctor/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Добавить пациента
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="bg-red-100 text-red-800 px-3 py-2 rounded text-sm font-medium">
          Консультация: {redCount}
        </div>
        <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded text-sm font-medium">
          Подготовка: {yellowCount}
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-medium">
          Готов: {greenCount}
        </div>
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
              <th className="px-4 py-3">Код доступа</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/doctor/patient/${p.id}`)}
                className="border-b cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-3">{p.full_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.diagnosis_text}</td>
                <td className="px-4 py-3 text-sm">{p.operation_type}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 font-mono text-sm">{p.access_code}</td>
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

export default DoctorDashboard
