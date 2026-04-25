import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plane, Mail, Lock, User, Calendar, DollarSign, Map, MessageCircle } from 'lucide-react'
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
        setError('¡Cuenta creada! Ya puedes entrar con tus datos.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Algo salió mal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Plane size={32} />
          </div>
          <h1 className="auth-brand-title">TravelMates</h1>
          <p className="auth-brand-sub">La forma más sencilla de organizar viajes inolvidables con amigos y familia.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon-box"><Calendar size={20} /></div>
              <div>
                <strong>Planificación Grupal</strong>
                <p>Crea itinerarios donde todos pueden proponer y votar actividades.</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon-box"><DollarSign size={20} /></div>
              <div>
                <strong>Cuentas Claras</strong>
                <p>Registra gastos y deja que la app calcule quién debe cuánto a quién.</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon-box"><Map size={20} /></div>
              <div>
                <strong>Lugares Favoritos</strong>
                <p>Guarda puntos de interés en el mapa para no perderte nada.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel glass-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError('') }}>
              Entrar
            </button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError('') }}>
              Registro
            </button>
          </div>

          <h2 className="auth-form-title">{mode === 'login' ? '¡Bienvenido!' : 'Crea tu cuenta'}</h2>
          <p className="auth-form-sub">{mode === 'login' ? 'Accede a tus planes' : 'Comienza tu aventura hoy'}</p>

          {error && (
            <div className={`auth-alert ${error.includes('!') ? 'auth-alert-success' : 'auth-alert-error'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nombre y Apellido</label>
                <div className="form-input-with-icon">
                  <User size={18} className="input-icon" />
                  <input type="text" className="form-input" placeholder="Nombre Apellido" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <div className="form-input-with-icon">
                <Mail size={18} className="input-icon" />
                <input type="email" className="form-input" placeholder="email@hola.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="form-input-with-icon">
                <Lock size={18} className="input-icon" />
                <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? <div className="spinner" /> : (mode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
