export interface Patient {
  id: string
  doctor_id: string
  surgeon_id: string | null
  full_name: string
  birth_date: string
  snils: string | null
  insurance_policy: string | null
  diagnosis_code: string
  diagnosis_text: string
  operation_type: string
  status: 'red' | 'yellow' | 'green'
  access_code: string
  operation_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  patient_id: string
  title: string
  description: string | null
  item_type: 'file_upload' | 'date_input' | 'calculator' | 'checkbox'
  is_completed: boolean
  completed_at: string | null
  file_path: string | null
  value_json: unknown
  sort_order: number
  created_at: string
}

export interface PatientWithChecklist extends Patient {
  checklist: ChecklistItem[]
}

export interface Comment {
  id: string
  patient_id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

export interface IolCalculation {
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

export interface MediaFile {
  id: string
  patient_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  created_at: string
}

export type DisplayStatus = 'red' | 'yellow' | 'green' | 'date_set'

export interface LastAction {
  text: string
  date: string
}

export function shortenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return fullName
  const surname = parts[0]
  const initials = parts.slice(1).map((p) => p[0].toUpperCase() + '.').join(' ')
  return `${surname} ${initials}`
}

export function getDisplayStatus(patient: Patient): DisplayStatus {
  if (patient.status === 'green' && patient.operation_date) return 'date_set'
  return patient.status
}

export function getLastAction(patient: Patient): LastAction {
  const d = new Date(patient.updated_at)
  const date = d.toLocaleDateString('ru-RU')
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const dateTime = `${date} в ${time}`
  switch (patient.status) {
    case 'red':
      return { text: 'Требуется консультация', date: dateTime }
    case 'yellow':
      return { text: 'Документы на проверке', date: dateTime }
    case 'green':
      return patient.operation_date
        ? { text: `Дата операции: ${new Date(patient.operation_date).toLocaleDateString('ru-RU')}`, date: dateTime }
        : { text: 'Одобрен хирургом', date: dateTime }
    default:
      return { text: 'Обновлено', date: dateTime }
  }
}
