import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import type { PatientWithChecklist } from '../../types/index'
import { formatDateRu } from '../../types/index'

type StageStatus = 'done' | 'active' | 'pending'

function StageIcon({ status }: { status: StageStatus }) {
  if (status === 'done') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0">
        &#10003;
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className="w-8 h-8 rounded-full border-4 border-blue-500 shrink-0 animate-pulse" />
    )
  }
  return <div className="w-8 h-8 rounded-full bg-gray-300 shrink-0" />
}

function PatientStatus() {
  const { code } = useParams()
  const [patient, setPatient] = useState<PatientWithChecklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    axios
      .get<PatientWithChecklist>(`/api/patients/code/${code}`)
      .then((res) => {
        setPatient(res.data)
      })
      .catch(() => {
        setNotFound(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-500">Загрузка...</p>
      </div>
    )
  }

  if (notFound || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">
            Пациент не найден. Проверьте код доступа.
          </p>
          <Link to="/patient" className="text-blue-600 hover:text-blue-700 text-lg underline">
            Попробовать снова
          </Link>
        </div>
      </div>
    )
  }

  const completedCount = patient.checklist.filter((c) => c.is_completed).length
  const totalCount = patient.checklist.length
  const hasAnyCompleted = completedCount > 0

  const stage1: StageStatus = hasAnyCompleted ? 'done' : 'active'

  const stage2: StageStatus =
    patient.status === 'green'
      ? 'done'
      : patient.status === 'yellow'
        ? 'active'
        : 'pending'

  const stage3: StageStatus = patient.operation_date ? 'done' : 'pending'

  const stages: { title: string; status: StageStatus; detail?: string }[] = [
    {
      title: 'Сдача анализов в районной поликлинике',
      status: stage1,
      detail: totalCount > 0 ? `Выполнено ${completedCount} из ${totalCount} пунктов` : undefined,
    },
    {
      title: 'Проверка хирургом',
      status: stage2,
    },
    {
      title: 'Операция назначена',
      status: stage3,
      detail: patient.operation_date ? `Дата операции: ${formatDateRu(patient.operation_date)}` : undefined,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Link to="/patient" className="text-blue-600 hover:text-blue-700 mb-6 inline-block text-sm">
          &larr; Назад
        </Link>

        <h1 className="text-2xl font-bold mb-6">{patient.full_name}</h1>

        {patient.operation_date && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
            <p className="text-xl font-semibold text-green-800">
              Дата операции: {formatDateRu(patient.operation_date)}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Ход подготовки</h2>
          <div className="flex flex-col gap-6">
            {stages.map((stage, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <StageIcon status={stage.status} />
                  {i < stages.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-300 mt-1" />
                  )}
                </div>
                <div className="pt-1">
                  <p className="text-lg">{stage.title}</p>
                  {stage.detail && (
                    <p className="text-sm text-gray-500 mt-1">{stage.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalCount > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-lg">
              Выполнено {completedCount} из {totalCount} пунктов
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientStatus
