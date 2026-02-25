import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'

interface IolCalculation {
  id: string
  patient_id: string
  eye: string
  k1: number
  k2: number
  axial_length: number
  acd: number
  target_refraction: number
  formula: string
  recommended_iol: number
  created_at: string
}

function IOLCalculator() {
  const { id } = useParams()
  const [eye, setEye] = useState('right')
  const [k1, setK1] = useState('')
  const [k2, setK2] = useState('')
  const [axialLength, setAxialLength] = useState('')
  const [acd, setAcd] = useState('')
  const [targetRefraction, setTargetRefraction] = useState('0')
  const [formula, setFormula] = useState('srk_t')
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<IolCalculation[]>([])

  useEffect(() => {
    api.get<IolCalculation[]>(`/iol/patient/${id}`).then((res) => {
      setHistory(res.data)
    })
  }, [id])

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    api
      .post<IolCalculation>('/iol/calculate', {
        patient_id: id,
        eye,
        k1: parseFloat(k1),
        k2: parseFloat(k2),
        axial_length: parseFloat(axialLength),
        acd: parseFloat(acd),
        target_refraction: parseFloat(targetRefraction),
        formula,
      })
      .then((res) => {
        setResult(res.data.recommended_iol)
        setHistory((prev) => [res.data, ...prev])
      })
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <Link to={`/doctor/patient/${id}`} className="text-blue-600 mb-4 inline-block">
        &larr; К карте пациента
      </Link>

      <h1 className="text-xl font-semibold mb-4">Калькулятор ИОЛ</h1>

      <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-3 mb-6">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Глаз</span>
          <select
            value={eye}
            onChange={(e) => setEye(e.target.value)}
            className="border rounded p-2"
          >
            <option value="right">Правый (OD)</option>
            <option value="left">Левый (OS)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">K1 (дптр)</span>
          <input
            type="number"
            step="0.01"
            value={k1}
            onChange={(e) => setK1(e.target.value)}
            required
            className="border rounded p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">K2 (дптр)</span>
          <input
            type="number"
            step="0.01"
            value={k2}
            onChange={(e) => setK2(e.target.value)}
            required
            className="border rounded p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Аксиальная длина (мм)</span>
          <input
            type="number"
            step="0.01"
            value={axialLength}
            onChange={(e) => setAxialLength(e.target.value)}
            required
            className="border rounded p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Глубина передней камеры (мм)</span>
          <input
            type="number"
            step="0.01"
            value={acd}
            onChange={(e) => setAcd(e.target.value)}
            required
            className="border rounded p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Целевая рефракция (дптр)</span>
          <input
            type="number"
            step="0.25"
            value={targetRefraction}
            onChange={(e) => setTargetRefraction(e.target.value)}
            className="border rounded p-2"
          />
        </label>

        <div className="flex gap-4">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="formula"
              value="srk_t"
              checked={formula === 'srk_t'}
              onChange={() => setFormula('srk_t')}
            />
            <span>SRK/T</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="formula"
              value="haigis"
              checked={formula === 'haigis'}
              onChange={() => setFormula('haigis')}
            />
            <span>Haigis</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded p-2 disabled:opacity-50"
        >
          {loading ? 'Расчёт...' : 'Рассчитать'}
        </button>
      </form>

      {result !== null && (
        <div className="bg-green-50 border border-green-300 rounded p-4 mb-6 max-w-md">
          <span className="text-lg font-semibold">
            Рекомендуемая ИОЛ: {result.toFixed(1)} D
          </span>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">История расчётов</h2>
          <table className="w-full max-w-2xl text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left border">Дата</th>
                <th className="p-2 text-left border">Глаз</th>
                <th className="p-2 text-left border">Формула</th>
                <th className="p-2 text-left border">K1/K2</th>
                <th className="p-2 text-left border">AL</th>
                <th className="p-2 text-left border">ИОЛ</th>
              </tr>
            </thead>
            <tbody>
              {history.map((calc) => (
                <tr key={calc.id}>
                  <td className="p-2 border">
                    {new Date(calc.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="p-2 border">{calc.eye === 'right' ? 'OD' : 'OS'}</td>
                  <td className="p-2 border">{calc.formula === 'srk_t' ? 'SRK/T' : 'Haigis'}</td>
                  <td className="p-2 border">
                    {calc.k1}/{calc.k2}
                  </td>
                  <td className="p-2 border">{calc.axial_length}</td>
                  <td className="p-2 border font-semibold">{calc.recommended_iol.toFixed(1)} D</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default IOLCalculator
