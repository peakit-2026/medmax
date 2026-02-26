import { create } from 'zustand'
import api from '../api/client'

// ── Types ──────────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string
  other_user_role: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

export interface MessageAttachment {
  id: string
  message_id: string
  file_name: string
  file_size: number
  mime_type: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_role: string
  content: string | null
  reply_to_id: string | null
  reply_to_content: string | null
  reply_to_sender_name: string | null
  attachments: MessageAttachment[]
  created_at: string
  read_at: string | null
}

interface IncomingCallData {
  conversation_id: string
  room_id: string
  caller_id: string
  caller_name: string
}

// ── Store interface ────────────────────────────────────────────────────

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, ChatMessage[]>
  hasMore: Record<string, boolean>
  ws: WebSocket | null
  typingUsers: Record<string, string | null>
  incomingCall: IncomingCallData | null

  connect: () => void
  disconnect: () => void
  loadConversations: () => Promise<void>
  selectConversation: (id: string) => void
  loadMessages: (conversationId: string) => Promise<void>
  loadOlderMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string, replyToId?: string) => void
  sendMessageWithFiles: (conversationId: string, content: string, files: File[], replyToId?: string) => Promise<void>
  markAsRead: (conversationId: string) => void
  sendCallStarted: (conversationId: string, roomId: string) => void
  sendCallEnded: (conversationId: string) => void
  dismissIncomingCall: () => void
}

// ── Typing timeout tracker ─────────────────────────────────────────────

const typingTimers: Record<string, ReturnType<typeof setTimeout>> = {}

// ── Helper: map API attachment to include message_id ───────────────────

interface ApiAttachment {
  id: string
  file_name: string
  file_size: number
  mime_type: string
}

function mapAttachments(messageId: string, attachments: ApiAttachment[]): MessageAttachment[] {
  return attachments.map((a) => ({
    id: a.id,
    message_id: messageId,
    file_name: a.file_name,
    file_size: a.file_size,
    mime_type: a.mime_type,
  }))
}

// ── Helper: map API message response to ChatMessage ────────────────────

interface ApiMessageResponse {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_role: string
  content: string | null
  reply_to_id: string | null
  reply_to_content: string | null
  reply_to_sender_name: string | null
  attachments: ApiAttachment[]
  created_at: string
  read_at: string | null
}

function mapMessage(msg: ApiMessageResponse): ChatMessage {
  return {
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    sender_name: msg.sender_name,
    sender_role: msg.sender_role,
    content: msg.content,
    reply_to_id: msg.reply_to_id,
    reply_to_content: msg.reply_to_content,
    reply_to_sender_name: msg.reply_to_sender_name,
    attachments: mapAttachments(msg.id, msg.attachments),
    created_at: msg.created_at,
    read_at: msg.read_at,
  }
}

// ── Store ──────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  hasMore: {},
  ws: null,
  typingUsers: {},
  incomingCall: null,

  connect: () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const existing = get().ws
    if (existing && existing.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws?token=${token}`)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'new_message': {
            const msg = mapMessage(data.message as ApiMessageResponse)
            const convId = msg.conversation_id

            set((state) => {
              // Add message, deduplicate by id
              const existing = state.messages[convId] ?? []
              const ids = new Set(existing.map((m) => m.id))
              const updated = ids.has(msg.id) ? existing : [...existing, msg]

              // Update conversation list
              const conversations = state.conversations.map((c) => {
                if (c.id !== convId) return c
                return {
                  ...c,
                  last_message: msg.content,
                  last_message_at: msg.created_at,
                  unread_count:
                    state.activeConversationId === convId
                      ? c.unread_count
                      : c.unread_count + 1,
                }
              })

              return {
                messages: { ...state.messages, [convId]: updated },
                conversations,
              }
            })

            // Auto mark-as-read if this conversation is active
            if (get().activeConversationId === convId) {
              get().markAsRead(convId)
            }
            break
          }

          case 'typing': {
            const convId = data.conversation_id as string
            const userId = data.user_id as string

            // Clear previous timer for this conversation
            if (typingTimers[convId]) {
              clearTimeout(typingTimers[convId])
            }

            set((state) => ({
              typingUsers: { ...state.typingUsers, [convId]: userId },
            }))

            // Auto-clear after 3 seconds
            typingTimers[convId] = setTimeout(() => {
              set((state) => ({
                typingUsers: { ...state.typingUsers, [convId]: null },
              }))
              delete typingTimers[convId]
            }, 3000)
            break
          }

          case 'messages_read': {
            const convId = data.conversation_id as string

            set((state) => {
              const msgs = state.messages[convId]
              if (!msgs) return state

              const updated = msgs.map((m) => ({
                ...m,
                read_at: m.read_at ?? new Date().toISOString(),
              }))

              return {
                messages: { ...state.messages, [convId]: updated },
              }
            })
            break
          }

          case 'call_started': {
            set({
              incomingCall: {
                conversation_id: data.conversation_id,
                room_id: data.room_id,
                caller_id: data.caller_id,
                caller_name: data.caller_name,
              },
            })
            break
          }

          case 'call_ended': {
            set({ incomingCall: null })
            break
          }
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      set({ ws: null })
      // Reconnect after 3 seconds if token still exists
      const token = localStorage.getItem('token')
      if (token) {
        setTimeout(() => {
          get().connect()
        }, 3000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }

    set({ ws })
  },

  disconnect: () => {
    const { ws } = get()
    if (ws) {
      ws.close()
    }
    set({ ws: null })
  },

  loadConversations: async () => {
    const { data } = await api.get<Conversation[]>('/conversations')
    set({ conversations: data })
  },

  selectConversation: (id) => {
    set((state) => ({
      activeConversationId: id,
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unread_count: 0 } : c
      ),
    }))
    get().markAsRead(id)
  },

  loadMessages: async (conversationId) => {
    const { data } = await api.get<ApiMessageResponse[]>(
      `/conversations/${conversationId}/messages?limit=50`
    )

    // API returns DESC order, reverse for chronological
    const messages = data.reverse().map(mapMessage)
    const hasMore = data.length >= 50

    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
      hasMore: { ...state.hasMore, [conversationId]: hasMore },
    }))
  },

  loadOlderMessages: async (conversationId) => {
    const existing = get().messages[conversationId] ?? []
    if (existing.length === 0) return

    // Get oldest message timestamp
    const oldest = existing[0]
    const { data } = await api.get<ApiMessageResponse[]>(
      `/conversations/${conversationId}/messages?limit=50&before=${oldest.created_at}`
    )

    // API returns DESC order, reverse for chronological
    const olderMessages = data.reverse().map(mapMessage)
    const hasMore = data.length >= 50

    set((state) => {
      const current = state.messages[conversationId] ?? []
      return {
        messages: { ...state.messages, [conversationId]: [...olderMessages, ...current] },
        hasMore: { ...state.hasMore, [conversationId]: hasMore },
      }
    })
  },

  sendMessage: (conversationId, content, replyToId) => {
    const { ws } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(
      JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        content,
        reply_to_id: replyToId ?? null,
      })
    )
  },

  sendMessageWithFiles: async (conversationId, content, files, replyToId) => {
    const formData = new FormData()
    if (content) {
      formData.append('content', content)
    }
    if (replyToId) {
      formData.append('reply_to_id', replyToId)
    }
    for (const file of files) {
      formData.append('files', file)
    }

    await api.post(`/conversations/${conversationId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // The server broadcasts the new message via WebSocket, so the store
    // will be updated through the onmessage handler.
  },

  markAsRead: (conversationId) => {
    const { ws } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(
      JSON.stringify({
        type: 'mark_read',
        conversation_id: conversationId,
      })
    )
  },

  sendCallStarted: (conversationId, roomId) => {
    const { ws } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(
      JSON.stringify({
        type: 'call_started',
        conversation_id: conversationId,
        room_id: roomId,
      })
    )
  },

  sendCallEnded: (conversationId) => {
    const { ws } = get()
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(
      JSON.stringify({
        type: 'call_ended',
        conversation_id: conversationId,
      })
    )
  },

  dismissIncomingCall: () => {
    set({ incomingCall: null })
  },
}))
