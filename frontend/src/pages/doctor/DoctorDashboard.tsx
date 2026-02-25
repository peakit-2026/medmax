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

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Пациенты</h1>
        <button
          onClick={() => navigate('/doctor/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Добавить пациента
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="bg-red-100 text-red-800 px-3 py-2 rounded">
          Консультация: {redCount}
        </div>
        <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded">
          Подготовка: {yellowCount}
        </div>
        <div className="bg-green-100 text-green-800 px-3 py-2 rounded">
          Готов: {greenCount}
        </div>
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
            <th className="p-2">Код доступа</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr
              key={p.id}
              onClick={() => navigate(`/doctor/patient/${p.id}`)}
              className="border-b cursor-pointer hover:bg-gray-50"
            >
              <td className="p-2">{p.full_name}</td>
              <td className="p-2">{p.diagnosis_text}</td>
              <td className="p-2">{p.operation_type}</td>
              <td className="p-2">
                <StatusBadge status={p.status} />
              </td>
              <td className="p-2 font-mono">{p.access_code}</td>
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

export default DoctorDashboard
