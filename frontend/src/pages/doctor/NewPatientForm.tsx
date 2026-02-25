import { useState } from 'react'
import { usePatientStore } from '../../store/patients'
import {
  IconClose,
  operationTypes,
  districts,
  inputBase,
  DiagnosisField,
  OperationTypeField,
  DateField,
  SelectField,
} from '../../components/form-fields'

/* ── Component ── */

interface NewPatientModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (patientId: string) => void
}

function NewPatientModal({ open, onClose, onCreated }: NewPatientModalProps) {
  const createPatient = usePatientStore((s) => s.createPatient)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 fields
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [snils, setSnils] = useState('')
  const [insurancePolicy, setInsurancePolicy] = useState('')
  const [district, setDistrict] = useState('')

  // Step 2 fields
  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<{ code: string; text: string } | null>(null)
  const [operationType, setOperationType] = useState(operationTypes[0])

  const resetForm = () => {
    setStep(1)
    setLoading(false)
    setError('')
    setLastName('')
    setFirstName('')
    setPatronymic('')
    setBirthDate('')
    setSnils('')
    setInsurancePolicy('')
    setDistrict('')
    setDiagnosisSearch('')
    setSelectedDiagnosis(null)
    setOperationType(operationTypes[0])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNext = () => {
    if (!lastName.trim() || !firstName.trim() || !birthDate) {
      setError('Заполните обязательные поля: фамилия, имя, дата рождения')
      return
    }
    setError('')
    setStep(2)
  }

  const handleBack = () => {
    setError('')
    setStep(1)
  }

  const handleSave = async () => {
    if (!selectedDiagnosis) {
      setError('Выберите диагноз')
      return
    }
    setError('')
    setLoading(true)
    try {
      const fullName = [lastName, firstName, patronymic].filter(Boolean).join(' ')
      const patient = await createPatient({
        full_name: fullName,
        birth_date: birthDate,
        snils: snils || undefined,
        insurance_policy: insurancePolicy || undefined,
        diagnosis_code: selectedDiagnosis.code,
        diagnosis_text: `${selectedDiagnosis.code} - ${selectedDiagnosis.text}`,
        operation_type: operationType,
        district: district || undefined,
      })
      handleClose()
      onCreated?.(patient.id)
    } catch {
      setError('Ошибка при создании пациента')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 50,
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 51,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          pointerEvents: 'none',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 460,
            background: 'white',
            border: '1px solid rgba(120,120,128,0.16)',
            borderRadius: 32,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
            overflow: 'clip',
            boxShadow: '0px 4px 2px 0px rgba(16,16,18,0.01), 0px 2px 2px 0px rgba(16,16,18,0.02), 0px 1px 1px 0px rgba(16,16,18,0.04), 0px 0px 1px 0px rgba(16,16,18,0.12)',
            maxHeight: 'calc(100vh - 48px)',
          }}
        >
          {/* Header: title + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 24,
                fontWeight: 500,
                lineHeight: '24px',
                letterSpacing: -0.5,
                color: '#101012',
                fontFeatureSettings: "'ss01' 1",
              }}
            >
              {step === 1 ? 'Данные пациента' : 'Диагноз и тип операции'}
            </span>
            <button
              onClick={handleClose}
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'rgba(120,120,128,0.12)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#101012',
                flexShrink: 0,
              }}
            >
              <IconClose />
            </button>
          </div>

          {/* Progress bar (2 segments) */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#007AFF' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: step >= 2 ? '#007AFF' : '#f7f8fa' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ color: '#FF3B30', fontSize: 14, lineHeight: '20px', marginTop: -20 }}>
              {error}
            </div>
          )}

          {/* Step 1: Patient data */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              <input
                type="text"
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={inputBase}
              />
              <input
                type="text"
                placeholder="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={inputBase}
              />
              <input
                type="text"
                placeholder="Отчество"
                value={patronymic}
                onChange={(e) => setPatronymic(e.target.value)}
                style={inputBase}
              />
              <DateField value={birthDate} onChange={setBirthDate} />
              <input
                type="text"
                placeholder="СНИЛС"
                value={snils}
                onChange={(e) => setSnils(e.target.value)}
                style={inputBase}
              />
              <input
                type="text"
                placeholder="Полис ОМС"
                value={insurancePolicy}
                onChange={(e) => setInsurancePolicy(e.target.value)}
                style={inputBase}
              />
              <SelectField
                value={district}
                onChange={setDistrict}
                placeholder="Район"
                options={districts}
              />
            </div>
          )}

          {/* Step 2: Diagnosis & operation */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DiagnosisField
                selectedDiagnosis={selectedDiagnosis}
                diagnosisSearch={diagnosisSearch}
                onSearchChange={setDiagnosisSearch}
                onSelect={setSelectedDiagnosis}
              />
              <OperationTypeField
                value={operationType}
                onChange={setOperationType}
              />
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={step === 1 ? handleClose : handleBack}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 16,
                border: 'none',
                background: 'rgba(120,120,128,0.12)',
                fontSize: 16,
                fontWeight: 500,
                lineHeight: '24px',
                color: '#101012',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {step === 1 ? 'Отменить' : 'Назад'}
            </button>
            <button
              type="button"
              onClick={step === 1 ? handleNext : handleSave}
              disabled={loading}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 16,
                border: 'none',
                backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgb(0,122,255) 0%, rgb(0,122,255) 100%)',
                boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)',
                fontSize: 16,
                fontWeight: 500,
                lineHeight: '24px',
                color: 'white',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default NewPatientModal
