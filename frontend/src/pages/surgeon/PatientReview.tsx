import { useEffect, useState } from 'react'
import {
  X,
  User,
  Calendar,
  FileText,
  Search,
  CircleCheckBig,
  Eye,
  MessageCircle,
  Send,
} from 'lucide-react'
import { usePatientStore, selectComments, selectMedia } from '../../store/patients'
import { getDisplayStatus, shortenName } from '../../types'
import type { ChecklistItem, Comment, MediaFile } from '../../types'
import ImageViewer from '../../components/ImageViewer'

interface Props {
  patientId: string
  onClose: () => void
}

const statusConfig: Record<string, { color: string; label: string }> = {
  red: { color: '#FF3B30', label: 'Требует внимания' },
  yellow: { color: '#FFD000', label: 'В подготовке' },
  green: { color: '#34C759', label: 'Готов к операции' },
  date_set: { color: '#3E87FF', label: 'Назначена дата' },
}

function PatientReview({ patientId, onClose }: Props) {
  const patient = usePatientStore((s) => s.patients[patientId])
  const fetchPatient = usePatientStore((s) => s.fetchPatient)
  const fetchComments = usePatientStore((s) => s.fetchComments)
  const fetchMedia = usePatientStore((s) => s.fetchMedia)
  const fetchPatients = usePatientStore((s) => s.fetchPatients)
  const addComment = usePatientStore((s) => s.addComment)
  const approvePatient = usePatientStore((s) => s.approvePatient)
  const rejectPatient = usePatientStore((s) => s.rejectPatient)
  const comments = usePatientStore(selectComments(patientId))
  const mediaFiles = usePatientStore(selectMedia(patientId))

  const [visible, setVisible] = useState(false)
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [operationDate, setOperationDate] = useState('')
  const [operationTime, setOperationTime] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPatient(patientId)
    fetchComments(patientId)
    fetchMedia(patientId)
  }, [patientId])

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showApproveModal) { setShowApproveModal(false); return }
        if (showRejectModal) { setShowRejectModal(false); return }
        handleClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showApproveModal, showRejectModal])

  const handleAddComment = () => {
    if (!newComment.trim()) return
    addComment(patientId, newComment)
    setNewComment('')
  }

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await approvePatient(patientId, operationDate || null, operationTime || null)
      setShowApproveModal(false)
      setOperationDate('')
      setOperationTime('')
      fetchPatients()
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) return
    setSubmitting(true)
    try {
      await rejectPatient(patientId, rejectComment)
      setShowRejectModal(false)
      setRejectComment('')
      fetchPatients()
    } finally {
      setSubmitting(false)
    }
  }

  if (!patient) {
    return (
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black/20 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
          onClick={handleClose}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-[802px] max-w-full bg-white flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
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
        className="absolute inset-0 bg-black/20 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-[802px] max-w-full bg-white flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex flex-col h-full" style={{ padding: '36px 24px', gap: '36px' }}>
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <h2
              className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
              style={{ fontFeatureSettings: "'ss01' 1" }}
            >
              Карточка пациента
            </h2>
            <button
              onClick={handleClose}
              className="flex items-center justify-center rounded-[16px] bg-fill-tertiary overflow-clip shrink-0 cursor-pointer hover:bg-fill-quaternary transition-colors"
              style={{ padding: '12px' }}
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col drawer-scroll" style={{ gap: '36px' }}>
            {/* Patient info cards */}
            <div className="flex flex-col shrink-0" style={{ gap: '8px' }}>
              {/* Row 1: Пациент + Дата рождения */}
              <div className="flex flex-col sm:flex-row" style={{ gap: '8px' }}>
                <InfoCard icon={<User size={24} />} label="Пациент" value={shortenName(patient.full_name)} />
                <InfoCard icon={<Calendar size={24} />} label="Дата рождения" value={patient.birth_date} />
              </div>
              {/* Row 2: СНИЛС + Полис ОМС */}
              <div className="flex flex-col sm:flex-row" style={{ gap: '8px' }}>
                <InfoCard icon={<FileText size={24} />} label="СНИЛС" value={patient.snils ?? '—'} />
                <InfoCard icon={<FileText size={24} />} label="Полис ОМС" value={patient.insurance_policy ?? '—'} />
              </div>
              {/* Row 3: Диагноз + Статус */}
              <div className="flex flex-col sm:flex-row" style={{ gap: '8px' }}>
                <InfoCard icon={<Search size={24} />} label="Диагноз" value={patient.diagnosis_text} />
                <div
                  className="flex-1 border border-border rounded-[24px] overflow-clip flex items-start"
                  style={{ padding: '16px', gap: '16px' }}
                >
                  <div className="shrink-0 w-[48px] h-[48px] bg-surface-secondary rounded-[16px] flex items-center justify-center">
                    <CircleCheckBig size={24} />
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
              {/* Row 4: Тип операции + Врач-офтальмолог */}
              <div className="flex flex-col sm:flex-row" style={{ gap: '8px' }}>
                <InfoCard icon={<Eye size={24} />} label="Тип операции" value={patient.operation_type} />
                <InfoCard icon={<User size={24} />} label="Врач-офтальмолог" value="—" />
              </div>
            </div>

            {/* Comments section */}
            <div className="flex flex-col shrink-0" style={{ gap: '24px' }}>
              <h3
                className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                style={{ fontFeatureSettings: "'ss01' 1" }}
              >
                Комментарии
              </h3>
              <div
                className="border border-border rounded-[24px] overflow-clip flex flex-col"
                style={{ padding: '16px', gap: '24px' }}
              >
                {/* Comments list */}
                {comments.length > 0 ? (
                  <div className="flex flex-col max-h-[240px] overflow-y-auto drawer-scroll" style={{ gap: '16px' }}>
                    {comments.map((comment, i) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        showDivider={i < comments.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center" style={{ padding: '8px' }}>
                    <span className="text-[16px] font-medium text-text-secondary">Нет комментариев</span>
                  </div>
                )}

                {/* Message input */}
                <div className="flex items-center" style={{ gap: '0px' }}>
                  <div
                    className="flex-1 border border-border rounded-[12px] flex items-center"
                    style={{ padding: '0' }}
                  >
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment() }}
                      placeholder="Сообщение"
                      className="flex-1 bg-transparent text-[16px] leading-[24px] tracking-[-0.25px] text-text placeholder:text-text-tertiary focus:outline-none"
                      style={{ padding: '16px 12px' }}
                    />
                    <button
                      onClick={handleAddComment}
                      className="shrink-0 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ padding: '16px 12px' }}
                    >
                      <Send size={24} className="text-text-secondary" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist (read-only) */}
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
                      <SurgeonChecklistRow
                        item={item}
                        mediaFiles={mediaFiles}
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

            {/* Media files (view-only) */}
            <div className="flex flex-col shrink-0" style={{ gap: '24px' }}>
              <h3
                className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                style={{ fontFeatureSettings: "'ss01' 1" }}
              >
                Медиафайлы
              </h3>
              {mediaFiles.length > 0 ? (
                <div className="flex flex-wrap items-start" style={{ gap: '8px' }}>
                  {mediaFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center overflow-clip rounded-full bg-fill-tertiary cursor-pointer hover:bg-fill-quaternary transition-colors"
                      style={{ padding: '8px', maxWidth: '220px' }}
                      onClick={() => setViewerSrc(`/api/media/${file.id}/file`)}
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
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[16px] font-medium text-text-secondary">Нет файлов</span>
              )}
            </div>
          </div>

          {/* Bottom action buttons */}
          <div className="flex flex-col sm:flex-row shrink-0" style={{ gap: '8px' }}>
            {/* Написать врачу */}
            <button
              className="flex-1 flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary cursor-pointer hover:bg-fill-quaternary transition-colors"
              style={{ padding: '16px' }}
            >
              <MessageCircle size={24} />
              <span className="text-[16px] font-medium leading-[24px] text-text" style={{ padding: '0 8px' }}>
                Написать врачу
              </span>
            </button>
            {/* Отклонить */}
            <button
              onClick={() => { setShowRejectModal(true); setShowApproveModal(false) }}
              className="flex-1 flex items-center justify-center overflow-clip text-white rounded-[16px] relative cursor-pointer hover:brightness-110 transition-all"
              style={{
                padding: '16px',
                backgroundImage:
                  'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #FF3B30 0%, #FF3B30 100%)',
              }}
            >
              <span className="text-[16px] font-medium leading-[24px] text-white" style={{ padding: '0 8px' }}>
                Отклонить
              </span>
              <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
              />
            </button>
            {/* Подтвердить */}
            <button
              onClick={() => { setShowApproveModal(true); setShowRejectModal(false) }}
              className="flex-1 flex items-center justify-center overflow-clip text-white rounded-[16px] relative cursor-pointer hover:brightness-110 transition-all"
              style={{
                padding: '16px',
                backgroundImage:
                  'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #007AFF 0%, #007AFF 100%)',
              }}
            >
              <span className="text-[16px] font-medium leading-[24px] text-white" style={{ padding: '0 8px' }}>
                Подтвердить
              </span>
              <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Approve modal */}
      {showApproveModal && (
        <ModalOverlay onClose={() => setShowApproveModal(false)}>
          <div
            className="bg-white rounded-[24px] flex flex-col"
            style={{ width: '420px', padding: '24px', gap: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
              style={{ fontFeatureSettings: "'ss01' 1" }}
            >
              Подтверждение
            </h3>
            <p className="text-[16px] font-medium leading-[24px] text-text-secondary">
              Выберите дату операции для пациента (необязательно)
            </p>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label className="text-[14px] font-medium leading-[12px] text-text-secondary">
                Дата операции
              </label>
              <input
                type="date"
                value={operationDate}
                onChange={(e) => setOperationDate(e.target.value)}
                className="border border-border rounded-[12px] text-[16px] leading-[24px] text-text focus:outline-none focus:border-primary bg-white"
                style={{ padding: '16px 12px' }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label className="text-[14px] font-medium leading-[12px] text-text-secondary">
                Время операции
              </label>
              <input
                type="time"
                value={operationTime}
                onChange={(e) => setOperationTime(e.target.value)}
                className="border border-border rounded-[12px] text-[16px] leading-[24px] text-text focus:outline-none focus:border-primary bg-white"
                style={{ padding: '16px 12px' }}
              />
            </div>
            <div className="flex" style={{ gap: '8px' }}>
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary cursor-pointer hover:bg-fill-quaternary transition-colors"
                style={{ padding: '16px' }}
              >
                <span className="text-[16px] font-medium leading-[24px] text-text">Отмена</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1 flex items-center justify-center overflow-clip text-white rounded-[16px] relative disabled:opacity-60 cursor-pointer hover:brightness-110 transition-all"
                style={{
                  padding: '16px',
                  backgroundImage:
                    'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #007AFF 0%, #007AFF 100%)',
                }}
              >
                <span className="text-[16px] font-medium leading-[24px] text-white">
                  {submitting ? 'Подтверждение...' : 'Подтвердить'}
                </span>
                <div
                  className="absolute inset-0 pointer-events-none rounded-[inherit]"
                  style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
                />
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <ModalOverlay onClose={() => setShowRejectModal(false)}>
          <div
            className="bg-white rounded-[24px] flex flex-col"
            style={{ width: '420px', padding: '24px', gap: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
              style={{ fontFeatureSettings: "'ss01' 1" }}
            >
              Отклонение
            </h3>
            <p className="text-[16px] font-medium leading-[24px] text-text-secondary">
              Укажите причину отклонения пациента
            </p>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label className="text-[14px] font-medium leading-[12px] text-text-secondary">
                Комментарий
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Укажите причину..."
                rows={3}
                className="border border-border rounded-[12px] text-[16px] leading-[24px] text-text focus:outline-none focus:border-primary bg-white resize-none placeholder:text-text-tertiary"
                style={{ padding: '16px 12px' }}
              />
            </div>
            <div className="flex" style={{ gap: '8px' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary cursor-pointer hover:bg-fill-quaternary transition-colors"
                style={{ padding: '16px' }}
              >
                <span className="text-[16px] font-medium leading-[24px] text-text">Отмена</span>
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectComment.trim()}
                className="flex-1 flex items-center justify-center overflow-clip text-white rounded-[16px] relative disabled:opacity-60 cursor-pointer hover:brightness-110 transition-all"
                style={{
                  padding: '16px',
                  backgroundImage:
                    'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #FF3B30 0%, #FF3B30 100%)',
                }}
              >
                <span className="text-[16px] font-medium leading-[24px] text-white">
                  {submitting ? 'Отклонение...' : 'Отклонить'}
                </span>
                <div
                  className="absolute inset-0 pointer-events-none rounded-[inherit]"
                  style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
                />
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
    </div>
  )
}

/* ─── Sub-components ─── */

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      {children}
    </div>
  )
}

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

function SurgeonChecklistRow({
  item,
  mediaFiles,
  onViewFile,
}: {
  item: ChecklistItem
  mediaFiles: MediaFile[]
  onViewFile: (src: string) => void
}) {
  const linkedMedia = item.item_type === 'file_upload' && item.file_path
    ? mediaFiles.find((m) => m.file_path === item.file_path)
    : null

  return (
    <div className="flex items-center justify-between" style={{ minHeight: '40px' }}>
      {/* Left: Checkbox (disabled) + label */}
      <div className="flex items-center shrink-0" style={{ gap: '12px' }}>
        <div
          className="w-[20px] h-[20px] rounded-[6px] flex items-center justify-center shrink-0"
          style={
            item.is_completed
              ? { backgroundColor: '#007AFF', border: '1.5px solid #007AFF' }
              : { backgroundColor: 'rgba(120,120,128,0.12)', borderRadius: '6px' }
          }
        >
          {item.is_completed && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span
          className="text-[20px] font-medium leading-[20px] tracking-[-0.33px]"
          style={{ color: item.is_completed ? '#101012' : 'rgba(60,60,67,0.32)' }}
        >
          {item.title}
        </span>
      </div>

      {/* Right: File pill if uploaded */}
      {item.item_type === 'file_upload' && item.file_path && (
        <div
          className="flex items-center overflow-clip rounded-full bg-fill-tertiary shrink-0 cursor-pointer hover:bg-fill-quaternary transition-colors"
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
    </div>
  )
}

export default PatientReview
