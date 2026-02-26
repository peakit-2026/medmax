import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Search,
  Paperclip,
  Mic,
  CheckCheck,
  Folder,
  X,
  Send,
  Reply,
} from 'lucide-react'
import videoIcon from '../../assets/icons/camera.svg'
import { useChatStore, type Conversation, type ChatMessage, type MessageAttachment } from '../../store/chat'
import { useAuthStore } from '../../store/auth'
import VideoCall from '../../components/VideoCall'

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
              lineHeight: '24px',
              letterSpacing: -0.33,
              color: '#101012',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {conversation.other_user_name}
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
              lineHeight: '20px',
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

function FileAttachment({ attachment }: { attachment: MessageAttachment }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={`/api/conversations/attachments/${attachment.id}/file`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 12,
        background: hovered ? 'rgba(0,122,255,0.08)' : 'rgba(0,122,255,0.04)',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%), #007AFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Folder size={18} color="white" />
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            lineHeight: '20px',
            color: '#101012',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {attachment.file_name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(60,60,67,0.72)' }}>
          {formatFileSize(attachment.file_size)}
        </span>
      </div>
    </a>
  )
}

/* ── Reply quote block ───────────────────────────────────────────────── */

function ReplyBlock({ senderName, content }: { senderName: string; content: string }) {
  return (
    <div
      style={{
        borderLeft: '2px solid #3e87ff',
        background: 'rgba(62,135,255,0.12)',
        borderRadius: '0 8px 8px 0',
        padding: '6px 10px',
        marginBottom: 6,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: '#3e87ff', lineHeight: '16px' }}>{senderName}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 400,
          color: '#101012',
          lineHeight: '18px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {content}
      </div>
    </div>
  )
}

/* ── Message bubble ──────────────────────────────────────────────────── */

function MessageBubble({
  message,
  isOwn,
  onReply,
}: {
  message: ChatMessage
  isOwn: boolean
  onReply: (msg: ChatMessage) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 8,
        width: '100%',
      }}
    >
      {!isOwn && (
        <ChatAvatar name={message.sender_name} role={message.sender_role} size={32} />
      )}
      <div
        style={{
          maxWidth: '65%',
          position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 16,
            background: isOwn ? '#f7f8fa' : 'white',
            border: '1px solid rgba(120,120,128,0.16)',
          }}
        >
          {/* Reply quote */}
          {message.reply_to_content && message.reply_to_sender_name && (
            <ReplyBlock senderName={message.reply_to_sender_name} content={message.reply_to_content} />
          )}

          {/* Text content */}
          {message.content && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 400,
                lineHeight: '22px',
                color: '#101012',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {message.content}
            </div>
          )}

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: message.content ? 8 : 0 }}>
              {message.attachments.map((att) => (
                <FileAttachment key={att.id} attachment={att} />
              ))}
            </div>
          )}

          {/* Timestamp + read indicator */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(60,60,67,0.72)' }}>
              {formatTime(message.created_at)}
            </span>
            {isOwn && message.read_at && <CheckCheck size={14} color="#007aff" />}
          </div>
        </div>

        {/* Reply button on hover */}
        {hovered && (
          <button
            onClick={() => onReply(message)}
            style={{
              position: 'absolute',
              top: 8,
              [isOwn ? 'left' : 'right']: -36,
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(120,120,128,0.12)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(60,60,67,0.72)',
            }}
            title="Ответить"
          >
            <Reply size={14} />
          </button>
        )}
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

  const [showVideoCall, setShowVideoCall] = useState(false)
  const [callRoomId, setCallRoomId] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      }
    }
  }, [chatId, conversations, activeConversationId, selectConversation, loadMessages])

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

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyTo(msg)
    textareaRef.current?.focus()
  }, [])

  const handleStartCall = useCallback(() => {
    if (!activeConversationId) return
    const roomId = crypto.randomUUID()
    setCallRoomId(roomId)
    sendCallStarted(activeConversationId, roomId)
    setShowVideoCall(true)
  }, [activeConversationId, sendCallStarted])

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

  return (
    <>
    <div style={{ display: 'flex', height: '100%', fontFamily: 'var(--font-sans)' }}>
      {/* ── Left Panel: Conversation List ── */}
      <div
        style={{
          width: 500,
          minWidth: 500,
          borderRight: '1px solid rgba(120,120,128,0.16)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
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
                    {activeConv.other_user_name}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 500, lineHeight: '20px', color: 'rgba(60,60,67,0.72)' }}>
                    {ROLE_LABELS[activeConv.other_user_role] ?? activeConv.other_user_role}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Search button */}
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    border: 'none',
                    background: 'rgba(120,120,128,0.12)',
                    cursor: 'pointer',
                    color: '#101012',
                  }}
                  title="Поиск"
                >
                  <Search size={20} />
                </button>

                {/* Call button */}
                <button
                  onClick={handleStartCall}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 16,
                    border: 'none',
                    background: 'rgba(0,122,255,0.12)',
                    cursor: 'pointer',
                    color: '#007aff',
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <img src={videoIcon} alt="" style={{
                    width: 20,
                    height: 20
                  }} />
                  <span>Начать звонок</span>
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 36px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                justifyContent: 'flex-end',
                minHeight: 0,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                {activeMessages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === user?.id}
                    onReply={handleReply}
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
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                  }}
                />

                {/* Send / Mic button */}
                {inputText.trim() || pendingFiles.length > 0 ? (
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      border: 'none',
                      background: '#007aff',
                      cursor: sending ? 'default' : 'pointer',
                      color: 'white',
                      flexShrink: 0,
                      opacity: sending ? 0.6 : 1,
                      transition: 'opacity 0.15s ease',
                    }}
                    title="Отправить"
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button
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
                    title="Голосовое сообщение"
                  >
                    <Mic size={22} />
                  </button>
                )}
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
          onClose={() => { setShowVideoCall(false); setCallRoomId(null) }}
          onCallEnd={handleCallEnd}
        />
      )}
    </>
  )
}

export default MessagesPage
