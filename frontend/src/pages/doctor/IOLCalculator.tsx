import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'
import { usePatientStore, selectIolCalcs } from '../../store/patients'
import type { IolCalculation } from '../../types/index'

function IOLCalculator() {
  const { id } = useParams()
  const history = usePatientStore(selectIolCalcs(id!))
  const fetchIol = usePatientStore((s) => s.fetchIol)
  const addIolCalc = usePatientStore((s) => s.addIolCalc)
  const [eye, setEye] = useState('right')
  const [k1, setK1] = useState('')
  const [k2, setK2] = useState('')
  const [axialLength, setAxialLength] = useState('')
  const [acd, setAcd] = useState('')
  const [targetRefraction, setTargetRefraction] = useState('0')
  const [formula, setFormula] = useState('srk_t')
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchIol(id!)
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
        addIolCalc(id!, res.data)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <Link to={`/doctor/patient/${id}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
        &larr; К карте пациента
      </Link>

      <h1 className="text-2xl font-bold mb-6">Калькулятор ИОЛ</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Глаз</span>
            <select
              value={eye}
              onChange={(e) => setEye(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full"
            >
              <option value="right">Правый (OD)</option>
              <option value="left">Левый (OS)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">K1 (дптр)</span>
            <input
              type="number"
              step="0.01"
              value={k1}
              onChange={(e) => setK1(e.target.value)}
              required
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">K2 (дптр)</span>
            <input
              type="number"
              step="0.01"
              value={k2}
              onChange={(e) => setK2(e.target.value)}
              required
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Аксиальная длина (мм)</span>
            <input
              type="number"
              step="0.01"
              value={axialLength}
              onChange={(e) => setAxialLength(e.target.value)}
              required
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Глубина передней камеры (мм)</span>
            <input
              type="number"
              step="0.01"
              value={acd}
              onChange={(e) => setAcd(e.target.value)}
              required
              className="border border-gray-300 px-3 py-2 rounded w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-700">Целевая рефракция (дптр)</span>
            <input
              type="number"
              step="0.25"
              value={targetRefraction}
              onChange={(e) => setTargetRefraction(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded w-full"
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
              <span className="text-sm">SRK/T</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="formula"
                value="haigis"
                checked={formula === 'haigis'}
                onChange={() => setFormula('haigis')}
              />
              <span className="text-sm">Haigis</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Расчёт...' : 'Рассчитать'}
          </button>
        </form>
      </div>

      {result !== null && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6 max-w-md">
          <span className="text-lg font-semibold text-green-800">
            Рекомендуемая ИОЛ: {result.toFixed(1)} D
          </span>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">История расчётов</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Глаз</th>
                <th className="px-4 py-3">Формула</th>
                <th className="px-4 py-3">K1/K2</th>
                <th className="px-4 py-3">AL</th>
                <th className="px-4 py-3">ИОЛ</th>
              </tr>
            </thead>
            <tbody>
              {history.map((calc) => (
                <tr key={calc.id} className="border-b">
                  <td className="px-4 py-3">
                    {new Date(calc.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">{calc.eye === 'right' ? 'OD' : 'OS'}</td>
                  <td className="px-4 py-3">{calc.formula === 'srk_t' ? 'SRK/T' : 'Haigis'}</td>
                  <td className="px-4 py-3">
                    {calc.k1}/{calc.k2}
                  </td>
                  <td className="px-4 py-3">{calc.axial_length}</td>
                  <td className="px-4 py-3 font-semibold">{calc.recommended_iol.toFixed(1)} D</td>
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
