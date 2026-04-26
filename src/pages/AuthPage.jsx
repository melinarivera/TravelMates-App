import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plane, Calendar, DollarSign, MessageCircle, Shield, Eye, EyeOff, X } from 'lucide-react'
import './AuthPage.css'

export default function AuthPage() {
  const { user, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('login') // 'login', 'register', 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPWA, setShowPWA] = useState(() => {
    // Solo mostrar si no lo ha cerrado antes (opcional, pero buena práctica)
    return localStorage.getItem('pwaPromptClosed') !== 'true'
  })
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
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email)
        if (error) throw error
        setError('¡Te hemos enviado un correo para restablecer tu contraseña! Revisa tu bandeja de entrada.')
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
        
        {/* Lado Branding (Landing) */}
        <div className="auth-brand">
          <div className="auth-logo-group">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="TravelMates Logo" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
            <h1 className="auth-brand-title">TravelMates</h1>
          </div>
          
          <p className="auth-brand-sub">
            La forma más sencilla y profesional de organizar viajes con amigos.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon"><Calendar size={20} /></div>
              <div>
                <strong>Itinerarios Grupales</strong>
                <p>Propón y vota actividades en conjunto.</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><DollarSign size={20} /></div>
              <div>
                <strong>Cuentas Claras</strong>
                <p>Divide gastos y salda deudas sin dramas.</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><MessageCircle size={20} /></div>
              <div>
                <strong>Todo Conectado</strong>
                <p>Información centralizada y fácil de compartir.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Formulario */}
        <div className="auth-form-panel glass-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' || mode === 'reset' ? 'active' : ''}`} onClick={() => setMode('login')}>
              Iniciar Sesión
            </button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
              Registrarse
            </button>
          </div>

          <div className="auth-header">
            <h2 className="auth-form-title">
              {mode === 'login' ? '¡Hola de nuevo!' : mode === 'register' ? 'Crea tu cuenta' : 'Recuperar contraseña'}
            </h2>
            <p className="auth-form-sub">
              {mode === 'login' ? 'Ingresa para ver tus viajes' : mode === 'register' ? 'Únete a miles de viajeros' : 'Te enviaremos un enlace de recuperación'}
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
                <label className="form-label">Nombre Apellido</label>
                <input type="text" className="form-input" placeholder="Nombre Apellido" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input type="email" className="form-input" placeholder="email@hola.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {mode !== 'reset' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Contraseña</label>
                  {mode === 'login' && (
                    <span 
                      style={{ fontSize: '0.85rem', color: '#bc13fe', cursor: 'pointer', fontWeight: 500 }}
                      onClick={() => setMode('reset')}
                    >
                      ¿Olvidaste tu contraseña?
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    minLength={6} 
                    style={{ paddingRight: '45px' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      color: 'rgba(255,255,255,0.4)', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn-add-vibrant" disabled={loading} style={{ width: '100%', marginTop: '1.5rem', height: '55px', fontSize: '1.1rem', justifyContent: 'center' }}>
              {loading ? <div className="spinner" /> : (mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Comenzar' : 'Enviar Enlace')}
            </button>
            
            {mode === 'reset' && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }} onClick={() => setMode('login')}>
                  Volver a Iniciar Sesión
                </span>
              </div>
            )}
          </form>

          <div className="auth-footer" style={{ flexDirection: 'column', gap: '0.8rem', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              <Shield size={14} />
              <span>Plataforma 100% Segura</span>
            </div>
            
            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div>&copy; {new Date().getFullYear()} Melina Rivera. Todos los derechos reservados.</div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/privacidad" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad de Datos</Link>
                <Link to="/terminos" style={{ color: 'inherit', textDecoration: 'none' }}>Términos y Condiciones</Link>
                <Link to="/aviso-legal" style={{ color: 'inherit', textDecoration: 'none' }}>Aviso Legal (UE/España)</Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showPWA && (
        <div className="pwa-bubble fade-in-up" style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(20, 20, 35, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(188, 19, 254, 0.3)',
          borderRadius: '20px',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '400px'
        }}>
          <div style={{ flex: 1, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
            <strong style={{ color: '#bc13fe', display: 'block', marginBottom: '0.3rem', fontSize: '0.95rem' }}>¡Instala TravelMates! 🚀</strong>
            En <b>iOS</b>: Toca "Compartir" y luego "Añadir a inicio".<br/>
            En <b>Android</b>: Toca el menú (⋮) y "Añadir a inicio".
          </div>
          <button 
            onClick={() => {
              setShowPWA(false)
              localStorage.setItem('pwaPromptClosed', 'true')
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
