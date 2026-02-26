import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X,
  Upload,
  Pencil,
  MessageCircle,
  ChevronLeft,
} from 'lucide-react'
import calculatorIcon from '../assets/icons/calculator.svg'
import downloadIcon from '../assets/icon-download.svg'
import personIcon from '../assets/icons/person.svg'
import calendarIcon from '../assets/icons/calendar.svg'
import documentIcon from '../assets/icons/document.svg'
import checkmarkIcon from '../assets/icons/checkmark.svg'
import eyeIcon from '../assets/icons/eye.svg'
import searchIcon from '../assets/icons/search.svg'
import { usePatientStore, selectComments, selectMedia } from '../store/patients'
import { getDisplayStatus, shortenName } from '../types'
import type { ChecklistItem, Comment, MediaFile, IolCalculation } from '../types'
import api from '../api/client'
import { compressImage } from '../hooks/useImageCompression'
import ImageViewer from './ImageViewer'
import {
  diagnosisList,
  operationTypes,
  inputBase,
  selectStyle,
  iconWrapStyle,
  IconChevronDown,
  DiagnosisField,
  OperationTypeField,
  DateField,
} from './form-fields'
import { animate, createSpring, stagger } from 'animejs'

interface Props {
  patientId: string
  onClose: () => void
}

const iolModels = [
  'Alcon SN60WF',
  'Alcon SA60AT',
  'Zeiss CT ASPHINA 509M',
  'Zeiss CT LUCIA 611P',
  'Hoya iSert 251',
  'J&J TECNIS ZCB00',
]

const iolFormulaOptions = [
  { value: 'srk_t', label: 'SRK/T' },
  { value: 'holladay_1', label: 'Holladay 1' },
  { value: 'hoffer_q', label: 'Hoffer Q' },
]

const statusConfig: Record<string, { color: string; label: string }> = {
  red: { color: '#FF3B30', label: 'Требует внимания' },
  yellow: { color: '#FFD000', label: 'В подготовке' },
  green: { color: '#34C759', label: 'Готов к операции' },
  date_set: { color: '#3E87FF', label: 'Назначена дата' },
}

function PatientDrawer({ patientId, onClose }: Props) {
  const patient = usePatientStore((s) => s.patients[patientId])
  const fetchPatient = usePatientStore((s) => s.fetchPatient)
  const fetchComments = usePatientStore((s) => s.fetchComments)
  const fetchMedia = usePatientStore((s) => s.fetchMedia)
  const toggleChecklist = usePatientStore((s) => s.toggleChecklist)
  const updatePatient = usePatientStore((s) => s.updatePatient)
  const comments = usePatientStore(selectComments(patientId))
  const mediaFiles = usePatientStore(selectMedia(patientId))
  const deleteMedia = usePatientStore((s) => s.deleteMedia)
  const addMediaFile = usePatientStore((s) => s.addMediaFile)
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)
  const [mediaUploading, setMediaUploading] = useState(false)
  const mediaFileRef = useRef<HTMLInputElement>(null)
  const drawerPanelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<'view' | 'edit' | 'iol'>('view')

  // Edit mode state
  const [editSaving, setEditSaving] = useState(false)
  const [editSurname, setEditSurname] = useState('')
  const [editName, setEditName] = useState('')
  const [editPatronymic, setEditPatronymic] = useState('')
  const [editBirthDate, setEditBirthDate] = useState('')
  const [editSnils, setEditSnils] = useState('')
  const [editInsurance, setEditInsurance] = useState('')
  const [editDiagnosisSearch, setEditDiagnosisSearch] = useState('')
  const [editSelectedDiagnosis, setEditSelectedDiagnosis] = useState<{ code: string; text: string } | null>(null)
  const [editOperationType, setEditOperationType] = useState('')

  // IOL mode state
  const addIolCalc = usePatientStore((s) => s.addIolCalc)
  const [iolK1, setIolK1] = useState('')
  const [iolK2, setIolK2] = useState('')
  const [iolAL, setIolAL] = useState('')
  const [iolACD, setIolACD] = useState('')
  const [iolTargetRefraction, setIolTargetRefraction] = useState('0')
  const [iolModel, setIolModel] = useState('Alcon SN60WF')
  const [iolFormula, setIolFormula] = useState('srk_t')
  const [iolLoading, setIolLoading] = useState(false)
  const [iolResults, setIolResults] = useState<{ power: number; expected: number; formula: string }[] | null>(null)
  const [iolSelectedIdx, setIolSelectedIdx] = useState<number>(1)

  useEffect(() => {
    fetchPatient(patientId)
    fetchComments(patientId)
    fetchMedia(patientId)
  }, [patientId])

  const springDrawer = createSpring({ mass: 1, stiffness: 140, damping: 16, velocity: 0 })

  // Animate in + lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    // Backdrop fade in
    if (backdropRef.current) {
      animate(backdropRef.current, { opacity: [0, 1], duration: 300, ease: 'outQuad' })
    }

    // Panel slide in with spring
    if (drawerPanelRef.current) {
      animate(drawerPanelRef.current, {
        translateX: ['100%', '0%'],
        duration: 600,
        ease: springDrawer,
      })
    }

    // Stagger content children + bounce icons
    requestAnimationFrame(() => {
      if (contentRef.current) {
        const children = Array.from(contentRef.current.children)
        if (children.length) {
          children.forEach((c) => {
            ;(c as HTMLElement).style.opacity = '0'
            ;(c as HTMLElement).style.transform = 'translateY(16px)'
          })
          animate(children, {
            opacity: [0, 1],
            translateY: [16, 0],
            delay: stagger(60, { start: 200 }),
            duration: 500,
            ease: springDrawer,
          })
        }

        // Icons: spin + bounce in place (already visible)
        const icons = Array.from(contentRef.current.querySelectorAll('img[width="24"], svg'))
        if (icons.length) {
          const iconSpring = createSpring({ mass: 1, stiffness: 100, damping: 8, velocity: 0 })
          animate(icons, {
            scale: [1, 1.2, 0.9, 1.05, 1],
            rotate: ['0deg', '360deg'],
            translateY: [0, -5, 2, 0],
            delay: stagger(50, { start: 100 }),
            duration: 800,
            ease: iconSpring,
          })
        }
      }
    })

    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleClose = useCallback(() => {
    // Animate out
    if (backdropRef.current) {
      animate(backdropRef.current, { opacity: [1, 0], duration: 250, ease: 'inQuad' })
    }
    if (drawerPanelRef.current) {
      animate(drawerPanelRef.current, {
        translateX: ['0%', '100%'],
        duration: 300,
        ease: 'inQuart',
      })
    }
    setTimeout(onClose, 300)
  }, [onClose])

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaUploading(true)
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('patient_id', patientId)
      formData.append('file', compressed, file.name)
      const { data } = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      addMediaFile(patientId, data)
    } finally {
      setMediaUploading(false)
      if (mediaFileRef.current) mediaFileRef.current.value = ''
    }
  }

  const handleChecklistFileUpload = async (item: ChecklistItem, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    await api.post(`/checklists/${item.id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    fetchPatient(patientId)
    fetchMedia(patientId)
  }

  const enterEditMode = () => {
    if (!patient) return
    const parts = patient.full_name.trim().split(/\s+/)
    setEditSurname(parts[0] || '')
    setEditName(parts[1] || '')
    setEditPatronymic(parts.slice(2).join(' ') || '')
    setEditBirthDate(patient.birth_date || '')
    setEditSnils(patient.snils || '')
    setEditInsurance(patient.insurance_policy || '')
    // Try to find matching diagnosis from list
    const found = diagnosisList.find((d) => patient.diagnosis_code === d.code)
    if (found) {
      setEditSelectedDiagnosis(found)
    } else {
      setEditSelectedDiagnosis({ code: patient.diagnosis_code, text: patient.diagnosis_text })
    }
    setEditDiagnosisSearch('')
    setEditOperationType(patient.operation_type || operationTypes[0])
    setMode('edit')
  }

  const handleIolCalculate = async () => {
    setIolLoading(true)
    try {
      const res = await api.post<IolCalculation>('/iol/calculate', {
        patient_id: patientId,
        eye: 'right',
        k1: parseFloat(iolK1),
        k2: parseFloat(iolK2),
        axial_length: parseFloat(iolAL),
        acd: parseFloat(iolACD),
        target_refraction: parseFloat(iolTargetRefraction),
        formula: iolFormula,
      })

      const rec = res.data.recommended_iol
      const target = parseFloat(iolTargetRefraction) || 0
      const rounded = Math.round(rec * 2) / 2
      const formulaLabel = iolFormulaOptions.find((f) => f.value === iolFormula)?.label || ''
      const residual = (rec - rounded) * 0.76
      const midExpected = Math.round((target + residual) * 100) / 100
      const step = 0.38

      setIolResults([
        { power: rounded - 0.5, expected: Math.round((midExpected - step) * 100) / 100, formula: formulaLabel },
        { power: rounded, expected: midExpected, formula: formulaLabel },
        { power: rounded + 0.5, expected: Math.round((midExpected + step) * 100) / 100, formula: formulaLabel },
      ])
      setIolSelectedIdx(1)
      addIolCalc(patientId, res.data)
    } finally {
      setIolLoading(false)
    }
  }

  const handleIolSave = () => {
    // Mark calculator checklist item as completed
    if (patient) {
      const calcItem = patient.checklist.find((c) => c.item_type === 'calculator')
      if (calcItem && !calcItem.is_completed) {
        toggleChecklist(calcItem.id, patientId, calcItem.is_completed)
      }
    }
    setMode('view')
  }

  const handleSave = async () => {
    if (!editSelectedDiagnosis) return
    setEditSaving(true)
    try {
      const fullName = [editSurname, editName, editPatronymic].filter(Boolean).join(' ')
      await updatePatient(patientId, {
        full_name: fullName,
        birth_date: editBirthDate,
        snils: editSnils || null,
        insurance_policy: editInsurance || null,
        diagnosis_code: editSelectedDiagnosis.code,
        diagnosis_text: `${editSelectedDiagnosis.code} - ${editSelectedDiagnosis.text}`,
        operation_type: editOperationType,
        notes: patient?.notes || null,
        operation_date: patient?.operation_date || null,
      })
      setMode('view')
    } finally {
      setEditSaving(false)
    }
  }

  if (!patient) {
    return (
      <div className="fixed inset-0 z-50">
        <div
          ref={backdropRef}
          className="absolute inset-0 bg-black/20"
          style={{ opacity: 0 }}
          onClick={handleClose}
        />
        <div
          ref={drawerPanelRef}
          className="absolute right-0 top-0 bottom-0 w-[802px] max-w-full bg-white flex items-center justify-center"
          style={{ transform: 'translateX(100%)' }}
        >
          <span className="text-text-secondary text-[16px] font-medium">Загрузка...</span>
        </div>
      </div>
    )
  }

  const displayStatus = getDisplayStatus(patient)
  const sc = statusConfig[displayStatus]

  return (
    <div className="fixed inset-0 z-50">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/20"
        style={{ opacity: 0 }}
        onClick={handleClose}
      />
      <div
        ref={drawerPanelRef}
        className="absolute right-0 top-0 bottom-0 w-[802px] max-w-full bg-white flex flex-col"
        style={{ transform: 'translateX(100%)' }}
      >
        {/* Content wrapper */}
        <div ref={contentRef} className="flex flex-col h-full" style={{ padding: '36px 24px', gap: '36px' }}>
          {mode === 'iol' ? (
            /* ═══ IOL CALCULATOR MODE ═══ */
            <>
              {/* Header: Back + "Рассчитать ИОЛ" + Close */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center" style={{ gap: '16px' }}>
                  <button
                    onClick={() => setMode('view')}
                    className="flex items-center justify-center rounded-[16px] bg-fill-tertiary overflow-clip shrink-0"
                    style={{ padding: '12px' }}
                  >
                    <ChevronLeft size={24} strokeWidth={2} />
                  </button>
                  <h2
                    className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
                    style={{ fontFeatureSettings: "'ss01' 1" }}
                  >
                    Рассчитать ИОЛ
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center rounded-[16px] bg-fill-tertiary overflow-clip shrink-0"
                  style={{ padding: '12px' }}
                >
                  <X size={24} strokeWidth={2} />
                </button>
              </div>

              {/* Scrollable form + results */}
              <div className="flex-1 overflow-y-auto min-h-0 flex flex-col drawer-scroll" style={{ gap: '36px' }}>
                {/* Input fields */}
                <div className="flex flex-col shrink-0" style={{ gap: '8px' }}>
                  {/* Row 1: K1 + K2 */}
                  <div className="flex" style={{ gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="K1 (дптр)"
                        value={iolK1}
                        onChange={(e) => setIolK1(e.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="K2 (дптр)"
                        value={iolK2}
                        onChange={(e) => setIolK2(e.target.value)}
                        style={inputBase}
                      />
                    </div>
                  </div>
                  {/* Row 2: AL + ACD */}
                  <div className="flex" style={{ gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="AL (мм)"
                        value={iolAL}
                        onChange={(e) => setIolAL(e.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ACD (мм)"
                        value={iolACD}
                        onChange={(e) => setIolACD(e.target.value)}
                        style={inputBase}
                      />
                    </div>
                  </div>
                  {/* Row 3: Target refraction + IOL Model */}
                  <div className="flex" style={{ gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="number"
                        step="0.25"
                        placeholder="Целевая рефракция"
                        value={iolTargetRefraction}
                        onChange={(e) => setIolTargetRefraction(e.target.value)}
                        style={inputBase}
                      />
                    </div>
                    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                      <select
                        value={iolModel}
                        onChange={(e) => setIolModel(e.target.value)}
                        style={selectStyle}
                      >
                        {iolModels.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <div style={iconWrapStyle}>
                        <IconChevronDown />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formula radio buttons */}
                <div className="flex items-center" style={{ gap: '24px' }}>
                  {iolFormulaOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className="flex items-center"
                      style={{ gap: '12px' }}
                      onClick={() => setIolFormula(opt.value)}
                    >
                      {iolFormula === opt.value ? (
                        <div
                        style={{
                                width: 20,
                                height: 20,
                                borderRadius: 9999,
                                background: '#007AFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              >
                                <div 
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 9999,
                                    background: 'white',
                                  }}
                                />
                          </div>
                      ) : (
                        <div 
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 9999,
                            background: 'rgba(120,120,128,0.16)',
                          }}
                        />
                      )}
                      <span className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-text">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Calculate button */}
                <button
                  onClick={handleIolCalculate}
                  disabled={iolLoading || !iolK1 || !iolK2 || !iolAL || !iolACD}
                  className="flex items-center justify-center overflow-clip rounded-[16px] shrink-0 w-full disabled:opacity-50"
                  style={{ padding: '16px', background: 'rgba(0, 122, 255, 0.12)' }}
                >
                  <span className="text-[16px] font-medium leading-[24px] text-primary" style={{ padding: '0 8px' }}>
                    {iolLoading ? 'Расчёт...' : 'Рассчитать ИОЛ'}
                  </span>
                </button>

                {/* Results section */}
                {iolResults && (
                  <div className="flex flex-col shrink-0" style={{ gap: '24px' }}>
                    <h3
                      className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                      style={{ fontFeatureSettings: "'ss01' 1" }}
                    >
                      Результаты
                    </h3>
                    <div
                      className="border border-border rounded-[16px] overflow-clip w-full"
                      style={{ minWidth: 560 }}
                    >
                      {/* Table header */}
                      <div className="flex w-full" style={{ height: 48 }}>
                        <div
                          className="flex-1 flex items-center text-[14px] font-medium leading-[12px] text-text-secondary"
                          style={{ padding: '0 12px', borderBottom: '1px solid rgba(120,120,128,0.16)' }}
                        >
                          Сила D
                        </div>
                        <div
                          className="flex-1 flex items-center text-[14px] font-medium leading-[12px] text-text-secondary"
                          style={{ padding: '0 12px', borderBottom: '1px solid rgba(120,120,128,0.16)' }}
                        >
                          Ожидаемая D
                        </div>
                        <div
                          className="flex-1 flex items-center text-[14px] font-medium leading-[12px] text-text-secondary"
                          style={{ padding: '0 12px', borderBottom: '1px solid rgba(120,120,128,0.16)' }}
                        >
                          Формула
                        </div>
                      </div>
                      {/* Table rows */}
                      {iolResults.map((row, idx) => (
                        <button
                          key={idx}
                          className="flex w-full text-left"
                          style={{
                            height: 64,
                            backgroundColor:
                              idx === iolSelectedIdx
                                ? 'rgba(0,122,255,0.08)'
                                : idx % 2 === 1
                                  ? '#f7f8fa'
                                  : 'white',
                            cursor: 'pointer',
                          }}
                          onClick={() => setIolSelectedIdx(idx)}
                        >
                          <div
                            className="flex-1 flex items-center text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text"
                            style={{ padding: '0 12px' }}
                          >
                            {row.power >= 0 ? '+' : ''}{row.power.toFixed(1)}
                          </div>
                          <div
                            className="flex-1 flex items-center text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text"
                            style={{ padding: '0 12px' }}
                          >
                            {row.expected >= 0 ? '+' : ''}{row.expected.toFixed(2)}
                          </div>
                          <div
                            className="flex-1 flex items-center text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text"
                            style={{ padding: '0 12px' }}
                          >
                            {row.formula}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom buttons: Отмена + Выбрать и сохранить */}
              <div className="flex shrink-0" style={{ gap: '8px' }}>
                <button
                  onClick={() => setMode('view')}
                  className="flex-1 flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary"
                  style={{ padding: '16px' }}
                >
                  <span className="text-[16px] font-medium leading-[24px] text-text" style={{ padding: '0 8px' }}>
                    Отмена
                  </span>
                </button>
                <button
                  onClick={handleIolSave}
                  disabled={!iolResults}
                  className="flex-1 flex items-center justify-center overflow-clip text-white rounded-[16px] relative disabled:opacity-60"
                  style={{
                    padding: '16px',
                    backgroundImage:
                      'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgb(0,122,255) 0%, rgb(0,122,255) 100%)',
                  }}
                >
                  <span className="text-[16px] font-medium leading-[24px] text-white" style={{ padding: '0 8px' }}>
                    {iolResults
                      ? `Выбрать ${iolResults[iolSelectedIdx].power >= 0 ? '+' : ''}${iolResults[iolSelectedIdx].power.toFixed(1)} D и сохранить`
                      : 'Выбрать и сохранить'}
                  </span>
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
                  />
                </button>
              </div>
            </>
          ) : mode === 'edit' ? (
            /* ═══ EDIT MODE ═══ */
            <>
              {/* Header: Back + Title + Close */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center" style={{ gap: '16px' }}>
                  <button
                    onClick={() => setMode('view')}
                    className="flex items-center justify-center rounded-[16px] bg-fill-tertiary overflow-clip shrink-0"
                    style={{ padding: '12px' }}
                  >
                    <ChevronLeft size={24} strokeWidth={2} />
                  </button>
                  <h2
                    className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
                    style={{ fontFeatureSettings: "'ss01' 1" }}
                  >
                    Редактирование пациента
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center rounded-[16px] bg-fill-tertiary overflow-clip shrink-0"
                  style={{ padding: '12px' }}
                >
                  <X size={24} strokeWidth={2} />
                </button>
              </div>

              {/* Scrollable form area */}
              <div className="flex-1 overflow-y-auto min-h-0 flex flex-col drawer-scroll" style={{ gap: '36px' }}>
                {/* Section: Данные пациента */}
                <div className="flex flex-col shrink-0" style={{ gap: '24px' }}>
                  <h3
                    className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                    style={{ fontFeatureSettings: "'ss01' 1" }}
                  >
                    Данные пациента
                  </h3>
                  <div className="flex flex-col" style={{ gap: '8px' }}>
                    <div className="flex" style={{ gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input type="text" placeholder="Фамилия" value={editSurname} onChange={(e) => setEditSurname(e.target.value)} style={inputBase} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input type="text" placeholder="Имя" value={editName} onChange={(e) => setEditName(e.target.value)} style={inputBase} />
                      </div>
                    </div>
                    <div className="flex" style={{ gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input type="text" placeholder="Отчество" value={editPatronymic} onChange={(e) => setEditPatronymic(e.target.value)} style={inputBase} />
                      </div>
                      <DateField value={editBirthDate} onChange={setEditBirthDate} />
                    </div>
                    <div className="flex" style={{ gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input type="text" placeholder="СНИЛС" value={editSnils} onChange={(e) => setEditSnils(e.target.value)} style={inputBase} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input type="text" placeholder="Полис ОМС" value={editInsurance} onChange={(e) => setEditInsurance(e.target.value)} style={inputBase} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Диагноз и тип операции */}
                <div className="flex flex-col shrink-0" style={{ gap: '24px' }}>
                  <h3
                    className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                    style={{ fontFeatureSettings: "'ss01' 1" }}
                  >
                    Диагноз и тип операции
                  </h3>
                  <div className="flex" style={{ gap: '8px' }}>
                    <DiagnosisField
                      selectedDiagnosis={editSelectedDiagnosis}
                      diagnosisSearch={editDiagnosisSearch}
                      onSearchChange={setEditDiagnosisSearch}
                      onSelect={setEditSelectedDiagnosis}
                    />
                    <OperationTypeField
                      value={editOperationType}
                      onChange={setEditOperationType}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom buttons: Отмена + Сохранить */}
              <div className="flex shrink-0" style={{ gap: '8px' }}>
                <button
                  onClick={() => setMode('view')}
                  className="flex-1 flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary"
                  style={{ padding: '16px' }}
                >
                  <span className="text-[16px] font-medium leading-[24px] text-text" style={{ padding: '0 8px' }}>
                    Отмена
                  </span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={editSaving}
                  className="flex-1 flex items-center justify-center overflow-clip text-white rounded-[16px] relative disabled:opacity-60"
                  style={{
                    padding: '16px',
                    backgroundImage:
                      'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgb(0,122,255) 0%, rgb(0,122,255) 100%)',
                  }}
                >
                  <span className="text-[16px] font-medium leading-[24px] text-white" style={{ padding: '0 8px' }}>
                    {editSaving ? 'Сохранение...' : 'Сохранить'}
                  </span>
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
                  />
                </button>
              </div>
            </>
          ) : (
            /* ═══ VIEW MODE ═══ */
            <>
              {/* Header: Title + Close */}
              <div className="flex items-center justify-between shrink-0">
                <h2
                  className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
                  style={{ fontFeatureSettings: "'ss01' 1" }}
                >
                  Карточка пациента
                </h2>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center rounded-[16px] bg-fill-tertiary overflow-clip shrink-0"
                  style={{ padding: '12px' }}
                >
                  <X size={24} strokeWidth={2} />
                </button>
              </div>

              {/* Scrollable area */}
              <div className="flex-1 overflow-y-auto min-h-0 flex flex-col drawer-scroll" style={{ gap: '36px' }}>

                {/* Patient info cards — 2-column grid */}
                <div className="flex flex-col shrink-0" style={{ gap: '8px' }}>
                  {/* Row 1: Пациент + Дата рождения */}
                  <div className="flex" style={{ gap: '8px' }}>
                    <InfoCard icon={<img src={personIcon} width={24} height={24} alt="" />} label="Пациент" value={shortenName(patient.full_name)} />
                    <InfoCard icon={<img src={calendarIcon} width={24} height={24} alt="" />} label="Дата рождения" value={patient.birth_date} />
                  </div>
                  {/* Row 2: СНИЛС + Полис ОМС */}
                  <div className="flex" style={{ gap: '8px' }}>
                    <InfoCard icon={<img src={documentIcon} width={24} height={24} alt="" />} label="СНИЛС" value={patient.snils ?? '—'} />
                    <InfoCard icon={<img src={documentIcon} width={24} height={24} alt="" />} label="Полис ОМС" value={patient.insurance_policy ?? '—'} />
                  </div>
                  {/* Row 3: Диагноз + Статус */}
                  <div className="flex" style={{ gap: '8px' }}>
                    <InfoCard icon={<img src={searchIcon} width={24} height={24} alt="" />} label="Диагноз" value={patient.diagnosis_text} />
                    {/* Status card — custom with badge dot */}
                    <div
                      className="flex-1 border border-border rounded-[24px] overflow-clip flex items-start"
                      style={{ padding: '16px', gap: '16px' }}
                    >
                      <div className="shrink-0 w-[48px] h-[48px] bg-surface-secondary rounded-[16px] flex items-center justify-center">
                        <img src={checkmarkIcon} width={24} height={24} alt="" />
                      </div>
                      <div className="flex flex-col min-w-0" style={{ gap: '4px' }}>
                        <span className="text-[16px] font-medium leading-[24px] text-text-secondary">Статус</span>
                        <div className="flex items-center" style={{ gap: '8px' }}>
                          <div
                            className="w-[12px] h-[12px] rounded-full shrink-0"
                            style={{ backgroundColor: sc?.color }}
                          />
                          <span className="text-[20px] font-semibold leading-[20px] tracking-[-0.33px] text-text whitespace-nowrap">
                            {sc?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Row 4: Тип операции + Хирург */}
                  <div className="flex" style={{ gap: '8px' }}>
                    <InfoCard icon={<img src={eyeIcon} width={24} height={24} alt="" />} label="Тип операции" value={patient.operation_type} />
                    <InfoCard icon={<img src={personIcon} width={24} height={24} alt="" />} label="Хирург" value="—" />
                  </div>
                </div>

                {/* Surgeon comments */}
                <div className="flex flex-col shrink-0" style={{ gap: '24px' }}>
                  <h3
                    className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                    style={{ fontFeatureSettings: "'ss01' 1" }}
                  >
                    Комментарии хирурга
                  </h3>
                  {comments.length > 0 ? (
                    <div
                      className="border border-border rounded-[24px] overflow-clip"
                      style={{ padding: '16px 16px 0' }}
                    >
                      <div className="flex flex-col max-h-[200px] overflow-y-auto drawer-scroll" style={{ gap: '16px', paddingBottom: '16px' }}>
                        {comments.map((comment, i) => (
                          <CommentItem
                            key={comment.id}
                            comment={comment}
                            showDivider={i < comments.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border border-border rounded-[24px] flex items-center justify-center"
                      style={{ padding: '24px' }}
                    >
                      <span className="text-[16px] font-medium text-text-secondary">Нет комментариев</span>
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div className="flex flex-col shrink-0" style={{ gap: '24px' }}>
                  <h3
                    className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                    style={{ fontFeatureSettings: "'ss01' 1" }}
                  >
                    Чек-лист подготовки
                  </h3>
                  {patient.checklist.length > 0 ? (
                    <div className="flex flex-col" style={{ gap: '12px' }}>
                      {patient.checklist.map((item, i) => (
                        <div key={item.id}>
                          <ChecklistRow
                            item={item}
                            mediaFiles={mediaFiles}
                            onToggle={() => toggleChecklist(item.id, patientId, item.is_completed)}
                            onFileUpload={(file) => handleChecklistFileUpload(item, file)}
                            onNavigateIOL={() => setMode('iol')}
                            onViewFile={(src) => setViewerSrc(src)}
                          />
                          {i < patient.checklist.length - 1 && (
                            <div className="w-full h-px bg-border" style={{ marginTop: '12px' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[16px] font-medium text-text-secondary">Чек-лист пуст</span>
                  )}
                </div>

                {/* Media files */}
                <div className="flex flex-col shrink-0" style={{ gap: '24px' }}>
                  <h3
                    className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                    style={{ fontFeatureSettings: "'ss01' 1" }}
                  >
                    Медиафайлы
                  </h3>
                  <div className="flex flex-wrap items-start" style={{ gap: '8px' }}>
                    {mediaFiles.map((file) => (
                      <MediaPill
                        key={file.id}
                        file={file}
                        onDelete={() => deleteMedia(file.id, patientId)}
                        onClick={() => setViewerSrc(`/api/media/${file.id}/file`)}
                      />
                    ))}
                    <label className="cursor-pointer">
                      <div
                        className="flex items-center justify-center overflow-clip rounded-full"
                        style={{ padding: '8px', background: 'rgba(0, 122, 255, 0.12)' }}
                      >
                        <Upload size={24} className="text-primary shrink-0" />
                        <span
                          className="text-[16px] font-medium leading-[24px] text-primary whitespace-nowrap"
                          style={{ padding: '0 8px' }}
                        >
                          {mediaUploading ? 'Загрузка...' : 'Загрузить файл'}
                        </span>
                      </div>
                      <input
                        ref={mediaFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMediaUpload}
                        disabled={mediaUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom action buttons */}
              <div className="flex shrink-0" style={{ gap: '8px' }}>
                <button
                  onClick={enterEditMode}
                  className="flex-1 flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary"
                  style={{ padding: '16px' }}
                >
                  <Pencil size={24} />
                  <span className="text-[16px] font-medium leading-[24px] text-text" style={{ padding: '0 8px' }}>
                    Редактировать
                  </span>
                </button>
                <button
                  className="flex-1 flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary"
                  style={{ padding: '16px' }}
                >
                  <MessageCircle size={24} />
                  <span className="text-[16px] font-medium leading-[24px] text-text" style={{ padding: '0 8px' }}>
                    Написать хирургу
                  </span>
                </button>
                <button
                  className="flex-1 flex items-center justify-center overflow-clip text-white rounded-[16px] relative"
                  style={{
                    padding: '16px',
                    backgroundImage:
                      'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgb(0,122,255) 0%, rgb(0,122,255) 100%)',
                  }}
                >
                  <span className="text-[16px] font-medium leading-[24px] text-white" style={{ padding: '0 8px' }}>
                    Отправить на проверку
                  </span>
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </div>
  )
}

/* ─── Sub-components ─── */

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex-1 border border-border rounded-[24px] overflow-clip flex items-start"
      style={{ padding: '16px', gap: '16px' }}
    >
      <div className="shrink-0 w-[48px] h-[48px] bg-surface-secondary rounded-[16px] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col min-w-0" style={{ gap: '4px' }}>
        <span className="text-[16px] font-medium leading-[24px] text-text-secondary">{label}</span>
        <span className="text-[20px] font-semibold leading-[20px] tracking-[-0.33px] text-text break-words">
          {value}
        </span>
      </div>
    </div>
  )
}

function CommentItem({ comment, showDivider }: { comment: Comment; showDivider: boolean }) {
  const date = new Date(comment.created_at)
  const formatted = `${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  const name = comment.author_name || 'Хирург'
  const initials = name[0]?.toUpperCase() || 'Д'

  return (
    <>
      <div className="flex items-start" style={{ gap: '8px' }}>
        {/* Avatar circle */}
        <div
          className="shrink-0 w-[32px] h-[32px] rounded-full flex items-center justify-center text-white text-[14px] font-bold"
          style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)' }}
        >
          {initials}
        </div>
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: '8px' }}>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-[16px] font-medium leading-[24px] text-text whitespace-nowrap">
              {shortenName(name)}
            </span>
            <span className="text-[14px] font-medium leading-[12px] text-text-secondary whitespace-nowrap">
              {formatted}
            </span>
          </div>
          <span className="text-[14px] font-medium leading-[12px] text-text-secondary">
            {comment.content}
          </span>
        </div>
      </div>
      {showDivider && <div className="w-full h-px bg-border" />}
    </>
  )
}

function ChecklistRow({
  item,
  mediaFiles,
  onToggle,
  onFileUpload,
  onNavigateIOL,
  onViewFile,
}: {
  item: ChecklistItem
  mediaFiles: MediaFile[]
  onToggle: () => void
  onFileUpload: (file: File) => void
  onNavigateIOL: () => void
  onViewFile: (src: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const linkedMedia = item.item_type === 'file_upload' && item.file_path
    ? mediaFiles.find((m) => m.file_path === item.file_path)
    : null

  return (
    <div className="flex items-center justify-between">
      {/* Left: Checkbox + label */}
      <div className="flex items-center shrink-0" style={{ gap: '12px' }}>
        <button
          onClick={onToggle}
          className="w-[20px] h-[20px] rounded-[6px] flex items-center justify-center shrink-0"
          style={
            item.is_completed
              ? { backgroundColor: '#007AFF', border: '1.5px solid #007AFF' }
              : { border: '1.5px solid rgba(120, 120, 128, 0.16)' }
          }
        >
          {item.is_completed && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <span className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-text">
          {item.title}
        </span>
      </div>

      {/* Right: Action button */}
      {item.item_type === 'file_upload' && item.file_path && (
        <div
          className="flex items-center overflow-clip rounded-full bg-fill-tertiary shrink-0 cursor-pointer"
          style={{ padding: '8px', maxWidth: '260px' }}
          onClick={() => {
            if (linkedMedia) onViewFile(`/api/media/${linkedMedia.id}/file`)
          }}
        >
          <div className="w-[24px] h-[24px] rounded-[8px] border border-border shrink-0 overflow-clip">
            {linkedMedia ? (
              <img
                src={`/api/media/${linkedMedia.id}/thumb`}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <div className="w-full h-full bg-surface-secondary" />
            )}
          </div>
          <span className="text-[16px] font-medium leading-[24px] text-text truncate" style={{ padding: '0 8px' }}>
            {linkedMedia?.file_name || item.file_path.split('/').pop() || 'Файл'}
          </span>
        </div>
      )}

      {item.item_type === 'file_upload' && !item.file_path && (
        <label className="cursor-pointer shrink-0">
          <div
            className="flex items-center overflow-clip rounded-full"
            style={{ padding: '8px', background: 'rgba(0, 122, 255, 0.12)' }}
          >
            <img src={downloadIcon} width={24} height={24} alt="" className="shrink-0" />
            <span className="text-[16px] font-medium leading-[24px] text-primary" style={{ padding: '0 8px' }}>
              Загрузить файл
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileUpload(file)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
          />
        </label>
      )}

      {item.item_type === 'calculator' && (
        <button
          onClick={onNavigateIOL}
          className="flex items-center overflow-clip rounded-full shrink-0"
          style={{ padding: '8px', background: 'rgba(0, 122, 255, 0.12)' }}
        >
          <img src={calculatorIcon} width={24} height={24} alt="" className="shrink-0" />
          <span className="text-[16px] font-medium leading-[24px] text-primary" style={{ padding: '0 8px' }}>
            Рассчитать ИОЛ
          </span>
        </button>
      )}
    </div>
  )
}

function MediaPill({
  file,
  onDelete,
  onClick,
}: {
  file: MediaFile
  onDelete: () => void
  onClick: () => void
}) {
  return (
    <div
      className="flex items-center overflow-clip rounded-full bg-fill-tertiary cursor-pointer hover:bg-fill-quaternary transition-colors"
      style={{ padding: '8px', maxWidth: '220px' }}
      onClick={onClick}
    >
      <div className="w-[24px] h-[24px] rounded-[8px] border border-border shrink-0 overflow-clip">
        <img
          src={`/api/media/${file.id}/thumb`}
          className="w-full h-full object-cover"
          alt=""
        />
      </div>
      <span
        className="text-[16px] font-medium leading-[24px] text-text truncate"
        style={{ padding: '0 8px' }}
      >
        {file.file_name}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
      >
        <X size={24} className="text-text-secondary" />
      </button>
    </div>
  )
}

export default PatientDrawer
