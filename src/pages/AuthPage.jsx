import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plane, Mail, Lock, User, Sparkles, ArrowRight, Send } from 'lucide-react'
import './AuthPage.css'

export default function AuthPage() {
  const { user, signIn, signUp, signInWithMagicLink } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email)
        if (error) throw error
        setMagicSent(true)
      } else if (mode === 'register') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMode('login')
        setError('✅ Cuenta creada! Revisa tu email para confirmarla.')
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
      {/* Animated background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-container">
        {/* Left panel – branding */}
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Plane size={32} />
          </div>
          <h1 className="auth-brand-title">TripMates</h1>
          <p className="auth-brand-sub">La app de viajes en grupo para familias y amigos aventureros 🌍</p>

          <div className="auth-features">
            {[
              { icon: '🗓️', text: 'Planifica el itinerario juntos' },
              { icon: '💸', text: 'Divide gastos sin dramas' },
              { icon: '🗺️', text: 'Descubre puntos de interés' },
              { icon: '💬', text: 'Chat grupal en tiempo real' },
            ].map((f, i) => (
              <div key={i} className={`auth-feature fade-in-up delay-${i + 1}`}>
                <span className="auth-feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel – form */}
        <div className="auth-form-panel glass">
          {magicSent ? (
            <div className="auth-magic-sent fade-in-up">
              <div className="auth-magic-icon">📬</div>
              <h2>¡Email enviado!</h2>
              <p>Revisa tu bandeja de entrada y haz clic en el enlace mágico para entrar sin contraseña.</p>
              <button className="btn btn-ghost" onClick={() => { setMagicSent(false); setMode('login') }}>
                ← Volver al inicio
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => { setMode('login'); setError('') }}
                >
                  Entrar
                </button>
                <button
                  className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => { setMode('register'); setError('') }}
                >
                  Registrarse
                </button>
                <button
                  className={`auth-tab ${mode === 'magic' ? 'active' : ''}`}
                  onClick={() => { setMode('magic'); setError('') }}
                >
                  <Sparkles size={14} /> Magic Link
                </button>
              </div>

              <div className="auth-form-header">
                <h2 className="auth-form-title">
                  {mode === 'login' && '¡Hola de nuevo! 👋'}
                  {mode === 'register' && 'Crea tu cuenta ✨'}
                  {mode === 'magic' && 'Acceso rápido ⚡'}
                </h2>
                <p className="auth-form-sub">
                  {mode === 'login' && 'Accede a tus viajes en grupo'}
                  {mode === 'register' && 'Empieza a planificar aventuras'}
                  {mode === 'magic' && 'Recibe un enlace directo por email'}
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
                    <label className="form-label" htmlFor="auth-name">Nombre completo</label>
                    <div className="form-input-icon">
                      <User size={18} className="input-icon" />
                      <input
                        id="auth-name"
                        type="text"
                        className="form-input"
                        placeholder="Melina Rivera"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-email">Email</label>
                  <div className="form-input-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="auth-email"
                      type="email"
                      className="form-input"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {mode !== 'magic' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="auth-password">Contraseña</label>
                    <div className="form-input-icon">
                      <Lock size={18} className="input-icon" />
                      <input
                        id="auth-password"
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={loading}
                  id="auth-submit-btn"
                >
                  {loading ? (
                    <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                  ) : (
                    <>
                      {mode === 'login' && <><ArrowRight size={18} /> Entrar</>}
                      {mode === 'register' && <><Sparkles size={18} /> Crear cuenta</>}
                      {mode === 'magic' && <><Send size={18} /> Enviar enlace</>}
                    </>
                  )}
                </button>
              </form>

              {mode === 'login' && (
                <>
                  <div className="divider-text">o accede sin contraseña</div>
                  <button
                    className="btn btn-secondary w-full"
                    onClick={() => { setMode('magic'); setError('') }}
                  >
                    <Sparkles size={16} /> Usar Magic Link
                  </button>
                </>
              )}

              {/* Guest access info */}
              <p className="auth-guest-note">
                🔗 ¿Te han invitado a un viaje?<br />
                <span>Usa el enlace del email de invitación para acceder directamente</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
