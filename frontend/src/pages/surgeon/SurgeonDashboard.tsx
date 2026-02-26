import { useState, useEffect, useMemo } from 'react'
import { Search, Upload, ArrowUpDown, ArrowUp, ArrowDown, Check, X } from 'lucide-react'
import { usePatientStore } from '../../store/patients'
import { getDisplayStatus, shortenName } from '../../types'
import type { DisplayStatus } from '../../types'
import PatientReview from './PatientReview'

type SortField = 'full_name' | 'region' | 'diagnosis_text' | 'operation_type' | 'created_at' | 'action'
type SortDir = 'asc' | 'desc'
type Tab = 'all' | DisplayStatus

const PAGE_SIZE = 8

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'red', label: 'Требует внимания' },
  { key: 'yellow', label: 'В подготовке' },
  { key: 'green', label: 'Готов к операции' },
  { key: 'date_set', label: 'Назначена дата' },
]

function SurgeonDashboard() {
  const patients = usePatientStore((s) => s.patientList)
  const fetchPatients = usePatientStore((s) => s.fetchPatients)
  const fetchPatient = usePatientStore((s) => s.fetchPatient)
  const approvePatient = usePatientStore((s) => s.approvePatient)
  const rejectPatient = usePatientStore((s) => s.rejectPatient)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [sortField, setSortField] = useState<SortField>('full_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

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
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        default:
          cmp = 0
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [patients, search, activeTab, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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

  const handleApprove = async (e: React.MouseEvent, patientId: string) => {
    e.stopPropagation()
    await approvePatient(patientId, null)
    fetchPatients()
  }

  const handleReject = async (e: React.MouseEvent, patientId: string) => {
    e.stopPropagation()
    await rejectPatient(patientId, 'Отклонено хирургом')
    fetchPatients()
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
    <div className="flex flex-col flex-1 min-h-0" style={{ padding: '36px 24px', gap: '36px' }}>
      {/* Title */}
      <h1
        className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
        style={{ fontFeatureSettings: "'ss01' 1" }}
      >
        Панель управления
      </h1>

      {/* Stats + Table grouped with 16px gap */}
      <div className="flex flex-col flex-1 min-h-0" style={{ gap: '16px' }}>
        {/* Stats card */}
        <div
          className="bg-surface border border-border rounded-[24px] flex items-center shrink-0"
          style={{ height: '120px' }}
        >
          <StatSection color="#FF3B30" label="Требуется внимание" count={counts.red} />
          <VerticalDivider />
          <StatSection color="#FFD000" label="В подготовке" count={counts.yellow} />
          <VerticalDivider />
          <StatSection color="#34C759" label="Готов к операции" count={counts.green} />
          <VerticalDivider />
          <StatSection color="#3E87FF" label="Назначена дата" count={counts.date_set} />
        </div>

        {/* Table card */}
        <div
          className="bg-surface border border-border rounded-[24px] flex flex-col flex-1 min-h-0"
          style={{ padding: '24px', gap: '12px' }}
        >
          {/* Search + actions */}
          <div className="flex items-center justify-between" style={{ height: '56px' }}>
            <div className="relative" style={{ width: '300px' }}>
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="Найти клиента"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-border rounded-[12px] bg-surface text-[16px] leading-[24px] focus:outline-none focus:border-primary"
                style={{ height: '56px', paddingLeft: '40px', paddingRight: '16px' }}
              />
            </div>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <button
                className="flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary text-[16px] font-medium leading-[24px] cursor-pointer hover:bg-fill-quaternary transition-colors"
                style={{ padding: '16px' }}
              >
                <Upload size={24} />
                <span style={{ padding: '0 8px' }}>Экспортировать</span>
              </button>
            </div>
          </div>

          {/* Pill tabs */}
          <div className="flex flex-col items-start justify-center" style={{ height: '56px' }}>
            <div
              className="flex items-center overflow-clip"
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
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '56px' }} />
                  <col />
                  <col />
                  <col />
                  <col />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '100px' }} />
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
                    <ThSortable field="region" label="Район" onSort={handleSort} Icon={SortIcon} />
                    <ThSortable field="diagnosis_text" label="Диагноз" onSort={handleSort} Icon={SortIcon} />
                    <ThSortable
                      field="operation_type"
                      label="Тип операции"
                      onSort={handleSort}
                      Icon={SortIcon}
                    />
                    <ThSortable
                      field="created_at"
                      label="Дата отправки"
                      onSort={handleSort}
                      Icon={SortIcon}
                    />
                    <ThSortable
                      field="action"
                      label="Действие"
                      onSort={handleSort}
                      Icon={SortIcon}
                    />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p, i) => {
                    const rowBg = i % 2 === 0 ? '#FFFFFF' : '#F7F8FA'
                    const sentDate = new Date(p.created_at).toLocaleDateString('ru-RU')
                    return (
                      <tr
                        key={p.id}
                        className="h-[64px] border-b border-border cursor-pointer hover:bg-surface-secondary transition-colors"
                        style={{ background: rowBg }}
                        onClick={() => setSelectedPatientId(p.id)}
                      >
                        <td style={{ paddingLeft: '16px', paddingRight: '12px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleOne(p.id) }}
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
                            onClick={(e) => { e.stopPropagation(); setSelectedPatientId(p.id) }}
                            onMouseEnter={() => fetchPatient(p.id)}
                            className="text-primary hover:underline text-[16px] leading-[24px] font-normal text-left truncate max-w-full cursor-pointer"
                          >
                            {shortenName(p.full_name)}
                          </button>
                        </td>
                        <td className="px-3 text-[16px] leading-[24px] font-normal text-text overflow-hidden text-ellipsis whitespace-nowrap">
                          {p.notes || '—'}
                        </td>
                        <td className="px-3 text-[16px] leading-[24px] font-normal text-text overflow-hidden text-ellipsis whitespace-nowrap">
                          {p.diagnosis_text}
                        </td>
                        <td className="px-3 text-[16px] leading-[24px] font-normal text-text overflow-hidden text-ellipsis whitespace-nowrap">
                          {p.operation_type}
                        </td>
                        <td className="px-3 text-[16px] leading-[24px] font-normal text-text overflow-hidden text-ellipsis whitespace-nowrap">
                          {sentDate}
                        </td>
                        <td className="px-3">
                          <div className="flex items-center" style={{ gap: '8px' }}>
                            <button
                              onClick={(e) => handleApprove(e, p.id)}
                              className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: '#34C759' }}
                              title="Одобрить"
                            >
                              <Check size={18} color="white" strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={(e) => handleReject(e, p.id)}
                              className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: '#FF3B30' }}
                              title="Отклонить"
                            >
                              <X size={18} color="white" strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-8 text-center text-text-secondary text-[16px]"
                      >
                        Нет пациентов
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[14px] leading-[12px] font-medium text-text-secondary">
                {selectedIds.size} из {filtered.length} выбрано
              </span>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <button
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
        <PatientReview
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
    </div>
  )
}

function StatSection({
  color,
  label,
  count,
}: {
  color: string
  label: string
  count: number
}) {
  return (
    <div
      className="flex-1 flex flex-col justify-center items-start overflow-clip"
      style={{ padding: '24px', gap: '16px' }}
    >
      <div className="flex items-center" style={{ gap: '8px' }}>
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[16px] font-medium leading-[24px] text-text-secondary">
          {label}
        </span>
      </div>
      <span
        className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
        style={{ fontFeatureSettings: "'ss01' 1" }}
      >
        {count}
      </span>
    </div>
  )
}

function VerticalDivider() {
  return (
    <div className="self-stretch flex items-center" style={{ width: 0 }}>
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

export default SurgeonDashboard
