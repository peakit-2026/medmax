import { useState, useRef } from 'react'
import api from '../api/client'
import type { ChecklistItem } from '../types/index'

interface Props {
  item: ChecklistItem
  patientId: string
  onUpdate: () => void
}

function ChecklistItemRow({ item, patientId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleComplete = async () => {
    setLoading(true)
    try {
      if (item.is_completed) {
        await api.put(`/checklists/${item.id}/uncomplete`)
      } else {
        await api.put(`/checklists/${item.id}/complete`)
      }
      onUpdate()
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget
    const file = target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/checklists/${item.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onUpdate()
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <li className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded">
      <input
        type="checkbox"
        checked={item.is_completed}
        onChange={toggleComplete}
        disabled={loading}
        className="w-4 h-4"
      />
      <span className={item.is_completed ? 'line-through text-gray-400' : ''}>
        {item.title}
      </span>

      {item.item_type === 'file_upload' && (
        <div className="ml-auto flex items-center gap-2">
          {item.file_path && (
            <span className="text-green-600 text-sm">Файл загружен</span>
          )}
          <label className="text-sm text-blue-600 cursor-pointer">
            {item.file_path ? 'Заменить' : 'Загрузить'}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>
        </div>
      )}

      {item.item_type === 'calculator' && (
        <a
          href={`/doctor/patient/${patientId}/iol`}
          className="ml-auto text-sm text-blue-600"
        >
          Открыть калькулятор ИОЛ
        </a>
      )}

      {item.item_type === 'date_input' && (
        <input
          type="date"
          className="ml-auto border rounded px-2 py-1 text-sm"
          disabled={loading}
        />
      )}

      {loading && <span className="text-gray-400 text-sm">...</span>}
    </li>
  )
}

export default ChecklistItemRow
