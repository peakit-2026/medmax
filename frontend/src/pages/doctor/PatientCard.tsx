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

  if (loading) return <div>Загрузка...</div>
  if (!patient) return <div>Пациент не найден</div>

  return (
    <div>
      <Link to="/doctor" className="text-blue-600 mb-4 inline-block">
        &larr; К списку пациентов
      </Link>

      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-xl font-semibold">{patient.full_name}</h1>
        <a
          href={`/api/patients/${patient.id}/route-sheet`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-600 text-white px-4 py-2 rounded text-sm"
        >
          Скачать маршрутный лист
        </a>
        <button
          onClick={() => setShowVideo(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Видеоконсультация
        </button>
      </div>

      {showVideo && <VideoCall roomId={patient.id} onClose={() => setShowVideo(false)} />}

      <div className="grid grid-cols-2 gap-2 mb-6 max-w-lg">
        <span className="text-gray-600">Дата рождения:</span>
        <span>{patient.birth_date}</span>

        <span className="text-gray-600">СНИЛС:</span>
        <span>{patient.snils ?? '—'}</span>

        <span className="text-gray-600">Полис ОМС:</span>
        <span>{patient.insurance_policy ?? '—'}</span>

        <span className="text-gray-600">Код МКБ-10:</span>
        <span>{patient.diagnosis_code}</span>

        <span className="text-gray-600">Диагноз:</span>
        <span>{patient.diagnosis_text}</span>

        <span className="text-gray-600">Тип операции:</span>
        <span>{patient.operation_type}</span>

        <span className="text-gray-600">Статус:</span>
        <span>
          <StatusBadge status={patient.status} />
        </span>

        <span className="text-gray-600">Код доступа:</span>
        <span className="font-mono">{patient.access_code}</span>

        <span className="text-gray-600">Дата операции:</span>
        <span>{patient.operation_date ?? '—'}</span>

        {patient.notes && (
          <>
            <span className="text-gray-600">Примечания:</span>
            <span>{patient.notes}</span>
          </>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-2">Чек-лист подготовки</h2>

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

      <div className="mt-6">
        <MediaGallery patientId={patient.id} />
      </div>
    </div>
  )
}

export default PatientCard
