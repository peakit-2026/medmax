import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === 'surgeon' ? '/surgeon' : '/doctor', { replace: true })
    }
  }, [authLoading, user, navigate])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role === 'surgeon') {
        navigate('/surgeon')
      } else {
        navigate('/doctor')
      }
    } catch {
      setError('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4" style={{ background: '#F2F2F7' }}>
      <div
        className="w-[456px] max-w-full flex flex-col"
        style={{
          background: 'white',
          border: '1px solid rgba(120,120,128,0.16)',
          borderRadius: 32,
          padding: 36,
          gap: 36,
          boxShadow:
            '0 4px 2px rgba(16,16,18,0.01), 0 2px 2px rgba(16,16,18,0.02), 0 1px 1px rgba(16,16,18,0.04), 0 0 1px rgba(16,16,18,0.12)',
        }}
      >
        <div className="flex flex-col items-center" style={{ gap: 16 }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <img src="/logo-48.png" alt="" width={48} height={48} />
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#101012',
                letterSpacing: -1,
                lineHeight: '24px',
                fontFeatureSettings: "'ss01' 1",
              }}
            >
              MedMAX
            </span>
          </div>
          <p
            className="text-center"
            style={{
              fontSize: 16,
              fontWeight: 400,
              lineHeight: '24px',
              letterSpacing: -0.25,
              color: 'rgba(60,60,67,0.72)',
            }}
          >
            Для доступа в систему необходимо заполнить данные
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(255,54,46,0.08)',
              color: '#FF362E',
              fontSize: 14,
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="contents">
          <div className="flex flex-col" style={{ gap: 8 }}>
            <input
              type="email"
              placeholder="Логин"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '16px 12px',
                fontSize: 16,
                lineHeight: '24px',
                letterSpacing: -0.25,
                color: '#101012',
                border: '1px solid rgba(120,120,128,0.16)',
                borderRadius: 12,
                outline: 'none',
                background: 'transparent',
              }}
            />
            <div
              className="flex items-center"
              style={{
                border: '1px solid rgba(120,120,128,0.16)',
                borderRadius: 12,
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex-1 min-w-0"
                style={{
                  padding: '16px 12px',
                  fontSize: 16,
                  lineHeight: '24px',
                  letterSpacing: -0.25,
                  color: '#101012',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 flex items-center justify-center"
                style={{ padding: '16px 12px 16px 4px', color: 'rgba(60,60,67,0.52)' }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col" style={{ gap: 24 }}>
            <label className="flex items-center cursor-pointer select-none" style={{ gap: 8 }}>
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: rememberMe ? '#007AFF' : 'transparent',
                  border: rememberMe ? 'none' : '1.5px solid rgba(120,120,128,0.36)',
                  transition: 'all 0.15s',
                }}
                onClick={() => setRememberMe(!rememberMe)}
              >
                {rememberMe && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <span
                style={{
                  fontSize: 16,
                  lineHeight: '24px',
                  letterSpacing: -0.25,
                  color: '#101012',
                }}
              >
                Запомнить меня
              </span>
            </label>

            <div className="flex flex-col" style={{ gap: 8 }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full disabled:opacity-60"
                style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundImage:
                    'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #007AFF 0%, #007AFF 100%)',
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: '24px',
                  letterSpacing: 0,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 -1px 1px rgba(16,16,18,0.12)',
                }}
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>

              <button
                type="button"
                className="w-full"
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: 'rgba(120,120,128,0.12)',
                  color: '#101012',
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: '24px',
                  letterSpacing: 0,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Войти через Госуслуги
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
