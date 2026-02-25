const labels: Record<string, string> = {
  red: 'Требуется консультация',
  yellow: 'Идет подготовка',
  green: 'Готов к операции',
}

const colors: Record<string, string> = {
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-amber-100 text-amber-800',
  green: 'bg-green-100 text-green-800',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 rounded text-sm ${colors[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default StatusBadge
