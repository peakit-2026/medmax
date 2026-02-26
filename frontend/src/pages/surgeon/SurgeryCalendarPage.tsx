import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatientStore } from '../../store/patients'
import { shortenName } from '../../types'
import type { Patient } from '../../types'
import MiniCalendar from '../../components/MiniCalendar'
import PatientReview from './PatientReview'

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
]

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница']

const SLOT_HEIGHT = 48
const DURATION_SLOTS = 3

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateRu(date: Date): string {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ]
  return `${date.getDate()} ${months[date.getMonth()]}`
}

function formatWeekLabel(monday: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonday = getMonday(today)
  const isThisWeek = monday.getTime() === thisMonday.getTime()
  return `${formatDateRu(monday)}${isThisWeek ? ', сегодня' : ''}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function addTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
}

function getSlotOffset(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - 8) * 2 + m / 30) * SLOT_HEIGHT
}

function SurgeryCalendarPage() {
  const navigate = useNavigate()
  const fetchSchedule = usePatientStore((s) => s.fetchSchedule)
  const [monday, setMonday] = useState(() => getMonday(new Date()))
  const [schedulePatients, setSchedulePatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const weekStartStr = useMemo(() => {
    const y = monday.getFullYear()
    const m = String(monday.getMonth() + 1).padStart(2, '0')
    const d = String(monday.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [monday])

  const loadSchedule = useCallback(async () => {
    const data = await fetchSchedule(weekStartStr)
    setSchedulePatients(data)
  }, [fetchSchedule, weekStartStr])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [monday])

  const patientsByDay = useMemo(() => {
    const map: Record<string, Patient[]> = {}
    for (const p of schedulePatients) {
      if (p.operation_date && p.operation_time) {
        const dateKey = p.operation_date
        if (!map[dateKey]) map[dateKey] = []
        map[dateKey].push(p)
      }
    }
    return map
  }, [schedulePatients])

  const prevWeek = () => {
    const d = new Date(monday)
    d.setDate(d.getDate() - 7)
    setMonday(d)
  }

  const nextWeek = () => {
    const d = new Date(monday)
    d.setDate(d.getDate() + 7)
    setMonday(d)
  }

  const goToDate = (date: Date) => {
    setMonday(getMonday(date))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div
      className="flex flex-col size-full"
      style={{ padding: '36px 24px', gap: '36px' }}
    >
      <h1
        className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text shrink-0"
        style={{ fontFeatureSettings: "'ss01' 1" }}
      >
        Календарь операций
      </h1>

      <div className="flex flex-1 min-h-0" style={{ gap: '16px' }}>
        <div
          className="bg-surface border border-border rounded-[24px] flex flex-col flex-1 min-w-0"
          style={{ padding: '24px', gap: '24px' }}
        >
          <div className="flex items-center justify-between shrink-0">
            <div
              className="border border-border rounded-[16px] flex items-center overflow-clip shrink-0"
              style={{ padding: '16px' }}
            >
              <button onClick={prevWeek} className="w-[24px] h-[24px] flex items-center justify-center cursor-pointer shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14.5 7L9.5 12L14.5 17" stroke="#101012" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex items-center" style={{ padding: '0 8px' }}>
                <span className="text-[16px] font-medium leading-[24px] text-text whitespace-nowrap">
                  {formatWeekLabel(monday)}
                </span>
              </div>
              <button onClick={nextWeek} className="w-[24px] h-[24px] flex items-center justify-center cursor-pointer shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9.5 7L14.5 12L9.5 17" stroke="#101012" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => navigate('/surgeon')}
              className="flex items-center justify-center overflow-clip text-white rounded-[16px] relative cursor-pointer hover:brightness-110 transition-all shrink-0"
              style={{
                padding: '16px',
                backgroundImage:
                  'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgb(0,122,255) 0%, rgb(0,122,255) 100%)',
              }}
            >
              <span className="text-[16px] font-medium leading-[24px] text-white" style={{ padding: '0 8px' }}>
                Добавить пациента
              </span>
              <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
              />
            </button>
          </div>

          <div className="flex flex-1 min-h-0 overflow-y-auto drawer-scroll" style={{ gap: '16px' }}>
            <div className="flex flex-col shrink-0" style={{ width: '46px', paddingTop: '80px', gap: '24px' }}>
              {TIME_SLOTS.map((slot) => {
                const isHalf = slot.endsWith(':30')
                return (
                  <div key={slot} className="flex items-center justify-center" style={{ height: '24px' }}>
                    <span
                      className="text-[16px] font-normal leading-[24px] text-center whitespace-nowrap"
                      style={{
                        letterSpacing: '-0.25px',
                        color: isHalf ? 'rgba(60,60,67,0.72)' : '#101012',
                      }}
                    >
                      {slot}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-1 min-w-0" style={{ gap: '12px' }}>
              {weekDays.map((day, dayIdx) => {
                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
                const dayPatients = patientsByDay[dateStr] || []
                const isToday = isSameDay(day, today)

                return (
                  <div key={dayIdx} className="flex flex-col flex-1 min-w-0" style={{ gap: '16px' }}>
                    <div
                      className="flex flex-col items-center justify-center overflow-clip rounded-[12px] shrink-0 whitespace-nowrap"
                      style={{
                        padding: '12px 24px',
                        gap: '4px',
                        background: isToday ? '#f7f8fa' : 'transparent',
                      }}
                    >
                      <span className="text-[16px] font-medium leading-[24px] text-text">
                        {DAY_NAMES[dayIdx]}
                      </span>
                      <span className="text-[14px] font-medium leading-[12px] text-text-secondary">
                        {formatDateRu(day)}
                      </span>
                    </div>

                    <div className="relative flex-1 min-h-0 overflow-clip">
                      <div className="flex flex-col" style={{ gap: '24px' }}>
                        {TIME_SLOTS.map((slot) => (
                          <div
                            key={slot}
                            className="w-full"
                            style={{
                              height: '24px',
                              borderBottom: '1px dashed rgba(120,120,128,0.12)',
                            }}
                          />
                        ))}
                      </div>

                      {dayPatients.map((p) => {
                        if (!p.operation_time) return null
                        const time = p.operation_time.slice(0, 5)
                        const endTime = addTime(time, 90)
                        const top = getSlotOffset(time)
                        const height = DURATION_SLOTS * SLOT_HEIGHT - 5

                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPatientId(p.id)}
                            className="absolute left-0 right-0 bg-surface-secondary border border-border rounded-[12px] overflow-clip flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                              top,
                              height,
                              padding: '16px',
                              boxShadow:
                                '0px 4px 2px 0px rgba(16,16,18,0.01), 0px 2px 2px 0px rgba(16,16,18,0.02), 0px 1px 1px 0px rgba(16,16,18,0.04), 0px 0px 1px 0px rgba(16,16,18,0.12)',
                            }}
                          >
                            <div className="flex flex-col" style={{ gap: '8px' }}>
                              <span className="text-[16px] font-medium leading-[24px] text-text truncate">
                                {shortenName(p.full_name)}
                              </span>
                              <span className="text-[14px] font-medium leading-[12px] text-text-secondary truncate">
                                {p.operation_type}
                              </span>
                            </div>
                            <div className="flex justify-end">
                              <span className="text-[14px] font-medium leading-[12px] text-text">
                                {time} - {endTime}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <MiniCalendar selectedDate={monday} onDateSelect={goToDate} />
      </div>

      {selectedPatientId && (
        <PatientReview
          patientId={selectedPatientId}
          onClose={() => { setSelectedPatientId(null); loadSchedule() }}
        />
      )}
    </div>
  )
}

export default SurgeryCalendarPage
