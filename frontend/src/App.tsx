import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
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
import PatientLookup from './pages/patient/PatientLookup'
import PatientStatus from './pages/patient/PatientStatus'

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
            <Route path="/surgeon/messages" element={<MessagesPage />} />
            <Route path="/surgeon/messages/:chatId" element={<MessagesPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
