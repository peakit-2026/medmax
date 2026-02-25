import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { compressImage } from '../hooks/useImageCompression'
import { usePatientStore, selectMedia } from '../store/patients'
import ImageViewer from './ImageViewer'

interface Props {
  patientId: string
}

function MediaGallery({ patientId }: Props) {
  const files = usePatientStore(selectMedia(patientId))
  const fetchMedia = usePatientStore((s) => s.fetchMedia)
  const deleteMedia = usePatientStore((s) => s.deleteMedia)
  const addMediaFile = usePatientStore((s) => s.addMediaFile)
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMedia(patientId)
  }, [patientId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
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
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = (id: string) => {
    deleteMedia(id, patientId)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Медиафайлы</h2>
        <label className="text-sm text-blue-600 cursor-pointer">
          {uploading ? 'Загрузка...' : 'Загрузить'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {files.length === 0 ? (
        <p className="text-gray-500 text-sm">Нет загруженных файлов</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {files.map((f) => (
            <div key={f.id} className="relative group">
              <img
                src={`/api/media/${f.id}/thumb`}
                className="w-full aspect-square object-cover rounded cursor-pointer border"
                onClick={() => setViewerSrc(`/api/media/${f.id}/file`)}
              />
              <button
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hidden group-hover:flex items-center justify-center"
                onClick={() => handleDelete(f.id)}
              >
                &times;
              </button>
              <p className="text-xs truncate mt-1">{f.file_name}</p>
            </div>
          ))}
        </div>
      )}

      {viewerSrc && (
        <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      )}
    </div>
  )
}

export default MediaGallery
