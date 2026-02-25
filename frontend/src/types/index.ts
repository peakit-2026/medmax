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
