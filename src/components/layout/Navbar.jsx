import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Home, Users, DollarSign, Calendar, Map, 
  LogOut, Plane, Menu, X 
} from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isTripPage = location.pathname.includes('/trip/')
  const tripId = isTripPage ? location.pathname.split('/')[2] : null

  const navLinks = isTripPage ? [
    { to: `/trip/${tripId}`, label: 'Inicio', icon: <Home size={20} />, id: 'home' },
    { to: `/trip/${tripId}/members`, label: 'Integrantes', icon: <Users size={20} />, id: 'members' },
    { to: `/trip/${tripId}/expenses`, label: 'Gastos', icon: <DollarSign size={20} />, id: 'expenses' },
    { to: `/trip/${tripId}/itinerary`, label: 'Itinerario', icon: <Calendar size={20} />, id: 'itinerary' },
    { to: `/trip/${tripId}/map`, label: 'Mapa', icon: <Map size={20} />, id: 'map' },
  ] : [
    { to: '/', label: 'Mis Viajes', icon: <Plane size={20} />, id: 'dashboard' },
  ]

  const handleLogout = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <nav className={`navbar ${isTripPage ? 'navbar-trip-active' : ''}`}>
      <div className="navbar-inner">
        
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-badge">
            <Plane size={20} color="white" />
          </div>
          <span className="hide-mobile">TravelMates</span>
        </Link>

        {/* Links Desktop */}
        <div className="navbar-links hide-mobile">
          {navLinks.map(link => (
            <Link 
              key={link.id} 
              to={link.to} 
              className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Usuario y Salir (Desktop) */}
        <div className="navbar-actions hide-mobile">
          <div className="navbar-user">
            <div className="avatar avatar-sm">
              {user?.email?.slice(0, 2).toUpperCase()}
            </div>
            <span className="user-email">{user?.email?.split('@')[0]}</span>
          </div>
          <button className="btn-logout-header" onClick={handleLogout} title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>

        {/* Navegación Móvil (Bottom Bar) */}
        {isTripPage && (
          <div className="navbar-links-mobile show-mobile-only">
            {navLinks.map(link => (
              <Link 
                key={link.id} 
                to={link.to} 
                className={`navbar-link-mobile ${location.pathname === link.to ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
            <button className="navbar-link-mobile" onClick={handleLogout} style={{ border: 'none', background: 'transparent' }}>
              <LogOut size={24} />
              <span>Salir</span>
            </button>
          </div>
        )}

        {/* Botón Salir Móvil (Dashboard) */}
        {!isTripPage && (
          <button className="show-mobile-only btn-ghost" onClick={handleLogout} style={{ color: 'var(--text-muted)' }}>
            <LogOut size={24} />
          </button>
        )}
      </div>
    </nav>
  )
}
