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
