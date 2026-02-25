import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/auth'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import IOLCalculator from './pages/doctor/IOLCalculator'
import SurgeonDashboard from './pages/surgeon/SurgeonDashboard'
import PatientReview from './pages/surgeon/PatientReview'
import PatientLookup from './pages/patient/PatientLookup'
import PatientStatus from './pages/patient/PatientStatus'

function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

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
            <Route path="/doctor/patient/:id/iol" element={<IOLCalculator />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['surgeon']} />}>
          <Route element={<Layout />}>
            <Route path="/surgeon" element={<SurgeonDashboard />} />
            <Route path="/surgeon/patient/:id" element={<PatientReview />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
