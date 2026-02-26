import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Upload, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge'
import PatientDrawer from '../../components/PatientDrawer'
import NewPatientModal from './NewPatientForm'
import { usePatientStore } from '../../store/patients'
import { getDisplayStatus, getLastAction, shortenName } from '../../types'
import type { DisplayStatus } from '../../types'
import { exportPatientsToExcel } from '../../utils/exportExcel'
import {
  useAnimeEntrance,
  useAnimeClick,
  useAnimeCounter,
  useAnimeTableRows,
  useAnimeWiggle,
} from '../../hooks/useAnime'

type SortField = 'full_name' | 'diagnosis_text' | 'operation_type' | 'status' | 'last_action'
type SortDir = 'asc' | 'desc'
type Tab = 'all' | DisplayStatus

const PAGE_SIZE = 5

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'red', label: 'Требует внимания' },
  { key: 'yellow', label: 'В подготовке' },
  { key: 'green', label: 'Готов к операции' },
  { key: 'date_set', label: 'Назначена дата' },
]

const statusOrder: Record<DisplayStatus, number> = {
  red: 0,
  yellow: 1,
  green: 2,
  date_set: 3,
}

function DoctorDashboard() {
  const patients = usePatientStore((s) => s.patientList)
  const fetchPatients = usePatientStore((s) => s.fetchPatients)
  const fetchPatient = usePatientStore((s) => s.fetchPatient)

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [sortField, setSortField] = useState<SortField>('full_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [showNewPatient, setShowNewPatient] = useState(false)

  // ── Animation refs ──
  const titleRef = useRef<HTMLHeadingElement>(null)
  const statsCardRef = useRef<HTMLDivElement>(null)
  const tableCardRef = useRef<HTMLDivElement>(null)
  const tbodyRef = useRef<HTMLTableSectionElement>(null)
  const [searchIconRef, wiggleSearch] = useAnimeWiggle<HTMLSpanElement>()
  const paginationLeftRef = useRef<HTMLButtonElement>(null)
  const paginationRightRef = useRef<HTMLButtonElement>(null)

  // ── Entrance animations ──
  useAnimeEntrance(titleRef, { type: 'bounce-down', delay: 0 })
  useAnimeEntrance(statsCardRef, { type: 'scale', delay: 100 })
  useAnimeEntrance(tableCardRef, { type: 'bounce-up', delay: 300 })

  // ── Click animations ──
  useAnimeClick(paginationLeftRef, { type: 'pop' })
  useAnimeClick(paginationRightRef, { type: 'pop' })

  useEffect(() => {
    fetchPatients()
  }, [])

  const counts = useMemo(() => {
    const c = { red: 0, yellow: 0, green: 0, date_set: 0 }
    for (const p of patients) {
      c[getDisplayStatus(p)]++
    }
    return c
  }, [patients])

  const filtered = useMemo(() => {
    let list = patients.filter((p) => {
      if (search && !p.full_name.toLowerCase().includes(search.toLowerCase())) return false
      if (activeTab !== 'all' && getDisplayStatus(p) !== activeTab) return false
      return true
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'full_name':
          cmp = a.full_name.localeCompare(b.full_name, 'ru')
          break
        case 'diagnosis_text':
          cmp = a.diagnosis_text.localeCompare(b.diagnosis_text, 'ru')
          break
        case 'operation_type':
          cmp = a.operation_type.localeCompare(b.operation_type, 'ru')
          break
        case 'status':
          cmp = statusOrder[getDisplayStatus(a)] - statusOrder[getDisplayStatus(b)]
          break
        case 'last_action':
          cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [patients, search, activeTab, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useAnimeTableRows(tbodyRef, [])

  useEffect(() => {
    setPage(1)
  }, [search, activeTab])

  const allOnPageSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id))
  const toggleAll = () => {
    const next = new Set(selectedIds)
    if (allOnPageSelected) {
      paginated.forEach((p) => next.delete(p.id))
    } else {
      paginated.forEach((p) => next.add(p.id))
    }
    setSelectedIds(next)
  }
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return (
        <span className="w-5 h-5 flex items-center justify-center text-text-secondary">
          <ArrowUpDown size={14} />
        </span>
      )
    return (
      <span className="w-5 h-5 flex items-center justify-center text-text-secondary">
        {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      </span>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 responsive-page" style={{ padding: '36px 24px', gap: '36px' }}>
      {/* Title */}
      <h1
        ref={titleRef}
        className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
        style={{ fontFeatureSettings: "'ss01' 1" }}
      >
        Панель управления
      </h1>

      {/* Stats + Table grouped with 16px gap */}
      <div className="flex flex-col flex-1 min-h-0" style={{ gap: '16px' }}>
        {/* Stats card */}
        <div
          ref={statsCardRef}
          className="bg-surface border border-border rounded-[24px] grid grid-cols-2 lg:flex lg:items-center shrink-0"
          style={{ minHeight: '120px' }}
        >
          <StatSection color="#FF3B30" label="Требуется внимание" count={counts.red} counterDelay={200} />
          <VerticalDivider className="hidden lg:flex" />
          <StatSection color="#FFD000" label="В подготовке" count={counts.yellow} counterDelay={300} />
          <VerticalDivider className="hidden lg:flex" />
          <StatSection color="#34C759" label="Готов к операции" count={counts.green} counterDelay={400} />
          <VerticalDivider className="hidden lg:flex" />
          <StatSection color="#3E87FF" label="Назначена дата" count={counts.date_set} counterDelay={500} />
        </div>

        {/* Table card */}
        <div
          ref={tableCardRef}
          className="bg-surface border border-border rounded-[24px] flex flex-col flex-1 min-h-0 responsive-card"
          style={{ padding: '24px', gap: '12px' }}
        >
          {/* Search + actions */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between" style={{ minHeight: '56px' }}>
            <div className="relative w-full lg:w-[300px]">
              <span ref={searchIconRef} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary inline-flex">
                <Search size={20} />
              </span>
              <input
                type="text"
                placeholder="Найти клиента"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={wiggleSearch}
                className="w-full border border-border rounded-[12px] bg-surface text-[16px] leading-[24px] focus:outline-none focus:border-primary"
                style={{ height: '56px', paddingLeft: '40px', paddingRight: '16px' }}
              />
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <button
                onClick={() => exportPatientsToExcel(filtered, 'patients')}
                className="flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary text-[16px] font-medium leading-[24px] cursor-pointer hover:bg-fill-quaternary transition-colors"
                style={{ padding: '16px' }}
              >
                <Upload size={24} />
                <span style={{ padding: '0 8px' }}>Экспортировать</span>
              </button>
              <button
                onClick={() => setShowNewPatient(true)}
                className="flex items-center justify-center overflow-clip text-white rounded-[16px] text-[16px] font-medium leading-[24px] cursor-pointer hover:brightness-110 transition-all"
                style={{
                  padding: '16px',
                  backgroundImage:
                    'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgb(0,122,255) 0%, rgb(0,122,255) 100%)',
                  boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)',
                }}
              >
                <span style={{ padding: '0 8px' }}>Добавить клиента</span>
              </button>
            </div>
          </div>

          {/* Pill tabs */}
          <div className="flex flex-col items-start justify-center">
            <div
              className="flex items-center overflow-x-auto"
              style={{
                background: 'rgba(120, 120, 128, 0.08)',
                borderRadius: '16px',
                padding: '4px',
              }}
            >
              {tabs.map((tab, i) => {
                const isActive = activeTab === tab.key
                const prevActive = i > 0 && activeTab === tabs[i - 1].key
                const showSeparator = i > 0 && !isActive && !prevActive

                return (
                  <div key={tab.key} className="flex items-center self-stretch flex-1">
                    {showSeparator && (
                      <div className="self-stretch flex items-center" style={{ width: 0 }}>
                        <div
                          style={{
                            width: '1px',
                            height: '32px',
                            background: 'rgba(120, 120, 128, 0.16)',
                          }}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => setActiveTab(tab.key)}
                      className="flex-1 text-[16px] font-medium leading-[24px] whitespace-nowrap self-stretch transition-all text-center overflow-hidden text-ellipsis cursor-pointer hover:text-text"
                      style={
                        isActive
                          ? {
                              padding: '12px',
                              borderRadius: '12px',
                              background: '#FFFFFF',
                              color: '#101012',
                              boxShadow:
                                '0px 4px 2px 0px rgba(16,16,18,0.01), 0px 2px 2px 0px rgba(16,16,18,0.02), 0px 1px 1px 0px rgba(16,16,18,0.04), 0px 0px 1px 0px rgba(16,16,18,0.12)',
                            }
                          : {
                              padding: '12px',
                              borderRadius: '12px',
                              color: 'rgba(60, 60, 67, 0.72)',
                            }
                      }
                    >
                      {tab.label}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data table + pagination */}
          <div className="flex flex-col flex-1" style={{ gap: '16px' }}>
            <div className="border border-border rounded-[16px] overflow-clip flex-1">
              <div className="responsive-table-wrap">
              <table className="w-full" style={{ tableLayout: 'fixed', minWidth: 700 }}>
                <colgroup>
                  <col style={{ width: '56px' }} />
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead>
                  <tr className="h-[48px] text-left bg-surface border-b border-border">
                    <th style={{ paddingLeft: '16px', paddingRight: '12px' }}>
                      <button
                        onClick={toggleAll}
                        className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        style={allOnPageSelected
                          ? { backgroundColor: '#007AFF', border: '1.5px solid #007AFF' }
                          : { border: '1.5px solid rgba(120, 120, 128, 0.16)' }}
                      >
                        {allOnPageSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    </th>
                    <ThSortable field="full_name" label="ФИО" onSort={handleSort} Icon={SortIcon} />
                    <ThSortable
                      field="diagnosis_text"
                      label="Диагноз"
                      onSort={handleSort}
                      Icon={SortIcon}
                    />
                    <ThSortable
                      field="operation_type"
                      label="Тип операции"
                      onSort={handleSort}
                      Icon={SortIcon}
                    />
                    <ThSortable
                      field="status"
                      label="Статус"
                      onSort={handleSort}
                      Icon={SortIcon}
                    />
                    <ThSortable
                      field="last_action"
                      label="Последнее действие"
                      onSort={handleSort}
                      Icon={SortIcon}
                    />
                  </tr>
                </thead>
                <tbody ref={tbodyRef}>
                  {paginated.map((p, i) => {
                    const action = getLastAction(p)
                    const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F7F8FA'
                    return (
                      <tr key={p.id} className="h-[64px] border-b border-border cursor-pointer hover:bg-surface-secondary transition-colors" style={{ background: rowBg }}>
                        <td style={{ paddingLeft: '16px', paddingRight: '12px' }}>
                          <button
                            onClick={() => toggleOne(p.id)}
                            className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            style={selectedIds.has(p.id)
                              ? { backgroundColor: '#007AFF', border: '1.5px solid #007AFF' }
                              : { border: '1.5px solid rgba(120, 120, 128, 0.16)' }}
                          >
                            {selectedIds.has(p.id) && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        </td>
                        <td className="px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                          <button
                            onClick={() => setSelectedPatientId(p.id)}
                            onMouseEnter={() => fetchPatient(p.id)}
                            className="text-primary hover:underline text-[16px] leading-[24px] font-normal text-left truncate max-w-full cursor-pointer"
                          >
                            {shortenName(p.full_name)}
                          </button>
                        </td>
                        <td className="px-3 text-[16px] leading-[24px] font-normal text-text overflow-hidden text-ellipsis whitespace-nowrap">
                          {p.diagnosis_text}
                        </td>
                        <td className="px-3 text-[16px] leading-[24px] font-normal text-text overflow-hidden text-ellipsis whitespace-nowrap">
                          {p.operation_type}
                        </td>
                        <td className="px-3 whitespace-nowrap">
                          <StatusBadge status={getDisplayStatus(p)} />
                        </td>
                        <td className="px-3 overflow-hidden">
                          <div className="flex flex-col" style={{ gap: '4px' }}>
                            <span className="text-[16px] leading-[24px] font-normal text-text truncate">
                              {action.text}
                            </span>
                            <span className="text-[14px] leading-[12px] font-medium text-text-secondary truncate">
                              {action.date}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-text-secondary text-[16px]"
                      >
                        Нет пациентов
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[14px] leading-[12px] font-medium text-text-secondary">
                {selectedIds.size} из {filtered.length} выбрано
              </span>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <button
                  ref={paginationLeftRef}
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className="border border-border rounded-[12px] flex items-center justify-center overflow-clip cursor-pointer hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ padding: '12px' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  ref={paginationRightRef}
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage >= totalPages}
                  className="border border-border rounded-[12px] flex items-center justify-center overflow-clip cursor-pointer hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  style={{ padding: '12px' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedPatientId && (
        <PatientDrawer
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}

      <NewPatientModal
        open={showNewPatient}
        onClose={() => setShowNewPatient(false)}
        onCreated={(id) => {
          fetchPatients()
          setSelectedPatientId(id)
        }}
      />
    </div>
  )
}

function StatSection({
  color,
  label,
  count,
  counterDelay = 200,
}: {
  color: string
  label: string
  count: number
  counterDelay?: number
}) {
  const dotRef = useRef<HTMLDivElement>(null)
  const counterRef = useAnimeCounter(count, { delay: counterDelay })

  useAnimeEntrance(dotRef, { type: 'scale', delay: counterDelay - 100 })

  return (
    <div
      className="flex-1 flex flex-col justify-center items-start overflow-clip"
      style={{ padding: '24px', gap: '16px' }}
    >
      <div className="flex items-center" style={{ gap: '8px' }}>
        <div
          ref={dotRef}
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[16px] font-medium leading-[24px] text-text-secondary">
          {label}
        </span>
      </div>
      <span
        ref={counterRef as React.RefObject<HTMLSpanElement>}
        className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
        style={{ fontFeatureSettings: "'ss01' 1" }}
      >
        {count}
      </span>
    </div>
  )
}

function VerticalDivider({ className }: { className?: string }) {
  return (
    <div className={`self-stretch flex items-center ${className ?? ''}`} style={{ width: 0 }}>
      <div
        style={{
          width: '1px',
          height: '100%',
          background: 'rgba(120, 120, 128, 0.16)',
        }}
      />
    </div>
  )
}

function ThSortable({
  field,
  label,
  onSort,
  Icon,
}: {
  field: SortField
  label: string
  onSort: (f: SortField) => void
  Icon: React.ComponentType<{ field: SortField }>
}) {
  return (
    <th className="px-3">
      <button
        onClick={() => onSort(field)}
        className="group flex items-center gap-1 text-[14px] leading-[12px] font-medium text-text-secondary cursor-pointer hover:text-text transition-colors"
      >
        {label}
        <Icon field={field} />
      </button>
    </th>
  )
}

export default DoctorDashboard
