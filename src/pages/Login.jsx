import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  Mail, Lock, User, Plane, ArrowRight, 
  Calendar, DollarSign, MapPin, MessageCircle 
} from 'lucide-react'
import './Login.css'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const navigate = useNavigate()

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        alert('¡Cuenta creada! Ya puedes iniciar sesión.')
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container fade-in-up">
        {/* Left Side: Branding & Features */}
        <div className="login-branding">
          <div className="login-logo-box">
            <Plane size={32} />
          </div>
          <h1 className="brand-title">TravelMates</h1>
          <p className="brand-tagline">
            La plataforma inteligente para planificar viajes en grupo sin complicaciones.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon"><Calendar size={20} /></div>
              <span>Itinerarios colaborativos en tiempo real</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><DollarSign size={20} /></div>
              <span>Control de gastos y presupuesto compartido</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><MapPin size={20} /></div>
              <span>Descubre y guarda puntos de interés</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><MessageCircle size={20} /></div>
              <span>Chat grupal integrado por cada viaje</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="login-auth-box glass">
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} 
              onClick={() => setMode('signin')}
            >
              Entrar
            </button>
            <button 
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} 
              onClick={() => setMode('signup')}
            >
              Registrarse
            </button>
          </div>

          <div className="auth-header">
            <h2>{mode === 'signin' ? '¡Bienvenido de nuevo!' : 'Únete a TravelMates'}</h2>
            <p>{mode === 'signin' ? 'Ingresa tus credenciales para acceder.' : 'Crea tu cuenta y empieza a planificar.'}</p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label>Nombre completo</label>
                <div className="input-wrapper">
                  <User size={18} className="field-icon" />
                  <input 
                    type="text" 
                    placeholder="Tu nombre" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required 
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="field-icon" />
                <input 
                  type="email" 
                  placeholder="tu@email.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <Lock size={18} className="field-icon" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <div className="spinner-small" /> : (
                <>
                  {mode === 'signin' ? 'Entrar' : 'Registrarse'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
