import { create } from 'zustand'
import api from '../api/client'
import type { Patient, PatientWithChecklist, Comment, IolCalculation, MediaFile } from '../types/index'

const EMPTY_COMMENTS: Comment[] = []
const EMPTY_IOL: IolCalculation[] = []
const EMPTY_MEDIA: MediaFile[] = []

interface PatientState {
  patients: Record<string, PatientWithChecklist>
  patientList: Patient[]
  comments: Record<string, Comment[]>
  iolCalcs: Record<string, IolCalculation[]>
  media: Record<string, MediaFile[]>
  listFetchedAt: number

  fetchPatients: () => Promise<void>
  fetchPatient: (id: string) => Promise<void>
  fetchComments: (patientId: string) => Promise<void>
  fetchIol: (patientId: string) => Promise<void>
  fetchMedia: (patientId: string) => Promise<void>

  createPatient: (data: Record<string, unknown>) => Promise<Patient>
  toggleChecklist: (itemId: string, patientId: string, currentCompleted: boolean) => Promise<void>
  addComment: (patientId: string, content: string) => Promise<void>
  approvePatient: (id: string, operationDate: string | null, operationTime: string | null) => Promise<void>
  fetchSchedule: (weekStart: string) => Promise<Patient[]>
  rejectPatient: (id: string, comment: string) => Promise<void>
  updatePatient: (id: string, data: Record<string, unknown>) => Promise<void>
  deleteMedia: (mediaId: string, patientId: string) => Promise<void>
  addIolCalc: (patientId: string, calc: IolCalculation) => void
  addMediaFile: (patientId: string, file: MediaFile) => void
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: {},
  patientList: [],
  comments: {},
  iolCalcs: {},
  media: {},
  listFetchedAt: 0,

  fetchPatients: async () => {
    const { data } = await api.get<Patient[]>('/patients')
    const patients = { ...get().patients }
    data.forEach((p) => {
      const existing = patients[p.id]
      if (existing) {
        patients[p.id] = { ...existing, ...p }
      }
    })
    set({ patientList: data, patients, listFetchedAt: Date.now() })
  },

  fetchPatient: async (id) => {
    const { data } = await api.get<PatientWithChecklist>(`/patients/${id}`)
    set({ patients: { ...get().patients, [id]: data } })
  },

  fetchComments: async (patientId) => {
    const { data } = await api.get<Comment[]>(`/comments/patient/${patientId}`)
    set({ comments: { ...get().comments, [patientId]: data } })
  },

  fetchIol: async (patientId) => {
    const { data } = await api.get<IolCalculation[]>(`/iol/patient/${patientId}`)
    set({ iolCalcs: { ...get().iolCalcs, [patientId]: data } })
  },

  fetchMedia: async (patientId) => {
    const { data } = await api.get<MediaFile[]>(`/media/patient/${patientId}`)
    set({ media: { ...get().media, [patientId]: data } })
  },

  createPatient: async (data) => {
    const { data: created } = await api.post<Patient>('/patients', data)
    set({ patientList: [created, ...get().patientList] })
    return created
  },

  toggleChecklist: async (itemId, patientId, currentCompleted) => {
    const patient = get().patients[patientId]
    if (patient) {
      const newChecklist = patient.checklist.map((c) =>
        c.id === itemId ? { ...c, is_completed: !currentCompleted } : c
      )
      const completed = newChecklist.filter((c) => c.is_completed).length
      const newStatus = completed === 0 ? 'red' : 'yellow'
      set({
        patients: {
          ...get().patients,
          [patientId]: { ...patient, status: newStatus, checklist: newChecklist },
        },
        patientList: get().patientList.map((p) =>
          p.id === patientId ? { ...p, status: newStatus } : p
        ),
      })
    }

    try {
      if (currentCompleted) {
        await api.put(`/checklists/${itemId}/uncomplete`)
      } else {
        await api.put(`/checklists/${itemId}/complete`)
      }
    } catch {
      const patient = get().patients[patientId]
      if (patient) {
        const revertedChecklist = patient.checklist.map((c) =>
          c.id === itemId ? { ...c, is_completed: currentCompleted } : c
        )
        const completed = revertedChecklist.filter((c) => c.is_completed).length
        const revertedStatus = completed === 0 ? 'red' : 'yellow'
        set({
          patients: {
            ...get().patients,
            [patientId]: { ...patient, status: revertedStatus, checklist: revertedChecklist },
          },
          patientList: get().patientList.map((p) =>
            p.id === patientId ? { ...p, status: revertedStatus } : p
          ),
        })
      }
    }
  },

  addComment: async (patientId, content) => {
    const tempId = `temp-${Date.now()}`
    const optimistic: Comment = {
      id: tempId,
      patient_id: patientId,
      author_id: '',
      author_name: '',
      content,
      created_at: new Date().toISOString(),
    }

    const existing = get().comments[patientId] ?? []
    set({ comments: { ...get().comments, [patientId]: [...existing, optimistic] } })

    try {
      await api.post('/comments', { patient_id: patientId, content })
      get().fetchComments(patientId)
    } catch {
      const current = get().comments[patientId] ?? []
      set({ comments: { ...get().comments, [patientId]: current.filter((c) => c.id !== tempId) } })
    }
  },

  approvePatient: async (id, operationDate, operationTime) => {
    const patient = get().patients[id]
    const prevStatus = patient?.status
    const prevDate = patient?.operation_date
    const prevTime = patient?.operation_time

    if (patient) {
      set({
        patients: { ...get().patients, [id]: { ...patient, status: 'green', operation_date: operationDate, operation_time: operationTime } },
        patientList: get().patientList.map((p) =>
          p.id === id ? { ...p, status: 'green' as const, operation_date: operationDate, operation_time: operationTime } : p
        ),
      })
    }

    try {
      await api.post(`/surgeon/patients/${id}/approve`, { operation_date: operationDate, operation_time: operationTime })
    } catch {
      if (patient && prevStatus) {
        set({
          patients: { ...get().patients, [id]: { ...patient, status: prevStatus, operation_date: prevDate ?? null, operation_time: prevTime ?? null } },
          patientList: get().patientList.map((p) =>
            p.id === id ? { ...p, status: prevStatus, operation_date: prevDate ?? null, operation_time: prevTime ?? null } : p
          ),
        })
      }
    }
  },

  fetchSchedule: async (weekStart) => {
    const { data } = await api.get<Patient[]>(`/surgeon/schedule?week_start=${weekStart}`)
    return data
  },

  rejectPatient: async (id, comment) => {
    const patient = get().patients[id]
    const prevStatus = patient?.status

    if (patient) {
      set({
        patients: { ...get().patients, [id]: { ...patient, status: 'red' } },
        patientList: get().patientList.map((p) =>
          p.id === id ? { ...p, status: 'red' as const } : p
        ),
      })
    }

    try {
      await api.post(`/surgeon/patients/${id}/reject`, { comment })
      get().fetchComments(id)
    } catch {
      if (patient && prevStatus) {
        set({
          patients: { ...get().patients, [id]: { ...patient, status: prevStatus } },
          patientList: get().patientList.map((p) =>
            p.id === id ? { ...p, status: prevStatus } : p
          ),
        })
      }
    }
  },

  updatePatient: async (id, data) => {
    const { data: updated } = await api.put<Patient>(`/patients/${id}`, data)
    const existing = get().patients[id]
    if (existing) {
      set({ patients: { ...get().patients, [id]: { ...existing, ...updated } } })
    }
    set({
      patientList: get().patientList.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    })
  },

  deleteMedia: async (mediaId, patientId) => {
    const existing = get().media[patientId] ?? []
    const removed = existing.find((f) => f.id === mediaId)
    set({ media: { ...get().media, [patientId]: existing.filter((f) => f.id !== mediaId) } })

    try {
      await api.delete(`/media/${mediaId}`)
    } catch {
      if (removed) {
        const current = get().media[patientId] ?? []
        set({ media: { ...get().media, [patientId]: [...current, removed] } })
      }
    }
  },

  addIolCalc: (patientId, calc) => {
    const existing = get().iolCalcs[patientId] ?? []
    set({ iolCalcs: { ...get().iolCalcs, [patientId]: [calc, ...existing] } })
  },

  addMediaFile: (patientId, file) => {
    const existing = get().media[patientId] ?? []
    set({ media: { ...get().media, [patientId]: [...existing, file] } })
  },
}))

export const selectComments = (patientId: string) => (s: PatientState) =>
  s.comments[patientId] ?? EMPTY_COMMENTS

export const selectIolCalcs = (patientId: string) => (s: PatientState) =>
  s.iolCalcs[patientId] ?? EMPTY_IOL

export const selectMedia = (patientId: string) => (s: PatientState) =>
  s.media[patientId] ?? EMPTY_MEDIA
