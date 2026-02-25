import { useRef, useState } from 'react'

/* ── Inline SVG icons from Figma ── */

export function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7.11519 7.11657C7.46666 6.76519 8.0362 6.76516 8.38765 7.11657L12.0068 10.7357L15.6191 7.12341C15.9706 6.77202 16.5411 6.77196 16.8925 7.12341C17.2438 7.47487 17.2439 8.04544 16.8925 8.39685L13.2802 12.0092L16.8916 15.6205L16.9531 15.6888C17.2417 16.0423 17.2212 16.5643 16.8916 16.8939C16.5621 17.223 16.0408 17.2435 15.6875 16.9554L15.6191 16.8939L12.0068 13.2816L8.38863 16.9008L8.32027 16.9623C7.96684 17.2509 7.44482 17.2302 7.11519 16.9008C6.78557 16.5711 6.76503 16.0492 7.05367 15.6957L7.11519 15.6273L10.7334 12.0082L7.11519 8.39001C6.76372 8.03854 6.76372 7.46805 7.11519 7.11657Z" fill="currentColor"/>
    </svg>
  )
}

export function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M8.64665 0.833496C12.9575 0.833716 16.4518 4.32855 16.4518 8.63949L16.4421 9.04069C16.3544 10.7714 15.7015 12.3519 14.6663 13.6053L18.9486 17.8883C19.2415 18.1812 19.2415 18.6558 18.9486 18.9487C18.6557 19.2416 18.1811 19.2416 17.8882 18.9487L13.6043 14.6657C12.2557 15.7764 10.5292 16.4455 8.64583 16.4455L8.24463 16.4349C4.12028 16.2258 0.839897 12.8158 0.839844 8.63949L0.850423 8.23747C1.05286 4.24623 4.25336 1.04558 8.24463 0.843262L8.64665 0.833496ZM2.33968 8.63949C2.33974 12.1219 5.16345 14.9454 8.64583 14.9456C12.1284 14.9456 14.9519 12.1221 14.952 8.63949C14.952 5.15684 12.1285 2.33333 8.64583 2.33333C5.16342 2.33361 2.33968 5.15701 2.33968 8.63949Z" fill="currentColor"/>
    </svg>
  )
}

export function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M17.1353 7.00016C17.485 7.00016 17.7683 7.28361 17.7684 7.6333V13.5846C17.7682 15.7706 15.9961 17.543 13.8101 17.543H6.1888C4.00292 17.5428 2.23064 15.7705 2.23047 13.5846V7.6333C2.23057 7.2838 2.5141 7.00043 2.86361 7.00016H17.1353ZM7.96126 8.49268C6.92367 8.49268 6.25635 8.97282 5.99593 9.54655C5.9349 9.68489 5.90641 9.8029 5.90641 9.94124C5.90649 10.2382 6.08146 10.4377 6.42318 10.4377C6.6996 10.4376 6.84235 10.3358 6.97656 10.0592C7.16781 9.64421 7.46891 9.43669 7.96533 9.43669C8.55915 9.43683 8.87679 9.75011 8.87679 10.222C8.87668 10.7019 8.47771 11.0357 7.86361 11.0358H7.62354C7.3265 11.0358 7.1556 11.2148 7.1556 11.4712C7.15569 11.7356 7.32657 11.9106 7.62354 11.9106H7.87988C8.59171 11.9108 9.01107 12.2281 9.007 12.7977C9.00688 13.2858 8.59165 13.6357 7.98975 13.6359C7.37956 13.6359 7.06202 13.3916 6.85449 12.9808C6.73249 12.7571 6.57756 12.6595 6.33366 12.6593C5.99593 12.6593 5.79248 12.8587 5.79248 13.1761C5.79251 13.2981 5.821 13.4285 5.88607 13.5627C6.16286 14.1403 6.85063 14.6247 7.9694 14.6247C9.33221 14.6245 10.2561 13.9164 10.2562 12.8506C10.2562 12.041 9.69035 11.5283 8.81575 11.4468V11.4224C9.50725 11.2799 10.0404 10.7914 10.0405 10.047C10.0405 9.1072 9.20209 8.49281 7.96126 8.49268ZM13.0231 8.53337C12.7709 8.53337 12.5754 8.5701 12.2907 8.7653L11.127 9.57096C10.9357 9.70524 10.8625 9.84359 10.8625 10.0308C10.8626 10.2911 11.0456 10.4702 11.2938 10.4702C11.4197 10.4702 11.5055 10.4416 11.6193 10.3604L12.4779 9.76221H12.5023V13.9655C12.5024 14.3357 12.7506 14.5799 13.1126 14.5799C13.4745 14.5797 13.7188 14.3355 13.7189 13.9655V9.22103C13.7189 8.79798 13.4583 8.53353 13.0231 8.53337Z" fill="currentColor"/>
      <path d="M13.4756 0.833984C13.8206 0.834094 14.1004 1.11403 14.1006 1.45898V2.00342H14.6507C16.3727 2.00363 17.7684 3.39983 17.7684 5.12191C17.7681 5.47019 17.486 5.75246 17.1377 5.7526H2.86198C2.51377 5.75244 2.23077 5.47026 2.23047 5.12191C2.23047 3.3998 3.62689 2.00358 5.34896 2.00342H5.91536V1.45898C5.91555 1.11403 6.19539 0.834094 6.54036 0.833984C6.88543 0.833984 7.16518 1.11396 7.16536 1.45898V2.00342H12.8506V1.45898C12.8508 1.11396 13.1305 0.833984 13.4756 0.833984Z" fill="currentColor"/>
    </svg>
  )
}

export function IconChevronDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ── Data ── */

export const operationTypes = [
  'Факоэмульсификация',
  'Антиглаукоматозная операция',
  'Витреоретинальная операция',
  'Другое',
]

export const diagnosisList = [
  { code: 'H25.0', text: 'Начальная старческая катаракта' },
  { code: 'H25.1', text: 'Старческая ядерная катаракта' },
  { code: 'H25.2', text: 'Старческая морганиева катаракта' },
  { code: 'H25.8', text: 'Другие старческие катаракты' },
  { code: 'H25.9', text: 'Старческая катаракта неуточнённая' },
  { code: 'H26.0', text: 'Детская, юношеская и пресенильная катаракта' },
  { code: 'H26.1', text: 'Травматическая катаракта' },
  { code: 'H26.2', text: 'Осложнённая катаракта' },
  { code: 'H26.9', text: 'Катаракта неуточнённая' },
  { code: 'H28.0', text: 'Диабетическая катаракта' },
  { code: 'H40.0', text: 'Подозрение на глаукому' },
  { code: 'H40.1', text: 'Первичная открытоугольная глаукома' },
  { code: 'H40.2', text: 'Первичная закрытоугольная глаукома' },
  { code: 'H33.0', text: 'Отслойка сетчатки с разрывом' },
  { code: 'H33.4', text: 'Тракционная отслойка сетчатки' },
  { code: 'H43.1', text: 'Кровоизлияние в стекловидное тело' },
  { code: 'H35.3', text: 'Дегенерация макулы и заднего полюса' },
]

export const districts = [
  'Якутск',
  'Алданский',
  'Амгинский',
  'Булунский',
  'Верхневилюйский',
  'Вилюйский',
  'Горный',
  'Жиганский',
  'Кобяйский',
  'Ленский',
  'Мегино-Кангаласский',
  'Мирнинский',
  'Намский',
  'Нерюнгринский',
  'Нюрбинский',
  'Олёкминский',
  'Оймяконский',
  'Среднеколымский',
  'Сунтарский',
  'Таттинский',
  'Томпонский',
  'Усть-Алданский',
  'Усть-Майский',
  'Хангаласский',
  'Чурапчинский',
]

/* ── Styles ── */

export const inputBase: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(120,120,128,0.16)',
  borderRadius: 12,
  padding: '16px',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: '24px',
  letterSpacing: -0.25,
  color: '#101012',
  background: 'transparent',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box' as const,
}

export const inputWithIconStyle: React.CSSProperties = {
  ...inputBase,
  paddingRight: 44,
}

export const selectStyle: React.CSSProperties = {
  ...inputBase,
  paddingRight: 44,
  appearance: 'none' as const,
  cursor: 'pointer',
}

export const iconWrapStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#101012',
  pointerEvents: 'none',
  display: 'flex',
}

/* ── Shared field components ── */

export function DiagnosisField({
  selectedDiagnosis,
  diagnosisSearch,
  onSearchChange,
  onSelect,
}: {
  selectedDiagnosis: { code: string; text: string } | null
  diagnosisSearch: string
  onSearchChange: (v: string) => void
  onSelect: (d: { code: string; text: string } | null) => void
}) {
  const [showList, setShowList] = useState(false)

  const filtered = diagnosisList.filter((d) => {
    const q = diagnosisSearch.toLowerCase()
    return d.code.toLowerCase().includes(q) || d.text.toLowerCase().includes(q)
  })

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <input
        type="text"
        placeholder="Поиск диагноза МКБ-10"
        value={selectedDiagnosis ? `${selectedDiagnosis.code} - ${selectedDiagnosis.text}` : diagnosisSearch}
        onChange={(e) => {
          onSearchChange(e.target.value)
          onSelect(null)
          setShowList(true)
        }}
        onFocus={() => !selectedDiagnosis && setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
        style={inputWithIconStyle}
      />
      <div style={iconWrapStyle}>
        <IconSearch />
      </div>
      {showList && !selectedDiagnosis && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: 200,
            overflowY: 'auto',
            background: 'white',
            border: '1px solid rgba(120,120,128,0.16)',
            borderRadius: 12,
            zIndex: 10,
            boxShadow: '0px 4px 2px 0px rgba(16,16,18,0.01), 0px 2px 2px 0px rgba(16,16,18,0.02), 0px 1px 1px 0px rgba(16,16,18,0.04), 0px 0px 1px 0px rgba(16,16,18,0.12)',
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((d) => (
              <button
                key={d.code}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(d)
                  onSearchChange('')
                  setShowList(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  lineHeight: '20px',
                  color: '#101012',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#f7f8fa' }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
              >
                <strong>{d.code}</strong> — {d.text}
              </button>
            ))
          ) : (
            <div style={{ padding: '12px 16px', fontSize: 14, color: 'rgba(60,60,67,0.52)' }}>
              Ничего не найдено
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function OperationTypeField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
      >
        {operationTypes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <div style={iconWrapStyle}>
        <IconChevronDown />
      </div>
    </div>
  )
}

export function DateField({
  value,
  onChange,
  placeholder = 'Дата рождения',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const hiddenRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value ? new Date(value).toLocaleDateString('ru-RU') : ''}
        readOnly
        onClick={() => hiddenRef.current?.showPicker?.()}
        style={inputWithIconStyle}
      />
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
      />
      <div style={iconWrapStyle}>
        <IconCalendar />
      </div>
    </div>
  )
}

export function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
}) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
      >
        <option value="">{placeholder}</option>
        {options.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <div style={iconWrapStyle}>
        <IconChevronDown />
      </div>
    </div>
  )
}
