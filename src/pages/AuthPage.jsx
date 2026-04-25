import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plane, Calendar, DollarSign, Map, MessageCircle, Shield, Globe } from 'lucide-react'
import './AuthPage.css'

export default function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const { error } = await signUp(email, password, { full_name: name })
        if (error) throw error
        setMode('login')
        setError('¡Cuenta creada! Ya puedes entrar.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Error al conectar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container auth-container">
        {/* Lado Izquierdo: Branding y Features (La "Landing") */}
        <div className="auth-brand fade-in-up">
          <div className="auth-logo-badge">
            <Plane size={32} />
          </div>
          <h1 className="auth-brand-title">TravelMates</h1>
          <p className="auth-brand-sub">
            Organiza viajes grupales sin dramas. Itinerarios, gastos compartidos y chat, todo en un solo lugar.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon"><Calendar size={20} /></div>
              <div>
                <strong>Planificación Inteligente</strong>
                <p>Propón actividades y deja que el grupo vote.</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><DollarSign size={20} /></div>
              <div>
                <strong>Control de Gastos</strong>
                <p>Divide cuentas y salda deudas fácilmente.</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><MessageCircle size={20} /></div>
              <div>
                <strong>Chat en Tiempo Real</strong>
                <p>Mantente conectado con tus compañeros de viaje.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario Glass */}
        <div className="auth-form-panel glass-card fade-in-up delay-1">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
              Entrar
            </button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
              Registrarse
            </button>
          </div>

          <div className="auth-header">
            <h2 className="auth-form-title">
              {mode === 'login' ? '¡Bienvenido!' : 'Crea tu cuenta'}
            </h2>
            <p className="auth-form-sub">
              {mode === 'login' ? 'Accede a tus planes de viaje' : 'Únete a la aventura hoy mismo'}
            </p>
          </div>

          {error && (
            <div className={`auth-alert ${error.includes('!') ? 'auth-alert-success' : 'auth-alert-error'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nombre y Apellido</label>
                <input type="text" className="form-input" placeholder="Nombre Apellido" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input type="email" className="form-input" placeholder="email@hola.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? <div className="spinner" /> : (mode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
            </button>
          </form>

          <div className="auth-footer">
            <Shield size={14} />
            <span>Tus datos están seguros con TravelMates</span>
          </div>
        </div>
      </div>
    </div>
  )
}
