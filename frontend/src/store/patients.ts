import { create } from 'zustand'
import api from '../api/client'
import type { Patient, PatientWithChecklist, Comment, IolCalculation, MediaFile } from '../types/index'

interface PatientState {
  patients: Map<string, PatientWithChecklist>
  patientList: Patient[]
  comments: Map<string, Comment[]>
  iolCalcs: Map<string, IolCalculation[]>
  media: Map<string, MediaFile[]>
  listFetchedAt: number

  fetchPatients: () => Promise<void>
  fetchPatient: (id: string) => Promise<void>
  fetchComments: (patientId: string) => Promise<void>
  fetchIol: (patientId: string) => Promise<void>
  fetchMedia: (patientId: string) => Promise<void>

  createPatient: (data: Record<string, unknown>) => Promise<Patient>
  toggleChecklist: (itemId: string, patientId: string, currentCompleted: boolean) => Promise<void>
  addComment: (patientId: string, content: string) => Promise<void>
  approvePatient: (id: string, operationDate: string | null) => Promise<void>
  rejectPatient: (id: string, comment: string) => Promise<void>
  deleteMedia: (mediaId: string, patientId: string) => Promise<void>
  addIolCalc: (patientId: string, calc: IolCalculation) => void
  addMediaFile: (patientId: string, file: MediaFile) => void
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: new Map(),
  patientList: [],
  comments: new Map(),
  iolCalcs: new Map(),
  media: new Map(),
  listFetchedAt: 0,

  fetchPatients: async () => {
    const { data } = await api.get<Patient[]>('/patients')
    const patients = new Map(get().patients)
    data.forEach((p) => {
      const existing = patients.get(p.id)
      if (existing) {
        patients.set(p.id, { ...existing, ...p })
      }
    })
    set({ patientList: data, patients, listFetchedAt: Date.now() })
  },

  fetchPatient: async (id) => {
    const { data } = await api.get<PatientWithChecklist>(`/patients/${id}`)
    const patients = new Map(get().patients)
    patients.set(id, data)
    set({ patients })
  },

  fetchComments: async (patientId) => {
    const { data } = await api.get<Comment[]>(`/comments/patient/${patientId}`)
    const comments = new Map(get().comments)
    comments.set(patientId, data)
    set({ comments })
  },

  fetchIol: async (patientId) => {
    const { data } = await api.get<IolCalculation[]>(`/iol/patient/${patientId}`)
    const iolCalcs = new Map(get().iolCalcs)
    iolCalcs.set(patientId, data)
    set({ iolCalcs })
  },

  fetchMedia: async (patientId) => {
    const { data } = await api.get<MediaFile[]>(`/media/patient/${patientId}`)
    const media = new Map(get().media)
    media.set(patientId, data)
    set({ media })
  },

  createPatient: async (data) => {
    const { data: created } = await api.post<Patient>('/patients', data)
    set({ patientList: [created, ...get().patientList] })
    return created
  },

  toggleChecklist: async (itemId, patientId, currentCompleted) => {
    const patients = new Map(get().patients)
    const patient = patients.get(patientId)
    if (patient) {
      const updated = {
        ...patient,
        checklist: patient.checklist.map((c) =>
          c.id === itemId ? { ...c, is_completed: !currentCompleted } : c
        ),
      }
      patients.set(patientId, updated)
      set({ patients })
    }

    try {
      if (currentCompleted) {
        await api.put(`/checklists/${itemId}/uncomplete`)
      } else {
        await api.put(`/checklists/${itemId}/complete`)
      }
    } catch {
      const patients = new Map(get().patients)
      const patient = patients.get(patientId)
      if (patient) {
        const reverted = {
          ...patient,
          checklist: patient.checklist.map((c) =>
            c.id === itemId ? { ...c, is_completed: currentCompleted } : c
          ),
        }
        patients.set(patientId, reverted)
        set({ patients })
      }
    }
  },

  addComment: async (patientId, content) => {
    const tempId = `temp-${Date.now()}`
    const optimistic: Comment = {
      id: tempId,
      patient_id: patientId,
      author_id: '',
      content,
      created_at: new Date().toISOString(),
    }

    const comments = new Map(get().comments)
    const existing = comments.get(patientId) || []
    comments.set(patientId, [...existing, optimistic])
    set({ comments })

    try {
      await api.post('/comments', { patient_id: patientId, content })
      get().fetchComments(patientId)
    } catch {
      const comments = new Map(get().comments)
      const current = comments.get(patientId) || []
      comments.set(patientId, current.filter((c) => c.id !== tempId))
      set({ comments })
    }
  },

  approvePatient: async (id, operationDate) => {
    const patients = new Map(get().patients)
    const patient = patients.get(id)
    const prevStatus = patient?.status
    const prevDate = patient?.operation_date

    if (patient) {
      patients.set(id, { ...patient, status: 'green', operation_date: operationDate })
      set({ patients })
      set({
        patientList: get().patientList.map((p) =>
          p.id === id ? { ...p, status: 'green' as const, operation_date: operationDate } : p
        ),
      })
    }

    try {
      await api.post(`/surgeon/patients/${id}/approve`, { operation_date: operationDate })
    } catch {
      if (patient && prevStatus) {
        const patients = new Map(get().patients)
        patients.set(id, { ...patient, status: prevStatus, operation_date: prevDate ?? null })
        set({ patients })
        set({
          patientList: get().patientList.map((p) =>
            p.id === id ? { ...p, status: prevStatus, operation_date: prevDate ?? null } : p
          ),
        })
      }
    }
  },

  rejectPatient: async (id, comment) => {
    const patients = new Map(get().patients)
    const patient = patients.get(id)
    const prevStatus = patient?.status

    if (patient) {
      patients.set(id, { ...patient, status: 'red' })
      set({ patients })
      set({
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
        const patients = new Map(get().patients)
        patients.set(id, { ...patient, status: prevStatus })
        set({ patients })
        set({
          patientList: get().patientList.map((p) =>
            p.id === id ? { ...p, status: prevStatus } : p
          ),
        })
      }
    }
  },

  deleteMedia: async (mediaId, patientId) => {
    const media = new Map(get().media)
    const existing = media.get(patientId) || []
    const removed = existing.find((f) => f.id === mediaId)
    media.set(patientId, existing.filter((f) => f.id !== mediaId))
    set({ media })

    try {
      await api.delete(`/media/${mediaId}`)
    } catch {
      if (removed) {
        const media = new Map(get().media)
        const current = media.get(patientId) || []
        media.set(patientId, [...current, removed])
        set({ media })
      }
    }
  },

  addIolCalc: (patientId, calc) => {
    const iolCalcs = new Map(get().iolCalcs)
    const existing = iolCalcs.get(patientId) || []
    iolCalcs.set(patientId, [calc, ...existing])
    set({ iolCalcs })
  },

  addMediaFile: (patientId, file) => {
    const media = new Map(get().media)
    const existing = media.get(patientId) || []
    media.set(patientId, [...existing, file])
    set({ media })
  },
}))
