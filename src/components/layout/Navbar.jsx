import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Home, Users, DollarSign, Map, Calendar,
  LogOut, Menu, X, Plane, ChevronRight
} from 'lucide-react'
import './Navbar.css'

const tripLinks = [
  { to: '', label: 'Inicio', icon: <Home size={18} /> },
  { to: '/members', label: 'Integrantes', icon: <Users size={18} /> },
  { to: '/expenses', label: 'Gastos', icon: <DollarSign size={18} /> },
  { to: '/itinerary', label: 'Itinerario', icon: <Calendar size={18} /> },
  { to: '/map', label: 'Mapa', icon: <Map size={18} /> },
]

export default function Navbar({ tripName }) {
  const { user, signOut } = useAuth()
  const { tripId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const isTripPage = Boolean(tripId)
  const basePath = isTripPage ? `/trip/${tripId}` : ''

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    navigate('/auth')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'TM'

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={() => setOpen(false)}>
            <div className="navbar-logo-icon">
              <Plane size={20} color="white" />
            </div>
            <span>TravelMates</span>
          </Link>

          {/* Desktop Links */}
          {isTripPage && (
            <div className="navbar-links">
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

          {/* Actions */}
          <div className="navbar-actions">
            <div className="navbar-user">
              <div className="avatar">{initials}</div>
              <span className="hide-mobile">{user?.email?.split('@')[0]}</span>
            </div>
            
            <button className="navbar-hamburger" onClick={() => setOpen(true)}>
              <Menu size={24} />
            </button>

            <button className="btn btn-ghost navbar-logout-desktop" onClick={handleSignOut} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Fullscreen Mobile Menu */}
      <div className={`navbar-mobile ${open ? 'open' : ''}`}>
        <div className="navbar-mobile-header">
          <div className="navbar-logo">
             <div className="navbar-logo-icon">
                <Plane size={20} color="white" />
              </div>
              <span>TravelMates</span>
          </div>
          <button className="navbar-hamburger" onClick={() => setOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="navbar-mobile-links">
          <Link to="/" className={`navbar-mobile-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setOpen(false)}>
            <Home size={22} />
            <span>Mis viajes</span>
          </Link>

          {isTripPage && tripLinks.map(link => {
            const href = `${basePath}${link.to}`
            const active = location.pathname === href
            return (
              <Link key={link.to} to={href} className={`navbar-mobile-link ${active ? 'active' : ''}`} onClick={() => setOpen(false)}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="navbar-mobile-footer">
          <button className="btn-logout-mobile" onClick={handleSignOut}>
            <LogOut size={22} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  )
}
