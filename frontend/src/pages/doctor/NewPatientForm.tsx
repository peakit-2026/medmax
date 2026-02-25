import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import type { Patient } from '../../types/index'

const operationTypes = [
  'Факоэмульсификация',
  'Антиглаукоматозная операция',
  'Витреоретинальная операция',
  'Другое',
]

function NewPatientForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [snils, setSnils] = useState('')
  const [insurancePolicy, setInsurancePolicy] = useState('')
  const [diagnosisCode, setDiagnosisCode] = useState('')
  const [diagnosisText, setDiagnosisText] = useState('')
  const [operationType, setOperationType] = useState(operationTypes[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<Patient>('/patients', {
        full_name: fullName,
        birth_date: birthDate,
        snils: snils || undefined,
        insurance_policy: insurancePolicy || undefined,
        diagnosis_code: diagnosisCode,
        diagnosis_text: diagnosisText,
        operation_type: operationType,
        notes: notes || undefined,
      })
      navigate(`/doctor/patient/${data.id}`)
    } catch {
      setError('Ошибка при создании пациента')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-4">Новый пациент</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span>ФИО *</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Дата рождения *</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>СНИЛС</span>
          <input
            type="text"
            value={snils}
            onChange={(e) => setSnils(e.target.value)}
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Полис ОМС</span>
          <input
            type="text"
            value={insurancePolicy}
            onChange={(e) => setInsurancePolicy(e.target.value)}
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Код МКБ-10 *</span>
          <input
            type="text"
            value={diagnosisCode}
            onChange={(e) => setDiagnosisCode(e.target.value)}
            required
            placeholder="H25.1"
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Диагноз *</span>
          <input
            type="text"
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
            required
            placeholder="Старческая катаракта"
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>Тип операции *</span>
          <select
            value={operationType}
            onChange={(e) => setOperationType(e.target.value)}
            required
            className="border p-2 rounded"
          >
            {operationTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span>Примечания</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="border p-2 rounded"
          />
        </label>

        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Создать'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/doctor')}
            className="border px-4 py-2 rounded"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewPatientForm
