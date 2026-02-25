import axios from 'axios'
import { queueRequest } from '../store/offline'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response && error.config && ['post', 'put'].includes(error.config.method)) {
      await queueRequest(
        error.config.method.toUpperCase(),
        error.config.baseURL + error.config.url,
        error.config.data ? JSON.parse(error.config.data) : undefined
      )
      return Promise.resolve({ data: { queued: true }, status: 202 })
    }
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
