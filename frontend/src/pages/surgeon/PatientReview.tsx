import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import MediaGallery from '../../components/MediaGallery'
import type { PatientWithChecklist, Comment } from '../../types/index'

interface IolCalculation {
  id: string
  patient_id: string
  eye: string
  k1: number
  k2: number
  axial_length: number
  acd: number
  target_refraction: number
  formula: string
  recommended_iol: number
  created_at: string
}

function PatientReview() {
  const { id } = useParams()
  const [patient, setPatient] = useState<PatientWithChecklist | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [iolCalcs, setIolCalcs] = useState<IolCalculation[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [showApproveForm, setShowApproveForm] = useState(false)
  const [operationDate, setOperationDate] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchPatient = useCallback(() => {
    api.get<PatientWithChecklist>(`/patients/${id}`).then((res) => {
      setPatient(res.data)
      setLoading(false)
    })
  }, [id])

  const fetchComments = useCallback(() => {
    api.get<Comment[]>(`/comments/patient/${id}`).then((res) => {
      setComments(res.data)
    })
  }, [id])

  const fetchIol = useCallback(() => {
    api.get<IolCalculation[]>(`/iol/patient/${id}`).then((res) => {
      setIolCalcs(res.data)
    })
  }, [id])

  useEffect(() => {
    fetchPatient()
    fetchComments()
    fetchIol()
  }, [fetchPatient, fetchComments, fetchIol])

  const handleAddComment = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newComment.trim()) return
    api.post('/comments', { patient_id: id, content: newComment }).then(() => {
      setNewComment('')
      fetchComments()
    })
  }

  const handleApprove = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    api
      .post(`/surgeon/patients/${id}/approve`, {
        operation_date: operationDate || null,
      })
      .then(() => {
        setShowApproveForm(false)
        setOperationDate('')
        fetchPatient()
      })
      .finally(() => setSubmitting(false))
  }

  const handleReject = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!rejectComment.trim()) return
    setSubmitting(true)
    api
      .post(`/surgeon/patients/${id}/reject`, { comment: rejectComment })
      .then(() => {
        setShowRejectForm(false)
        setRejectComment('')
        fetchPatient()
        fetchComments()
      })
      .finally(() => setSubmitting(false))
  }

  if (loading) return <div>Загрузка...</div>
  if (!patient) return <div>Пациент не найден</div>

  const completedCount = patient.checklist.filter((c) => c.is_completed).length
  const totalCount = patient.checklist.length

  return (
    <div>
      <Link to="/surgeon" className="text-blue-600 mb-4 inline-block">
        &larr; К списку пациентов
      </Link>

      <h1 className="text-xl font-semibold mb-4">{patient.full_name}</h1>

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

        <span className="text-gray-600">Дата операции:</span>
        <span>{patient.operation_date ?? '—'}</span>

        {patient.notes && (
          <>
            <span className="text-gray-600">Примечания:</span>
            <span>{patient.notes}</span>
          </>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-2">
        Чек-лист ({completedCount}/{totalCount})
      </h2>
      {totalCount === 0 ? (
        <p className="text-gray-500 mb-4">Чек-лист пуст</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-1">
          {patient.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <span className={item.is_completed ? 'text-green-600' : 'text-gray-400'}>
                {item.is_completed ? '[x]' : '[ ]'}
              </span>
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-6">
        <MediaGallery patientId={patient.id} />
      </div>

      {iolCalcs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Расчёты ИОЛ</h2>
          <table className="w-full max-w-2xl text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left border">Дата</th>
                <th className="p-2 text-left border">Глаз</th>
                <th className="p-2 text-left border">Формула</th>
                <th className="p-2 text-left border">K1/K2</th>
                <th className="p-2 text-left border">AL</th>
                <th className="p-2 text-left border">ИОЛ</th>
              </tr>
            </thead>
            <tbody>
              {iolCalcs.map((calc) => (
                <tr key={calc.id}>
                  <td className="p-2 border">
                    {new Date(calc.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="p-2 border">{calc.eye === 'right' ? 'OD' : 'OS'}</td>
                  <td className="p-2 border">{calc.formula === 'srk_t' ? 'SRK/T' : 'Haigis'}</td>
                  <td className="p-2 border">
                    {calc.k1}/{calc.k2}
                  </td>
                  <td className="p-2 border">{calc.axial_length}</td>
                  <td className="p-2 border font-semibold">{calc.recommended_iol.toFixed(1)} D</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Комментарии</h2>
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm mb-2">Нет комментариев</p>
        ) : (
          <ul className="flex flex-col gap-2 mb-3">
            {comments.map((c) => (
              <li key={c.id} className="border rounded p-2">
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
            className="border p-2 rounded flex-1"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
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
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Подтвердить готовность
        </button>
        <button
          onClick={() => {
            setShowRejectForm(true)
            setShowApproveForm(false)
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Вернуть на доработку
        </button>
      </div>

      {showApproveForm && (
        <form onSubmit={handleApprove} className="border rounded p-4 max-w-md mb-4">
          <h3 className="font-semibold mb-2">Подтверждение готовности</h3>
          <label className="flex flex-col gap-1 mb-3">
            <span className="text-sm text-gray-600">Дата операции (необязательно)</span>
            <input
              type="date"
              value={operationDate}
              onChange={(e) => setOperationDate(e.target.value)}
              className="border p-2 rounded"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Подтвердить
            </button>
            <button
              type="button"
              onClick={() => setShowApproveForm(false)}
              className="border px-4 py-2 rounded"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {showRejectForm && (
        <form onSubmit={handleReject} className="border rounded p-4 max-w-md mb-4">
          <h3 className="font-semibold mb-2">Возврат на доработку</h3>
          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Укажите причину..."
            required
            rows={3}
            className="border p-2 rounded w-full mb-3"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Вернуть
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="border px-4 py-2 rounded"
            >
              Отмена
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default PatientReview
