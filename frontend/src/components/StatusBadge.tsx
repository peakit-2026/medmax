import type { DisplayStatus } from '../types'

const config: Record<DisplayStatus, { label: string; bgColor: string; textColor: string }> = {
  red: {
    label: 'Требует внимания',
    bgColor: '#FF3B30',
    textColor: '#FFFFFF',
  },
  yellow: {
    label: 'В подготовке',
    bgColor: '#FFD000',
    textColor: '#101012',
  },
  green: {
    label: 'Готов к операции',
    bgColor: '#34C759',
    textColor: '#FFFFFF',
  },
  date_set: {
    label: 'Назначена дата',
    bgColor: '#3E87FF',
    textColor: '#FFFFFF',
  },
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  const c = config[status]
  if (!c) return null

  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[13px] font-medium leading-[13px] whitespace-nowrap"
      style={{ backgroundColor: c.bgColor, color: c.textColor, padding: '6px 12px' }}
    >
      {c.label}
    </span>
  )
}

export default StatusBadge
