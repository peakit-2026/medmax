import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/auth'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import NewPatientForm from './pages/doctor/NewPatientForm'
import PatientCard from './pages/doctor/PatientCard'

function SurgeonDashboard() {
  return <div>Surgeon Dashboard (coming soon)</div>
}

function PatientLookup() {
  return <div>Patient Lookup (coming soon)</div>
}

function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/patient/:code" element={<PatientLookup />} />
        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
          <Route element={<Layout />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/new" element={<NewPatientForm />} />
            <Route path="/doctor/patient/:id" element={<PatientCard />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['surgeon']} />}>
          <Route element={<Layout />}>
            <Route path="/surgeon" element={<SurgeonDashboard />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
