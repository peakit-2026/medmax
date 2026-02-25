import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function PatientLookup() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim().length === 8) {
      navigate(`/patient/${code.trim()}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Проверка статуса подготовки
        </h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <label className="block mb-4">
            <span className="text-lg text-gray-700 block mb-2">Введите ваш код доступа</span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="12345678"
              maxLength={8}
              className="w-full border rounded p-3 text-xl text-center tracking-widest"
            />
          </label>
          <button
            type="submit"
            disabled={code.length !== 8}
            className="w-full bg-blue-600 text-white py-3 rounded text-lg disabled:opacity-40"
          >
            Проверить статус
          </button>
        </form>
      </div>
    </div>
  )
}

export default PatientLookup
