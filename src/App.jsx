import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import TripHub from './pages/TripHub'
import Members from './pages/Members'
import Expenses from './pages/Expenses'
import Itinerary from './pages/Itinerary'
import MapPOI from './pages/MapPOI'
import ToastProvider from './components/ui/ToastProvider'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="spinner spinner-lg" />
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <>
      <ToastProvider />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/trip/:tripId" element={<PrivateRoute><TripHub /></PrivateRoute>} />
        <Route path="/trip/:tripId/members" element={<PrivateRoute><Members /></PrivateRoute>} />
        <Route path="/trip/:tripId/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
        <Route path="/trip/:tripId/itinerary" element={<PrivateRoute><Itinerary /></PrivateRoute>} />
        <Route path="/trip/:tripId/map" element={<PrivateRoute><MapPOI /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
