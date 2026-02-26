import { useState, useMemo } from 'react'

interface Props {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const DAY_HEADERS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function MiniCalendar({ selectedDate, onDateSelect }: Props) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const weeks = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDay = firstDay.getDay()

    const cells: Date[] = []

    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, 1 - (startDay - i))
      cells.push(d)
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d))
    }

    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1]
      const d = new Date(last)
      d.setDate(d.getDate() + 1)
      cells.push(d)
    }

    const result: Date[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7))
    }
    return result
  }, [viewMonth])

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()

  const isCurrentMonth = (d: Date) => d.getMonth() === viewMonth.getMonth()

  return (
    <div
      className="bg-surface border border-border rounded-[24px] flex flex-col shrink-0"
      style={{ width: '280px', padding: '24px', gap: '16px' }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[16px] font-medium leading-[24px] text-text"
          style={{ fontFeatureSettings: "'ss01' 1" }}
        >
          {MONTH_NAMES[viewMonth.getMonth()]}, {viewMonth.getFullYear()}
        </span>
        <div className="flex items-center" style={{ gap: '4px' }}>
          <button
            onClick={nextMonth}
            className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] cursor-pointer hover:bg-surface-secondary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 13L10 8L5 3" stroke="rgba(60,60,67,0.72)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={prevMonth}
            className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] cursor-pointer hover:bg-surface-secondary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11 3L6 8L11 13" stroke="rgba(60,60,67,0.72)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="flex items-center justify-center" style={{ height: '28px' }}>
            <span className="text-[12px] font-medium leading-[12px] text-text-secondary">
              {d}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col" style={{ gap: '2px' }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              const current = isCurrentMonth(day)
              const todayHighlight = isToday(day)

              return (
                <button
                  key={di}
                  onClick={() => onDateSelect(day)}
                  className="flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    width: '100%',
                    height: '32px',
                    borderRadius: '9999px',
                    background: todayHighlight ? '#007AFF' : 'transparent',
                  }}
                >
                  <span
                    className="text-[14px] font-medium leading-[14px]"
                    style={{
                      color: todayHighlight
                        ? 'white'
                        : current
                        ? '#101012'
                        : 'rgba(60,60,67,0.36)',
                    }}
                  >
                    {day.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MiniCalendar
