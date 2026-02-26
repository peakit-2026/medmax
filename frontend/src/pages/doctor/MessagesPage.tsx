import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Search,
  Paperclip,
  CheckCheck,
  Folder,
  X,
  Send,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import videoIcon from '../../assets/icons/camera.svg'
import api from '../../api/client'
import { useChatStore, type Conversation, type ChatMessage, type MessageAttachment } from '../../store/chat'
import { useAuthStore } from '../../store/auth'
import VideoCall from '../../components/VideoCall'
import { acquireMediaStream } from '../../hooks/useWebTransport'

/* ── Helpers ─────────────────────────────────────────────────────────── */

const AVATAR_GRADIENTS: Record<string, string> = {
  doctor: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%), #34C759',
  surgeon: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%), #007AFF',
}

const ROLE_LABELS: Record<string, string> = {
  doctor: 'Врач-офтальмолог',
  surgeon: 'Хирург',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/** "Иванов Петр Сергеевич" → "Иванов П. С." */
function shortenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return fullName
  const lastName = parts[0]
  const initials = parts.slice(1).map((p) => `${p.charAt(0).toUpperCase()}.`).join(' ')
  return `${lastName} ${initials}`
}

/* ── Avatar ──────────────────────────────────────────────────────────── */

function ChatAvatar({ name, role, size = 56 }: { name: string; role: string; size?: number }) {
  const letter = name.charAt(0).toUpperCase()
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 9999,
        background: AVATAR_GRADIENTS[role] ?? AVATAR_GRADIENTS.doctor,
        fontFamily: "'SF Pro Rounded', sans-serif",
        fontSize: size * 0.44,
        fontWeight: 800,
        lineHeight: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}
    >
      {letter}
    </div>
  )
}

/* ── Conversation list item ──────────────────────────────────────────── */

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 24,
        borderRadius: 24,
        border: 'none',
        width: '100%',
        cursor: 'pointer',
        background: isActive ? '#f7f8fa' : hovered ? 'rgba(120,120,128,0.06)' : 'transparent',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
        transition: 'background 0.15s ease',
      }}
    >
      <ChatAvatar name={conversation.other_user_name} role={conversation.other_user_role} size={56} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              lineHeight: '20px',
              letterSpacing: -0.33,
              color: '#101012',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {shortenName(conversation.other_user_name)}
          </span>
          {conversation.unread_count > 0 && (
            <span
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                background: '#007aff',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
                flexShrink: 0,
              }}
            >
              {conversation.unread_count}
            </span>
          )}
        </div>
        {conversation.last_message && (
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '24px',
              color: 'rgba(60,60,67,0.72)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {conversation.last_message}
          </span>
        )}
      </div>
    </button>
  )
}

/* ── File attachment display ─────────────────────────────────────────── */

function FileAttachment({
  attachment,
  time,
  isOwn,
  readAt,
}: {
  attachment: MessageAttachment
  time: string
  isOwn: boolean
  readAt: string | null
}) {
  const [hovered, setHovered] = useState(false)

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const { data } = await api.get(`/conversations/attachments/${attachment.id}/file`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Ignore download errors
    }
  }, [attachment.id, attachment.file_name])

  return (
    <button
      onClick={handleDownload}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 360,
        minWidth: 244,
        cursor: 'pointer',
        opacity: hovered ? 0.8 : 1,
        transition: 'opacity 0.15s ease',
        border: 'none',
        background: 'none',
        padding: 0,
        fontFamily: 'var(--font-sans)',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 9999,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), #007AFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)',
        }}
      >
        <Folder size={22} color="white" />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            lineHeight: '24px',
            color: '#101012',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {attachment.file_name}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: 140,
            height: 16,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(60,60,67,0.72)', lineHeight: '12px' }}>
            {formatFileSize(attachment.file_size)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 64 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(60,60,67,0.72)',
                lineHeight: '12px',
                textAlign: 'center',
                width: 48,
              }}
            >
              {time}
            </span>
            {isOwn && readAt && <CheckCheck size={14} color="#007aff" />}
          </div>
        </div>
      </div>
    </button>
  )
}

/* ── Reply quote block ───────────────────────────────────────────────── */

function ReplyBlock({ senderName, content }: { senderName: string; content: string }) {
  return (
    <div
      style={{
        borderLeft: '2px solid #3e87ff',
        background: 'rgba(62,135,255,0.12)',
        borderRadius: 8,
        padding: '8px 8px 8px 10px',
        maxWidth: 528,
        minWidth: 220,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: '#3e87ff',
          lineHeight: '24px',
        }}
      >
        {senderName}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 400,
          color: '#101012',
          lineHeight: '24px',
          letterSpacing: -0.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 458,
        }}
      >
        {content}
      </div>
    </div>
  )
}

/* ── Inline status (time + checkmark) ─────────────────────────────────── */

function InlineStatus({ time, isOwn, readAt }: { time: string; isOwn: boolean; readAt: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 64,
        flex: '1 0 0',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'rgba(60,60,67,0.72)',
          lineHeight: '12px',
          textAlign: 'center',
          width: 48,
        }}
      >
        {time}
      </span>
      {isOwn && readAt && <CheckCheck size={14} color="#007aff" />}
    </div>
  )
}

/* ── Message bubble ──────────────────────────────────────────────────── */

function MessageBubble({
  message,
  isOwn,
  highlight,
}: {
  message: ChatMessage
  isOwn: boolean
  highlight?: boolean
}) {
  const time = formatTime(message.created_at)
  const hasReply = !!(message.reply_to_content && message.reply_to_sender_name)
  const hasText = !!message.content
  const hasAttachments = message.attachments.length > 0

  return (
    <div
      id={`msg-${message.id}`}
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 24,
        width: '100%',
        transition: 'background 0.3s ease',
        borderRadius: 20,
        background: highlight ? 'rgba(62,135,255,0.08)' : 'transparent',
      }}
    >
      {!isOwn && (
        <ChatAvatar name={message.sender_name} role={message.sender_role} size={32} />
      )}
      <div
        style={{
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          flex: '1 0 0',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 16,
            background: isOwn ? '#f7f8fa' : 'white',
            border: '1px solid rgba(120,120,128,0.16)',
            maxWidth: 560,
            minWidth: hasAttachments && !hasText ? 244 : undefined,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* Sender name + reply block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              paddingBottom: 8,
              width: '100%',
            }}
          >
            {/* Sender name in blue */}
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: '#3e87ff',
                lineHeight: '24px',
              }}
            >
              {shortenName(message.sender_name)}
            </div>

            {/* Reply quote */}
            {hasReply && (
              <ReplyBlock senderName={message.reply_to_sender_name!} content={message.reply_to_content!} />
            )}
          </div>

          {/* File attachments */}
          {hasAttachments && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {message.attachments.map((att) => (
                <FileAttachment
                  key={att.id}
                  attachment={att}
                  time={time}
                  isOwn={isOwn}
                  readAt={message.read_at}
                />
              ))}
            </div>
          )}

          {/* Text content with inline status */}
          {hasText && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: '24px',
                  letterSpacing: -0.25,
                  color: '#101012',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {message.content}
              </div>
              {/* Last line + status using flex-wrap trick */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                  gap: '2px 0',
                  width: '100%',
                }}
              >
                <InlineStatus time={time} isOwn={isOwn} readAt={message.read_at} />
              </div>
            </div>
          )}

          {/* If file-only, status is already shown in FileAttachment */}
        </div>
      </div>
    </div>
  )
}

/* ── Pending file chip ───────────────────────────────────────────────── */

function PendingFileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 10,
        background: 'rgba(0,122,255,0.08)',
        fontSize: 13,
        fontWeight: 500,
        color: '#007aff',
      }}
    >
      <Folder size={14} />
      <span
        style={{
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {file.name}
      </span>
      <button
        onClick={onRemove}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          color: '#007aff',
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

/* ── Main Page Component ─────────────────────────────────────────────── */

function MessagesPage() {
  const navigate = useNavigate()
  const { chatId } = useParams<{ chatId: string }>()
  const user = useAuthStore((s) => s.user)

  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const messages = useChatStore((s) => s.messages)
  const hasMore = useChatStore((s) => s.hasMore)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const selectConversation = useChatStore((s) => s.selectConversation)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const loadOlderMessages = useChatStore((s) => s.loadOlderMessages)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const sendMessageWithFiles = useChatStore((s) => s.sendMessageWithFiles)
  const sendCallStarted = useChatStore((s) => s.sendCallStarted)
  const sendCallEnded = useChatStore((s) => s.sendCallEnded)
  const activeCall = useChatStore((s) => s.activeCall)

  const [showChat, setShowChat] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [callRoomId, setCallRoomId] = useState<string | null>(null)
  const [callStream, setCallStream] = useState<MediaStream | null>(null)
  const [inputText, setInputText] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const basePath = user?.role === 'surgeon' ? '/surgeon/messages' : '/doctor/messages'

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Auto-select conversation from URL param
  useEffect(() => {
    if (chatId && conversations.length > 0) {
      const exists = conversations.find((c) => c.id === chatId)
      if (exists && activeConversationId !== chatId) {
        selectConversation(chatId)
        loadMessages(chatId)
        setShowChat(true)
      }
    }
  }, [chatId, conversations, activeConversationId, selectConversation, loadMessages])

  // Close VideoCall when remote party ends the call (activeCall cleared by store)
  useEffect(() => {
    if (!activeCall && showVideoCall) {
      setShowVideoCall(false)
      setCallRoomId(null)
    }
  }, [activeCall, showVideoCall])

  // Auto-scroll to bottom on new messages
  const activeMessages = activeConversationId ? messages[activeConversationId] ?? [] : []
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length])

  // Active conversation data
  const activeConv = conversations.find((c) => c.id === activeConversationId) ?? null

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      selectConversation(conv.id)
      loadMessages(conv.id)
      navigate(`${basePath}/${conv.id}`)
      setShowChat(true)
    },
    [selectConversation, loadMessages, navigate, basePath]
  )

  const handleSend = useCallback(async () => {
    if (!activeConversationId) return
    const text = inputText.trim()
    if (!text && pendingFiles.length === 0) return

    setSending(true)
    try {
      if (pendingFiles.length > 0) {
        await sendMessageWithFiles(activeConversationId, text, pendingFiles, replyTo?.id)
      } else {
        sendMessage(activeConversationId, text, replyTo?.id)
      }
      setInputText('')
      setPendingFiles([])
      setReplyTo(null)
    } finally {
      setSending(false)
    }
  }, [activeConversationId, inputText, pendingFiles, replyTo, sendMessage, sendMessageWithFiles])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setPendingFiles((prev) => [...prev, ...Array.from(files)])
    }
    // Reset input so the same file can be selected again
    e.target.value = ''
  }, [])

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleStartCall = useCallback(async () => {
    if (!activeConversationId || showVideoCall || activeCall) return
    // Acquire media in click handler context (critical for mobile browsers)
    const stream = await acquireMediaStream()
    const roomId = crypto.randomUUID()
    setCallStream(stream)
    setCallRoomId(roomId)
    sendCallStarted(activeConversationId, roomId)
    setShowVideoCall(true)
  }, [activeConversationId, showVideoCall, activeCall, sendCallStarted])

  const handleCallEnd = useCallback(() => {
    if (activeConversationId) {
      sendCallEnded(activeConversationId)
    }
  }, [activeConversationId, sendCallEnded])

  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget
      if (el.scrollTop < 100 && activeConversationId && hasMore[activeConversationId] && !loadingOlder) {
        const prevHeight = el.scrollHeight
        setLoadingOlder(true)
        await loadOlderMessages(activeConversationId)
        setLoadingOlder(false)
        // Preserve scroll position after prepending older messages
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevHeight
        })
      }
    },
    [activeConversationId, hasMore, loadingOlder, loadOlderMessages]
  )

  // ── Search logic ──────────────────────────────────────────────────────
  const query = searchQuery.toLowerCase().trim()
  const searchResultIds = query
    ? activeMessages
        .filter((m) => m.content?.toLowerCase().includes(query))
        .map((m) => m.id)
    : []

  const handleToggleSearch = useCallback(() => {
    setSearchOpen((prev) => {
      if (prev) {
        setSearchQuery('')
        setSearchIndex(0)
      }
      return !prev
    })
    setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [])

  const scrollToMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleSearchPrev = useCallback(() => {
    if (searchResultIds.length === 0) return
    setSearchIndex((prev) => {
      const next = prev <= 0 ? searchResultIds.length - 1 : prev - 1
      scrollToMessage(searchResultIds[next])
      return next
    })
  }, [searchResultIds, scrollToMessage])

  const handleSearchNext = useCallback(() => {
    if (searchResultIds.length === 0) return
    setSearchIndex((prev) => {
      const next = prev >= searchResultIds.length - 1 ? 0 : prev + 1
      scrollToMessage(searchResultIds[next])
      return next
    })
  }, [searchResultIds, scrollToMessage])

  // Scroll to first result when query changes
  useEffect(() => {
    if (searchResultIds.length > 0) {
      setSearchIndex(0)
      scrollToMessage(searchResultIds[0])
    }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close search when switching conversations
  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchIndex(0)
  }, [activeConversationId])

  return (
    <>
    <div style={{ display: 'flex', height: '100%', fontFamily: 'var(--font-sans)', background: 'white' }}>
      {/* ── Left Panel: Conversation List ── */}
      <div
        className={`flex flex-col h-full border-r border-border w-full lg:w-[500px] lg:min-w-[500px] ${showChat ? 'hidden lg:flex' : 'flex'}`}
      >
        {/* Title */}
        <div style={{ padding: '32px 24px 16px', flexShrink: 0 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: -1,
              color: '#101012',
              margin: 0,
              fontFeatureSettings: "'ss01' 1",
            }}
          >
            Сообщения
          </h1>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {conversations.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'rgba(60,60,67,0.72)',
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              Нет диалогов
            </div>
          )}
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => handleSelectConversation(conv)}
            />
          ))}
        </div>
      </div>

      {/* ── Right Panel: Chat View ── */}
      <div className={`flex-1 flex flex-col h-full min-w-0 bg-white ${!showChat ? 'hidden lg:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 24,
                borderBottom: '1px solid rgba(120,120,128,0.16)',
                boxShadow:
                  '0px 4px 2px 0px rgba(16,16,18,0.01), 0px 2px 2px 0px rgba(16,16,18,0.02), 0px 1px 1px 0px rgba(16,16,18,0.04), 0px 0px 1px 0px rgba(16,16,18,0.12)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setShowChat(false)}
                  className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-secondary cursor-pointer shrink-0"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <ChatAvatar name={activeConv.other_user_name} role={activeConv.other_user_role} size={56} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      lineHeight: '24px',
                      letterSpacing: -0.33,
                      color: '#101012',
                    }}
                  >
                    {shortenName(activeConv.other_user_name)}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 500, lineHeight: '20px', color: 'rgba(60,60,67,0.72)' }}>
                    {ROLE_LABELS[activeConv.other_user_role] ?? activeConv.other_user_role}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Search button */}
                <button
                  onClick={handleToggleSearch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    border: 'none',
                    background: searchOpen ? 'rgba(0,122,255,0.12)' : 'rgba(120,120,128,0.12)',
                    cursor: 'pointer',
                    color: searchOpen ? '#007aff' : '#101012',
                  }}
                  title="Поиск"
                >
                  <Search size={20} />
                </button>

                {/* Call button */}
                <button
                  onClick={handleStartCall}
                  disabled={showVideoCall || !!activeCall}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 16,
                    border: 'none',
                    background: 'rgba(0,122,255,0.12)',
                    cursor: showVideoCall || activeCall ? 'default' : 'pointer',
                    color: '#007aff',
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    opacity: showVideoCall || activeCall ? 0.5 : 1,
                  }}
                >
                  <img src={videoIcon} alt="" style={{
                    width: 20,
                    height: 20
                  }} />
                  <span className="hidden sm:inline">Начать звонок</span>
                </button>
              </div>
            </div>

            {/* Search bar */}
            {searchOpen && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  borderBottom: '1px solid rgba(120,120,128,0.16)',
                  flexShrink: 0,
                }}
              >
                <Search size={18} color="rgba(60,60,67,0.52)" style={{ flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.shiftKey ? handleSearchPrev() : handleSearchNext()
                    }
                    if (e.key === 'Escape') handleToggleSearch()
                  }}
                  placeholder="Поиск по сообщениям..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: '24px',
                    color: '#101012',
                    background: 'transparent',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                {query && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'rgba(60,60,67,0.52)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {searchResultIds.length > 0 ? `${searchIndex + 1}/${searchResultIds.length}` : 'Не найдено'}
                  </span>
                )}
                <button
                  onClick={handleSearchPrev}
                  disabled={searchResultIds.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: searchResultIds.length > 0 ? 'pointer' : 'default',
                    color: searchResultIds.length > 0 ? '#101012' : 'rgba(60,60,67,0.24)',
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={handleSearchNext}
                  disabled={searchResultIds.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: searchResultIds.length > 0 ? 'pointer' : 'default',
                    color: searchResultIds.length > 0 ? '#101012' : 'rgba(60,60,67,0.24)',
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  onClick={handleToggleSearch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'rgba(60,60,67,0.52)',
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Messages area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '36px 24px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 'auto' }}>
                {activeMessages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === user?.id}
                    highlight={searchResultIds.length > 0 && msg.id === searchResultIds[searchIndex]}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input bar */}
            <div
              style={{
                padding: '16px 24px 24px',
                borderTop: '1px solid rgba(120,120,128,0.16)',
                flexShrink: 0,
              }}
            >
              {/* Reply preview */}
              {replyTo && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    marginBottom: 8,
                    borderLeft: '2px solid #3e87ff',
                    background: 'rgba(62,135,255,0.08)',
                    borderRadius: '0 10px 10px 0',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#3e87ff' }}>{replyTo.sender_name}</div>
                    <div
                      style={{
                        fontSize: 14,
                        color: 'rgba(60,60,67,0.72)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {replyTo.content ?? 'Вложение'}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      color: 'rgba(60,60,67,0.72)',
                      flexShrink: 0,
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Pending files preview */}
              {pendingFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {pendingFiles.map((file, i) => (
                    <PendingFileChip key={`${file.name}-${i}`} file={file} onRemove={() => removePendingFile(i)} />
                  ))}
                </div>
              )}

              {/* Input row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                {/* File upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'rgba(60,60,67,0.72)',
                    flexShrink: 0,
                  }}
                  title="Прикрепить файл"
                >
                  <Paperclip size={22} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {/* Text area */}
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Сообщение"
                  rows={1}
                  style={{
                    flex: 1,
                    resize: 'none',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(120,120,128,0.16)',
                    outline: 'none',
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: '22px',
                    fontFamily: 'var(--font-sans)',
                    color: '#101012',
                    background: 'white',
                    maxHeight: 120,
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                  }}
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={sending || (!inputText.trim() && pendingFiles.length === 0)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: 'none',
                    background: inputText.trim() || pendingFiles.length > 0 ? '#007aff' : 'rgba(120,120,128,0.12)',
                    cursor: inputText.trim() || pendingFiles.length > 0 ? 'pointer' : 'default',
                    color: inputText.trim() || pendingFiles.length > 0 ? 'white' : 'rgba(60,60,67,0.36)',
                    flexShrink: 0,
                    opacity: sending ? 0.6 : 1,
                    transition: 'background 0.15s ease, color 0.15s ease, opacity 0.15s ease',
                  }}
                  title="Отправить"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(60,60,67,0.72)',
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            Выберите диалог для начала общения
          </div>
        )}
      </div>
    </div>

      {/* Video call modal */}
      {showVideoCall && activeConv && callRoomId && (
        <VideoCall
          roomId={callRoomId}
          calleeName={activeConv.other_user_name}
          calleeRole={activeConv.other_user_role}
          stream={callStream}
          onClose={() => { setShowVideoCall(false); setCallRoomId(null); setCallStream(null) }}
          onCallEnd={handleCallEnd}
        />
      )}
    </>
  )
}

export default MessagesPage
