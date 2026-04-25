import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Home, Users, DollarSign, Map, Calendar,
  LogOut, Menu, X, Plane, ChevronRight
} from 'lucide-react'
import './Navbar.css'

const tripLinks = [
  { to: '', label: 'Hub', icon: <Home size={18} /> },
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
      {/* Backdrop to close mobile menu */}
      {open && (
        <div
          className="navbar-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={() => setOpen(false)}>
            <div className="navbar-logo-icon">
              <Plane size={20} />
            </div>
            <span className="navbar-logo-text">TravelMates</span>
          </Link>

          {/* Breadcrumb in trip pages */}
          {isTripPage && tripName && (
            <div className="navbar-breadcrumb">
              <ChevronRight size={16} className="breadcrumb-sep" />
              <span className="breadcrumb-trip">{tripName}</span>
            </div>
          )}

          {/* Desktop nav links */}
          {isTripPage && (
            <div className="navbar-links">
              {tripLinks.map(link => {
                const href = `${basePath}${link.to}`
                const active = location.pathname === href
                return (
                  <Link
                    key={link.to}
                    to={href}
                    className={`navbar-link ${active ? 'active' : ''}`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="navbar-actions">
            <div className="avatar avatar-sm" title={user?.email}>{initials}</div>
            <button
              className="btn btn-ghost btn-icon navbar-logout"
              onClick={handleSignOut}
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
            <button
              className="btn btn-ghost btn-icon navbar-hamburger"
              onClick={() => setOpen(o => !o)}
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className={`navbar-mobile${open ? ' open' : ''}`}>
          {/* Dashboard link always visible */}
          <Link
            to="/"
            className={`navbar-mobile-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <Home size={18} />
            <span>Mis viajes</span>
          </Link>

          {/* Trip sub-links if inside a trip */}
          {isTripPage && tripLinks.slice(1).map(link => {
            const href = `${basePath}${link.to}`
            const active = location.pathname === href
            return (
              <Link
                key={link.to}
                to={href}
                className={`navbar-mobile-link ${active ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            )
          })}

          <div className="navbar-mobile-divider" />

          <button className="navbar-mobile-link" onClick={handleSignOut} style={{ color: 'var(--accent)' }}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>
      <div className="navbar-spacer" />
    </>
  )
}
