import { useState } from 'react'
import api from '../../api/client'
import type { IolCalculation } from '../../types/index'
import {
  inputBase,
  selectStyle,
  iconWrapStyle,
  IconChevronDown,
} from '../../components/form-fields'

const iolModels = [
  'Alcon SN60WF',
  'Alcon SA60AT',
  'Zeiss CT ASPHINA 509M',
  'Zeiss CT LUCIA 611P',
  'Hoya iSert 251',
  'J&J TECNIS ZCB00',
]

const iolFormulaOptions = [
  { value: 'srk_t', label: 'SRK/T' },
  { value: 'holladay_1', label: 'Holladay 1' },
  { value: 'hoffer_q', label: 'Hoffer Q' },
]

function IOLCalculatorPage() {
  const [eye, setEye] = useState('right')
  const [k1, setK1] = useState('')
  const [k2, setK2] = useState('')
  const [al, setAL] = useState('')
  const [acd, setAcd] = useState('')
  const [targetRefraction, setTargetRefraction] = useState('0')
  const [iolModel, setIolModel] = useState('Alcon SN60WF')
  const [formula, setFormula] = useState('srk_t')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ power: number; expected: number; formula: string }[] | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number>(1)
  const [history, setHistory] = useState<IolCalculation[]>([])

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const res = await api.post<IolCalculation>('/iol/calculate', {
        eye,
        k1: parseFloat(k1),
        k2: parseFloat(k2),
        axial_length: parseFloat(al),
        acd: parseFloat(acd),
        target_refraction: parseFloat(targetRefraction),
        formula,
      })

      const rec = res.data.recommended_iol
      const target = parseFloat(targetRefraction) || 0
      const rounded = Math.round(rec * 2) / 2
      const formulaLabel = iolFormulaOptions.find((f) => f.value === formula)?.label || ''
      const residual = (rec - rounded) * 0.76
      const midExpected = Math.round((target + residual) * 100) / 100
      const step = 0.38

      setResults([
        { power: rounded - 0.5, expected: Math.round((midExpected - step) * 100) / 100, formula: formulaLabel },
        { power: rounded, expected: midExpected, formula: formulaLabel },
        { power: rounded + 0.5, expected: Math.round((midExpected + step) * 100) / 100, formula: formulaLabel },
      ])
      setSelectedIdx(1)
      setHistory((prev) => [res.data, ...prev])
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setEye('right')
    setK1('')
    setK2('')
    setAL('')
    setAcd('')
    setTargetRefraction('0')
    setIolModel('Alcon SN60WF')
    setFormula('srk_t')
    setResults(null)
    setSelectedIdx(1)
  }

  const canCalculate = k1 && k2 && al && acd

  return (
    <div className="flex-1 overflow-y-auto responsive-page" style={{ padding: '36px 24px' }}>
      {/* Header */}
      <h1
        className="text-[32px] font-medium leading-[32px] tracking-[-1px] text-text"
        style={{ fontFeatureSettings: "'ss01' 1", marginBottom: 36 }}
      >
        Калькулятор ИОЛ
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8" style={{ maxWidth: 1200 }}>
        {/* Left column: Form */}
        <div className="flex flex-col w-full lg:w-[480px] lg:shrink-0" style={{ gap: 24 }}>
          {/* Eye selector */}
          <div className="flex" style={{ gap: 8 }}>
            <button
              onClick={() => setEye('right')}
              className="flex-1 flex items-center justify-center overflow-clip rounded-[12px]"
              style={{
                padding: '16px',
                background: eye === 'right' ? 'rgba(0, 122, 255, 0.12)' : 'rgba(120,120,128,0.08)',
                border: eye === 'right' ? '1.5px solid rgba(0,122,255,0.4)' : '1.5px solid transparent',
              }}
            >
              <span
                className="text-[16px] font-medium leading-[24px]"
                style={{ color: eye === 'right' ? '#007AFF' : '#101012' }}
              >
                Правый (OD)
              </span>
            </button>
            <button
              onClick={() => setEye('left')}
              className="flex-1 flex items-center justify-center overflow-clip rounded-[12px]"
              style={{
                padding: '16px',
                background: eye === 'left' ? 'rgba(0, 122, 255, 0.12)' : 'rgba(120,120,128,0.08)',
                border: eye === 'left' ? '1.5px solid rgba(0,122,255,0.4)' : '1.5px solid transparent',
              }}
            >
              <span
                className="text-[16px] font-medium leading-[24px]"
                style={{ color: eye === 'left' ? '#007AFF' : '#101012' }}
              >
                Левый (OS)
              </span>
            </button>
          </div>

          {/* Input fields */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            {/* Row 1: K1 + K2 */}
            <div className="flex" style={{ gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="number"
                  step="0.1"
                  placeholder="K1 (дптр)"
                  value={k1}
                  onChange={(e) => setK1(e.target.value)}
                  style={inputBase}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="number"
                  step="0.1"
                  placeholder="K2 (дптр)"
                  value={k2}
                  onChange={(e) => setK2(e.target.value)}
                  style={inputBase}
                />
              </div>
            </div>
            {/* Row 2: AL + ACD */}
            <div className="flex" style={{ gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="AL (мм)"
                  value={al}
                  onChange={(e) => setAL(e.target.value)}
                  style={inputBase}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ACD (мм)"
                  value={acd}
                  onChange={(e) => setAcd(e.target.value)}
                  style={inputBase}
                />
              </div>
            </div>
            {/* Row 3: Target refraction + IOL Model */}
            <div className="flex" style={{ gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="number"
                  step="0.25"
                  placeholder="Целевая рефракция"
                  value={targetRefraction}
                  onChange={(e) => setTargetRefraction(e.target.value)}
                  style={inputBase}
                />
              </div>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <select
                  value={iolModel}
                  onChange={(e) => setIolModel(e.target.value)}
                  style={selectStyle}
                >
                  {iolModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div style={iconWrapStyle}>
                  <IconChevronDown />
                </div>
              </div>
            </div>
          </div>

          {/* Formula radio buttons */}
          <div className="flex items-center" style={{ gap: 24 }}>
            {iolFormulaOptions.map((opt) => (
              <button
                key={opt.value}
                className="flex items-center"
                style={{ gap: 12 }}
                onClick={() => setFormula(opt.value)}
              >
                {formula === opt.value ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 9999,
                      background: '#007AFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 9999,
                        background: 'white',
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 9999,
                      background: 'rgba(120,120,128,0.16)',
                    }}
                  />
                )}
                <span className="text-[20px] font-medium leading-[20px] tracking-[-0.33px] text-text">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex" style={{ gap: 8 }}>
            <button
              onClick={handleReset}
              className="flex items-center justify-center overflow-clip rounded-[16px] bg-fill-tertiary"
              style={{ padding: '16px', width: 160 }}
            >
              <span className="text-[16px] font-medium leading-[24px] text-text" style={{ padding: '0 8px' }}>
                Сбросить
              </span>
            </button>
            <button
              onClick={handleCalculate}
              disabled={loading || !canCalculate}
              className="flex-1 flex items-center justify-center overflow-clip rounded-[16px] disabled:opacity-50 text-white relative"
              style={{
                padding: '16px',
                backgroundImage:
                  'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgb(0,122,255) 0%, rgb(0,122,255) 100%)',
              }}
            >
              <span className="text-[16px] font-medium leading-[24px] text-white" style={{ padding: '0 8px' }}>
                {loading ? 'Расчёт...' : 'Рассчитать ИОЛ'}
              </span>
              <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{ boxShadow: 'inset 0px -1px 1px 0px rgba(16,16,18,0.12)' }}
              />
            </button>
          </div>
        </div>

        {/* Right column: Results */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 24 }}>
          {results && (
            <>
              <h3
                className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
                style={{ fontFeatureSettings: "'ss01' 1" }}
              >
                Результаты
              </h3>
              <div
                className="border border-border rounded-[16px] overflow-clip w-full"
              >
                {/* Table header */}
                <div className="flex w-full" style={{ height: 48 }}>
                  <div
                    className="flex-1 flex items-center text-[14px] font-medium leading-[12px] text-text-secondary"
                    style={{ padding: '0 12px', borderBottom: '1px solid rgba(120,120,128,0.16)' }}
                  >
                    Сила D
                  </div>
                  <div
                    className="flex-1 flex items-center text-[14px] font-medium leading-[12px] text-text-secondary"
                    style={{ padding: '0 12px', borderBottom: '1px solid rgba(120,120,128,0.16)' }}
                  >
                    Ожидаемая D
                  </div>
                  <div
                    className="flex-1 flex items-center text-[14px] font-medium leading-[12px] text-text-secondary"
                    style={{ padding: '0 12px', borderBottom: '1px solid rgba(120,120,128,0.16)' }}
                  >
                    Формула
                  </div>
                </div>
                {/* Table rows */}
                {results.map((row, idx) => (
                  <button
                    key={idx}
                    className="flex w-full text-left"
                    style={{
                      height: 64,
                      backgroundColor:
                        idx === selectedIdx
                          ? 'rgba(0,122,255,0.08)'
                          : idx % 2 === 1
                            ? '#f7f8fa'
                            : 'white',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedIdx(idx)}
                  >
                    <div
                      className="flex-1 flex items-center text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text"
                      style={{ padding: '0 12px' }}
                    >
                      {row.power >= 0 ? '+' : ''}{row.power.toFixed(1)}
                    </div>
                    <div
                      className="flex-1 flex items-center text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text"
                      style={{ padding: '0 12px' }}
                    >
                      {row.expected >= 0 ? '+' : ''}{row.expected.toFixed(2)}
                    </div>
                    <div
                      className="flex-1 flex items-center text-[16px] font-normal leading-[24px] tracking-[-0.25px] text-text"
                      style={{ padding: '0 12px' }}
                    >
                      {row.formula}
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected result summary */}
              <div
                className="rounded-[16px] flex items-center justify-between"
                style={{ padding: '20px 24px', background: 'rgba(0, 122, 255, 0.08)' }}
              >
                <span className="text-[16px] font-medium leading-[24px] text-text">
                  Рекомендуемая ИОЛ:
                </span>
                <span className="text-[24px] font-semibold leading-[24px] tracking-[-0.5px]" style={{ color: '#007AFF' }}>
                  {results[selectedIdx].power >= 0 ? '+' : ''}{results[selectedIdx].power.toFixed(1)} D
                </span>
              </div>

              {/* Parameters summary */}
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {[
                  { label: 'Глаз', value: eye === 'right' ? 'OD' : 'OS' },
                  { label: 'K1', value: `${k1} D` },
                  { label: 'K2', value: `${k2} D` },
                  { label: 'AL', value: `${al} мм` },
                  { label: 'ACD', value: `${acd} мм` },
                  { label: 'Модель', value: iolModel },
                ].map((p) => (
                  <div
                    key={p.label}
                    className="rounded-[8px] flex items-center"
                    style={{ padding: '6px 12px', background: 'rgba(120,120,128,0.08)' }}
                  >
                    <span className="text-[13px] text-text-secondary">{p.label}:&nbsp;</span>
                    <span className="text-[13px] font-medium text-text">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!results && (
            <div className="flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
              <span className="text-[16px] text-text-secondary">
                Введите параметры и нажмите «Рассчитать ИОЛ»
              </span>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 48, maxWidth: 1200 }}>
          <h3
            className="text-[24px] font-medium leading-[24px] tracking-[-0.5px] text-text"
            style={{ fontFeatureSettings: "'ss01' 1", marginBottom: 36 }}
          >
            История расчётов (текущая сессия)
          </h3>
          <div className="border border-border rounded-[16px] overflow-clip responsive-table-wrap">
            {/* Table header */}
            <div className="flex w-full" style={{ height: 48 }}>
              {['Глаз', 'K1/K2', 'AL', 'ACD', 'Формула', 'ИОЛ'].map((h) => (
                <div
                  key={h}
                  className="flex-1 flex items-center text-[14px] font-medium leading-[12px] text-text-secondary"
                  style={{ padding: '0 12px', borderBottom: '1px solid rgba(120,120,128,0.16)' }}
                >
                  {h}
                </div>
              ))}
            </div>
            {history.map((calc, idx) => (
              <div
                key={calc.id || idx}
                className="flex w-full"
                style={{
                  height: 56,
                  backgroundColor: idx % 2 === 1 ? '#f7f8fa' : 'white',
                }}
              >
                <div className="flex-1 flex items-center text-[16px] text-text" style={{ padding: '0 12px' }}>
                  {calc.eye === 'right' ? 'OD' : 'OS'}
                </div>
                <div className="flex-1 flex items-center text-[16px] text-text" style={{ padding: '0 12px' }}>
                  {calc.k1}/{calc.k2}
                </div>
                <div className="flex-1 flex items-center text-[16px] text-text" style={{ padding: '0 12px' }}>
                  {calc.axial_length}
                </div>
                <div className="flex-1 flex items-center text-[16px] text-text" style={{ padding: '0 12px' }}>
                  {calc.acd}
                </div>
                <div className="flex-1 flex items-center text-[16px] text-text" style={{ padding: '0 12px' }}>
                  {iolFormulaOptions.find((f) => f.value === calc.formula)?.label || calc.formula}
                </div>
                <div className="flex-1 flex items-center text-[16px] font-semibold text-text" style={{ padding: '0 12px' }}>
                  {calc.recommended_iol.toFixed(1)} D
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IOLCalculatorPage
