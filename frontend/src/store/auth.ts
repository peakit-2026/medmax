import { create } from 'zustand'
import api from '../api/client'

export interface User {
  id: string
  email: string
  role: 'doctor' | 'surgeon' | 'patient'
  full_name: string
  phone: string | null
  district: string | null
  organization: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<User>
  register: (data: { email: string; password: string; full_name: string; role: string; phone?: string; district?: string; organization?: string }) => Promise<void>
  fetchMe: () => Promise<void>
  logout: () => void
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    set({ token: data.token })
    await get().fetchMe()
    return get().user!
  },

  register: async (registerData) => {
    await api.post('/auth/register', registerData)
  },

  fetchMe: async () => {
    const { data } = await api.get('/auth/me')
    set({ user: data })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
    window.location.href = '/login'
  },

  init: async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await get().fetchMe()
      } catch {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      }
    }
  },
}))
