import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import ChecklistItemRow from '../../components/ChecklistItemRow'
import MediaGallery from '../../components/MediaGallery'
import VideoCall from '../../components/VideoCall'
import type { PatientWithChecklist } from '../../types/index'

function PatientCard() {
  const { id } = useParams()
  const [patient, setPatient] = useState<PatientWithChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVideo, setShowVideo] = useState(false)

  const fetchPatient = useCallback(() => {
    api.get<PatientWithChecklist>(`/patients/${id}`).then((res) => {
      setPatient(res.data)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  if (loading) return <div className="text-gray-500">Загрузка...</div>
  if (!patient) return <div className="text-red-600">Пациент не найден</div>

  return (
    <div>
      <Link to="/doctor" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
        &larr; К списку пациентов
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{patient.full_name}</h1>
        <button
          onClick={async () => {
            const res = await api.get(`/patients/${patient.id}/route-sheet`, { responseType: 'blob' })
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = 'route-sheet.pdf'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
        >
          Скачать маршрутный лист
        </button>
        <button
          onClick={() => setShowVideo(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          Видеоконсультация
        </button>
      </div>

      {showVideo && <VideoCall roomId={patient.id} onClose={() => setShowVideo(false)} />}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-lg">
          <span className="text-gray-500 text-sm">Дата рождения:</span>
          <span>{patient.birth_date}</span>

          <span className="text-gray-500 text-sm">СНИЛС:</span>
          <span>{patient.snils ?? '—'}</span>

          <span className="text-gray-500 text-sm">Полис ОМС:</span>
          <span>{patient.insurance_policy ?? '—'}</span>

          <span className="text-gray-500 text-sm">Код МКБ-10:</span>
          <span>{patient.diagnosis_code}</span>

          <span className="text-gray-500 text-sm">Диагноз:</span>
          <span>{patient.diagnosis_text}</span>

          <span className="text-gray-500 text-sm">Тип операции:</span>
          <span>{patient.operation_type}</span>

          <span className="text-gray-500 text-sm">Статус:</span>
          <span>
            <StatusBadge status={patient.status} />
          </span>

          <span className="text-gray-500 text-sm">Код доступа:</span>
          <span className="font-mono">{patient.access_code}</span>

          <span className="text-gray-500 text-sm">Дата операции:</span>
          <span>{patient.operation_date ?? '—'}</span>

          {patient.notes && (
            <>
              <span className="text-gray-500 text-sm">Примечания:</span>
              <span>{patient.notes}</span>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Чек-лист подготовки</h2>

        {patient.checklist.length === 0 ? (
          <p className="text-gray-500">Чек-лист пуст</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {patient.checklist.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                patientId={patient.id}
                onUpdate={fetchPatient}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <MediaGallery patientId={patient.id} />
      </div>
    </div>
  )
}

export default PatientCard
