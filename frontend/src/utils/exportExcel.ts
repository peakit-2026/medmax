import * as XLSX from 'xlsx'
import type { Patient } from '../types'
import { getDisplayStatus } from '../types'

const statusLabels: Record<string, string> = {
  red: 'Требует внимания',
  yellow: 'В подготовке',
  green: 'Готов к операции',
  date_set: 'Назначена дата',
}

export function exportPatientsToExcel(patients: Patient[], filename = 'patients') {
  const rows = patients.map((p) => ({
    'ФИО': p.full_name,
    'Дата рождения': p.birth_date ? new Date(p.birth_date).toLocaleDateString('ru-RU') : '',
    'СНИЛС': p.snils || '',
    'Полис': p.insurance_policy || '',
    'Диагноз': p.diagnosis_text,
    'Код диагноза': p.diagnosis_code,
    'Тип операции': p.operation_type,
    'Статус': statusLabels[getDisplayStatus(p)] || p.status,
    'Дата операции': p.operation_date ? new Date(p.operation_date).toLocaleDateString('ru-RU') : '',
    'Примечания': p.notes || '',
    'Создан': new Date(p.created_at).toLocaleDateString('ru-RU'),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((r) => String(r[key as keyof typeof r] || '').length)
    )
    return { wch: Math.min(maxLen + 2, 40) }
  })
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Пациенты')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
