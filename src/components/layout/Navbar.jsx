import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Home, Users, DollarSign, Map, Calendar,
  LogOut, Plane
} from 'lucide-react'
import './Navbar.css'

const tripLinks = [
  { to: '', label: 'Inicio', icon: <Home size={20} /> },
  { to: '/members', label: 'Integrantes', icon: <Users size={20} /> },
  { to: '/expenses', label: 'Gastos', icon: <DollarSign size={20} /> },
  { to: '/itinerary', label: 'Itinerario', icon: <Calendar size={20} /> },
  { to: '/map', label: 'Mapa', icon: <Map size={20} /> },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { tripId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const isTripPage = Boolean(tripId)
  const basePath = isTripPage ? `/trip/${tripId}` : ''

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'TM'

  return (
    <nav className={`navbar ${isTripPage ? 'navbar-trip-active' : 'navbar-dashboard'}`}>
      <div className="navbar-inner">
        {/* Logo (Oculto en móvil dentro de un viaje para dar paso al Bottom Nav) */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <Plane size={18} color="white" />
          </div>
          <span>TravelMates</span>
        </Link>

        {/* NAVEGACIÓN DESKTOP */}
        {isTripPage && (
          <div className="navbar-links hide-mobile">
            {tripLinks.map(link => {
              const href = `${basePath}${link.to}`
              const active = location.pathname === href
              return (
                <Link key={link.to} to={href} className={`navbar-link ${active ? 'active' : ''}`}>
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* NAVEGACIÓN MOBILE (BARRA INFERIOR) */}
        {isTripPage && (
          <div className="navbar-links-mobile show-mobile-only" style={{ display: 'none' }}>
            {tripLinks.map(link => {
              const href = `${basePath}${link.to}`
              const active = location.pathname === href
              return (
                <Link key={link.to} to={href} className={`navbar-link-mobile ${active ? 'active' : ''}`}>
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <button onClick={handleSignOut} className="navbar-link-mobile" style={{ background: 'none', border: 'none' }}>
               <LogOut size={20} color="var(--coral)" />
               <span>Salir</span>
            </button>
          </div>
        )}

        {/* ACCIONES SUPERIORES (Dashboard o Desktop Trip) */}
        <div className="navbar-actions">
          <div className="navbar-user hide-mobile">
            <div className="avatar">{initials}</div>
            <span>{user?.email?.split('@')[0]}</span>
          </div>
          
          {!isTripPage && (
            <button className="btn-logout-mobile-top show-mobile-only" onClick={handleSignOut}>
              <LogOut size={18} />
            </button>
          )}

          <button className="btn btn-ghost navbar-logout-desktop hide-mobile" onClick={handleSignOut}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  )
}
