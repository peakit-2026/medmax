import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from './store/auth'
import { useChatStore } from './store/chat'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import IOLCalculator from './pages/doctor/IOLCalculator'
import IOLCalculatorPage from './pages/doctor/IOLCalculatorPage'
import MessagesPage from './pages/doctor/MessagesPage'
import SurgeonDashboard from './pages/surgeon/SurgeonDashboard'
import SurgeryCalendarPage from './pages/surgeon/SurgeryCalendarPage'
import PatientLookup from './pages/patient/PatientLookup'
import PatientStatus from './pages/patient/PatientStatus'
import VideoCall from './components/VideoCall'
import { acquireMediaStream } from './hooks/useWebTransport'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'

const CALL_TIMEOUT_MS = 30_000

function IncomingCallBanner() {
  const incomingCall = useChatStore((s) => s.incomingCall)
  const dismissIncomingCall = useChatStore((s) => s.dismissIncomingCall)
  const sendCallEnded = useChatStore((s) => s.sendCallEnded)
  const [accepted, setAccepted] = useState(false)
  const [callStream, setCallStream] = useState<MediaStream | null>(null)

  // Reset accepted when incomingCall is dismissed/cleared
  useEffect(() => {
    if (!incomingCall) {
      setAccepted(false)
      setCallStream(null)
    }
  }, [incomingCall])

  // Auto-dismiss incoming call after 30 seconds
  useEffect(() => {
    if (!incomingCall || accepted) return
    const timer = setTimeout(() => {
      sendCallEnded(incomingCall.conversation_id)
      dismissIncomingCall()
    }, CALL_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [incomingCall, accepted, sendCallEnded, dismissIncomingCall])

  const handleAccept = useCallback(async () => {
    // Acquire media in click handler context (critical for mobile browsers)
    const stream = await acquireMediaStream()
    setCallStream(stream)
    setAccepted(true)
  }, [])

  const handleDecline = useCallback(() => {
    if (incomingCall) {
      sendCallEnded(incomingCall.conversation_id)
    }
    dismissIncomingCall()
  }, [incomingCall, sendCallEnded, dismissIncomingCall])

  const handleCallClose = useCallback(() => {
    setAccepted(false)
    dismissIncomingCall()
  }, [dismissIncomingCall])

  const handleCallEnd = useCallback(() => {
    if (incomingCall) {
      sendCallEnded(incomingCall.conversation_id)
    }
  }, [incomingCall, sendCallEnded])

  if (!incomingCall) return null

  if (accepted) {
    return (
      <VideoCall
        roomId={incomingCall.room_id}
        calleeName={incomingCall.caller_name}
        stream={callStream}
        onClose={handleCallClose}
        onCallEnd={handleCallEnd}
      />
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 100,
        background: '#fff',
        borderRadius: 20,
        padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontFamily: 'var(--font-sans)',
        minWidth: 320,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 9999,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%), #34C759',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 20,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {incomingCall.caller_name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#101012' }}>
          {incomingCall.caller_name}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(60,60,67,0.72)' }}>
          Входящий звонок...
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleDecline}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: 'none',
            background: '#ff3b30',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
          title="Отклонить"
        >
          ✕
        </button>
        <button
          onClick={handleAccept}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: 'none',
            background: '#34c759',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
          title="Принять"
        >
          ✓
        </button>
      </div>
    </div>
  )
}

function App() {
  const init = useAuthStore((s) => s.init)
  const token = useAuthStore((s) => s.token)
  const connect = useChatStore((s) => s.connect)

  useEffect(() => {
    init()
  }, [init])

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (token) {
      connect()
    }
  }, [token, connect])

  return (
    <BrowserRouter>
      <IncomingCallBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/patient" element={<PatientLookup />} />
        <Route path="/patient/:code" element={<PatientStatus />} />
        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
          <Route element={<Layout />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/new" element={<Navigate to="/doctor" replace />} />
            <Route path="/doctor/patient/:id" element={<Navigate to="/doctor" replace />} />
            <Route path="/doctor/iol" element={<IOLCalculatorPage />} />
            <Route path="/doctor/patient/:id/iol" element={<IOLCalculator />} />
            <Route path="/doctor/messages" element={<MessagesPage />} />
            <Route path="/doctor/messages/:chatId" element={<MessagesPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['surgeon']} />}>
          <Route element={<Layout />}>
            <Route path="/surgeon" element={<SurgeonDashboard />} />
            <Route path="/surgeon/calendar" element={<SurgeryCalendarPage />} />
            <Route path="/surgeon/messages" element={<MessagesPage />} />
            <Route path="/surgeon/messages/:chatId" element={<MessagesPage />} />
          </Route>
        </Route>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
