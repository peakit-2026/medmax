import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import MediaGallery from '../../components/MediaGallery'
import VideoCall from '../../components/VideoCall'
import { usePatientStore, selectComments, selectIolCalcs } from '../../store/patients'

function PatientReview() {
  const { id } = useParams()
  const patient = usePatientStore((s) => s.patients[id!])
  const comments = usePatientStore(selectComments(id!))
  const iolCalcs = usePatientStore(selectIolCalcs(id!))
  const fetchPatient = usePatientStore((s) => s.fetchPatient)
  const fetchComments = usePatientStore((s) => s.fetchComments)
  const fetchIol = usePatientStore((s) => s.fetchIol)
  const fetchPatients = usePatientStore((s) => s.fetchPatients)
  const addComment = usePatientStore((s) => s.addComment)
  const approvePatient = usePatientStore((s) => s.approvePatient)
  const rejectPatient = usePatientStore((s) => s.rejectPatient)

  const [newComment, setNewComment] = useState('')
  const [showApproveForm, setShowApproveForm] = useState(false)
  const [operationDate, setOperationDate] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    fetchPatient(id!)
    fetchComments(id!)
    fetchIol(id!)
  }, [id])

  const handleAddComment = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newComment.trim()) return
    addComment(id!, newComment)
    setNewComment('')
  }

  const handleApprove = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await approvePatient(id!, operationDate || null)
      setShowApproveForm(false)
      setOperationDate('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!rejectComment.trim()) return
    setSubmitting(true)
    try {
      await rejectPatient(id!, rejectComment)
      setShowRejectForm(false)
      setRejectComment('')
    } finally {
      setSubmitting(false)
    }
  }

  if (!patient) return <div className="text-gray-500">Загрузка...</div>

  const completedCount = patient.checklist.filter((c) => c.is_completed).length
  const totalCount = patient.checklist.length

  return (
    <div>
      <Link
        to="/surgeon"
        onMouseEnter={() => fetchPatients()}
        className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
      >
        &larr; К списку пациентов
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{patient.full_name}</h1>
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
        <h2 className="text-lg font-semibold mb-4">
          Чек-лист ({completedCount}/{totalCount})
        </h2>
        {totalCount === 0 ? (
          <p className="text-gray-500">Чек-лист пуст</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {patient.checklist.map((item) => (
              <li key={item.id} className="flex items-center gap-2 py-1">
                <span className={item.is_completed ? 'text-green-600' : 'text-gray-400'}>
                  {item.is_completed ? '[x]' : '[ ]'}
                </span>
                <span className={item.is_completed ? 'text-gray-500' : ''}>{item.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <MediaGallery patientId={patient.id} />
      </div>

      {iolCalcs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Расчёты ИОЛ</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Глаз</th>
                <th className="px-4 py-3">Формула</th>
                <th className="px-4 py-3">K1/K2</th>
                <th className="px-4 py-3">AL</th>
                <th className="px-4 py-3">ИОЛ</th>
              </tr>
            </thead>
            <tbody>
              {iolCalcs.map((calc) => (
                <tr key={calc.id} className="border-b">
                  <td className="px-4 py-3">
                    {new Date(calc.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">{calc.eye === 'right' ? 'OD' : 'OS'}</td>
                  <td className="px-4 py-3">{calc.formula === 'srk_t' ? 'SRK/T' : 'Haigis'}</td>
                  <td className="px-4 py-3">
                    {calc.k1}/{calc.k2}
                  </td>
                  <td className="px-4 py-3">{calc.axial_length}</td>
                  <td className="px-4 py-3 font-semibold">{calc.recommended_iol.toFixed(1)} D</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Комментарии</h2>
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm mb-4">Нет комментариев</p>
        ) : (
          <ul className="flex flex-col gap-2 mb-4">
            {comments.map((c) => (
              <li key={c.id} className="border border-gray-200 rounded p-3">
                <p>{c.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(c.created_at).toLocaleString('ru-RU')}
                </p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Написать комментарий..."
            className="border border-gray-300 px-3 py-2 rounded flex-1"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Отправить
          </button>
        </form>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setShowApproveForm(true)
            setShowRejectForm(false)
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Подтвердить готовность
        </button>
        <button
          onClick={() => {
            setShowRejectForm(true)
            setShowApproveForm(false)
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Вернуть на доработку
        </button>
      </div>

      {showApproveForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-md">
          <form onSubmit={handleApprove}>
            <h3 className="font-semibold mb-4">Подтверждение готовности</h3>
            <label className="flex flex-col gap-1 mb-4">
              <span className="text-sm text-gray-700">Дата операции (необязательно)</span>
              <input
                type="date"
                value={operationDate}
                onChange={(e) => setOperationDate(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded w-full"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Подтвердить
              </button>
              <button
                type="button"
                onClick={() => setShowApproveForm(false)}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {showRejectForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-md">
          <form onSubmit={handleReject}>
            <h3 className="font-semibold mb-4">Возврат на доработку</h3>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Укажите причину..."
              required
              rows={3}
              className="border border-gray-300 px-3 py-2 rounded w-full mb-4"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Вернуть
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default PatientReview
