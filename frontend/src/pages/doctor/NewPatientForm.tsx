import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatientStore } from '../../store/patients'

const operationTypes = [
  'Факоэмульсификация',
  'Антиглаукоматозная операция',
  'Витреоретинальная операция',
  'Другое',
]

function NewPatientForm() {
  const navigate = useNavigate()
  const createPatient = usePatientStore((s) => s.createPatient)
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
      const patient = await createPatient({
        full_name: fullName,
        birth_date: birthDate,
        snils: snils || undefined,
        insurance_policy: insurancePolicy || undefined,
        diagnosis_code: diagnosisCode,
        diagnosis_text: diagnosisText,
        operation_type: operationType,
        notes: notes || undefined,
      })
      navigate(`/doctor/patient/${patient.id}`)
    } catch {
      setError('Ошибка при создании пациента')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Новый пациент</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">ФИО *</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Дата рождения *</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">СНИЛС</span>
            <input
              type="text"
              value={snils}
              onChange={(e) => setSnils(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Полис ОМС</span>
            <input
              type="text"
              value={insurancePolicy}
              onChange={(e) => setInsurancePolicy(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Код МКБ-10 *</span>
            <input
              type="text"
              value={diagnosisCode}
              onChange={(e) => setDiagnosisCode(e.target.value)}
              required
              placeholder="H25.1"
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Диагноз *</span>
            <input
              type="text"
              value={diagnosisText}
              onChange={(e) => setDiagnosisText(e.target.value)}
              required
              placeholder="Старческая катаракта"
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Тип операции *</span>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              required
              className="border border-gray-300 px-3 py-2 rounded w-full"
            >
              {operationTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Примечания</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewPatientForm
