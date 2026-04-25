import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plane, Mail, Lock, User, ArrowRight, Calendar, DollarSign, Map, MessageCircle } from 'lucide-react'
import './AuthPage.css'

export default function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
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
        setError('✅ ¡Cuenta creada! Ya puedes entrar con tus datos.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Algo salió mal. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-container">
        {/* Left panel – Branding & Explanation */}
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Plane size={32} />
          </div>
          <h1 className="auth-brand-title">TravelMates</h1>
          <p className="auth-brand-sub">La forma más sencilla de organizar viajes inolvidables con amigos y familia.</p>

          <div className="auth-features">
            <div className="auth-feature fade-in-up delay-1">
              <div className="auth-feature-icon-box"><Calendar size={20} /></div>
              <div>
                <strong>Planificación Grupal</strong>
                <p>Crea itinerarios donde todos pueden proponer y votar actividades.</p>
              </div>
            </div>
            <div className="auth-feature fade-in-up delay-2">
              <div className="auth-feature-icon-box"><DollarSign size={20} /></div>
              <div>
                <strong>Cuentas Claras</strong>
                <p>Registra gastos y deja que la app calcule quién debe cuánto a quién.</p>
              </div>
            </div>
            <div className="auth-feature fade-in-up delay-3">
              <div className="auth-feature-icon-box"><Map size={20} /></div>
              <div>
                <strong>Lugares Favoritos</strong>
                <p>Guarda puntos de interés en el mapa para no perderte nada.</p>
              </div>
            </div>
            <div className="auth-feature fade-in-up delay-4">
              <div className="auth-feature-icon-box"><MessageCircle size={20} /></div>
              <div>
                <strong>Todo en un solo lugar</strong>
                <p>Chat integrado y toda la información del viaje siempre a mano.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel – Form */}
        <div className="auth-form-panel glass">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError('') }}
            >
              Iniciar Sesión
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError('') }}
            >
              Registrarse
            </button>
          </div>

          <div className="auth-form-header">
            <h2 className="auth-form-title">
              {mode === 'login' ? '¡Bienvenido!' : 'Comienza tu aventura'}
            </h2>
            <p className="auth-form-sub">
              {mode === 'login' ? 'Accede a tus planes de viaje' : 'Crea tu cuenta gratis en un minuto'}
            </p>
          </div>

          {error && (
            <div className={`auth-alert ${error.startsWith('✅') ? 'auth-alert-success' : 'auth-alert-error'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group fade-in-up">
                <label className="form-label">Nombre completo</label>
                <div className="form-input-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Melina Rivera"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <div className="form-input-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="form-input-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <div className="spinner" /> : (
                mode === 'login' ? 'Entrar' : 'Crear Cuenta'
              )}
            </button>
          </form>

          <p className="auth-footer-note">
            Organiza tus viajes de forma profesional con <strong>TravelMates</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
