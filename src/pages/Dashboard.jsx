import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import {
  Plus, Plane, MapPin, Calendar, Users,
  Clock, ChevronRight, Search, Globe, Check
} from 'lucide-react'
import './Dashboard.css'

const STATUS_MAP = {
  planning: { label: 'Planificando', icon: <Clock size={20} />, badge: 'badge-sun', grad: 'var(--grad-itinerary)' },
  active:   { label: 'En curso',     icon: <Plane size={20} />, badge: 'badge-sky', grad: 'var(--grad-primary)' },
  done:     { label: 'Finalizado',   icon: <Check size={20} />, badge: 'badge-slate', grad: 'var(--grad-map)' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', destination: '', start_date: '', end_date: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTrips()
  }, [user])

  async function fetchTrips() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trip_members')
      .select('status, role, trip:trips(*)')
      .eq('user_id', user.id)
      .order('created_at', { foreignTable: 'trips', ascending: false })

    if (!error && data) {
      // Map the data to include the membership info inside the trip object
      const mapped = data.map(d => ({
        ...d.trip,
        membership_status: d.status,
        membership_role: d.role
      })).filter(t => t.id)
      setTrips(mapped)
    }
    setLoading(false)
  }

  async function handleInvitation(tripId, status) {
    const { error } = await supabase
      .from('trip_members')
      .update({ status })
      .eq('trip_id', tripId)
      .eq('user_id', user.id)

    if (!error) {
      fetchTrips()
    }
  }

  async function createTrip(e) {
    e.preventDefault()
    setCreating(true)

    // Sanitize dates: empty strings should be null
    const tripData = {
      ...form,
      owner_id: user.id,
      status: 'planning',
      start_date: form.start_date || null,
      end_date: form.end_date || null
    }

    // Insert the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single()

    if (tripError) {
      console.error('Error creating trip:', tripError)
      alert(`Error al crear el viaje: ${tripError.message}\nVerifica que hayas ejecutado el SQL en Supabase.`)
      setCreating(false)
      return
    }

    if (trip) {
      const { error: memberError } = await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'titular',
        status: 'accepted',
      })
      
      if (memberError) {
        console.error('Error adding member:', memberError)
        alert(`Viaje creado, pero hubo un error al añadirte como miembro: ${memberError.message}`)
      }

      setShowModal(false)
      setForm({ name: '', destination: '', start_date: '', end_date: '', description: '' })
      fetchTrips()
      // Wait a tiny bit to show success before navigating
      setTimeout(() => {
        navigate(`/trip/${trip.id}`)
      }, 100)
    }
    setCreating(false)
  }

  const filtered = trips.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.destination?.toLowerCase().includes(search.toLowerCase())
  )

  const myTrips = filtered.filter(t => t.owner_id === user.id)
  const invitations = filtered.filter(t => t.owner_id !== user.id && t.membership_status === 'pending')
  const guestTrips = filtered.filter(t => t.owner_id !== user.id && t.membership_status === 'accepted')

  return (
    <div className="dashboard-page">
      <Navbar />

      {/* Hero header */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-bg" />
        <div className="container">
          <div className="dashboard-hero-content fade-in-up">
            <div className="dashboard-greeting">
              <span className="dashboard-wave">👋</span>
              <div>
                <h1 className="dashboard-title">¡Hola, aventurero!</h1>
                <p className="dashboard-subtitle">Tus próximas aventuras te están esperando</p>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowModal(true)}
              id="create-trip-btn"
            >
              <Plus size={20} /> Nuevo viaje
            </button>
          </div>

          {/* Search */}
          <div className="dashboard-search fade-in-up delay-1">
            <Search size={20} className="dashboard-search-icon" />
            <input
              type="search"
              placeholder="Buscar destinos o viajes..."
              className="dashboard-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="dashboard-search"
            />
          </div>
        </div>
      </section>

      <div className="container dashboard-body">
        {loading ? (
          <div className="dashboard-loading">
            {[1,2,3].map(i => (
              <div key={i} className="trip-card-skeleton">
                <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="skeleton" style={{ height: 20, width: '60%' }} />
                  <div className="skeleton" style={{ height: 14, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state fade-in-up">
            <div className="empty-state-icon">✈️</div>
            <h3 className="empty-state-title">
              {search ? 'No encontramos ese viaje' : '¡Crea tu primer viaje!'}
            </h3>
            <p className="empty-state-text">
              {search
                ? 'Prueba con otro término de búsqueda'
                : 'Planifica una aventura increíble con tu familia o amigos'}
            </p>
            {!search && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={18} /> Crear viaje
              </button>
            )}
          </div>
        ) : (
          <>
            {invitations.length > 0 && (
              <section className="dashboard-section fade-in-up">
                <h2 className="dashboard-section-title">
                  <Clock size={22} style={{ color: 'var(--sun-dk)' }} /> Invitaciones nuevas
                </h2>
                <div className="trips-grid">
                  {invitations.map((trip, i) => (
                    <TripCard 
                      key={trip.id} 
                      trip={trip} 
                      index={i} 
                      isInvitation
                      onAccept={() => handleInvitation(trip.id, 'accepted')}
                      onReject={() => handleInvitation(trip.id, 'rejected')}
                    />
                  ))}
                </div>
              </section>
            )}

            {myTrips.length > 0 && (
              <section className="dashboard-section fade-in-up">
                <h2 className="dashboard-section-title">
                  <Plane size={22} /> Mis viajes
                </h2>
                <div className="trips-grid">
                  {myTrips.map((trip, i) => (
                    <TripCard key={trip.id} trip={trip} index={i} onClick={() => navigate(`/trip/${trip.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {guestTrips.length > 0 && (
              <section className="dashboard-section fade-in-up">
                <h2 className="dashboard-section-title">
                  <Globe size={22} /> Viajes donde participo
                </h2>
                <div className="trips-grid">
                  {guestTrips.map((trip, i) => (
                    <TripCard key={trip.id} trip={trip} index={i} onClick={() => navigate(`/trip/${trip.id}`)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Create trip modal */}
      {showModal && (
        <Modal title="🌍 Nuevo Viaje" onClose={() => setShowModal(false)}>
          <form onSubmit={createTrip} className="create-trip-form">
            <div className="form-group">
              <label className="form-label" htmlFor="trip-name">Nombre del viaje *</label>
              <input
                id="trip-name"
                type="text"
                className="form-input"
                placeholder="Verano en la Costa ☀️"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="trip-destination">Destino *</label>
              <div className="form-input-icon">
                <MapPin size={18} className="input-icon" />
                <input
                  id="trip-destination"
                  type="text"
                  className="form-input"
                  placeholder="Barcelona, España"
                  value={form.destination}
                  onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-start">Fecha inicio</label>
                <input
                  id="trip-start"
                  type="date"
                  className="form-input"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="trip-end">Fecha fin</label>
                <input
                  id="trip-end"
                  type="date"
                  className="form-input"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="trip-desc">Descripción</label>
              <textarea
                id="trip-desc"
                className="form-input form-textarea"
                placeholder="¡Una aventura épica que nunca olvidaremos!"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating} id="confirm-create-trip">
                {creating ? <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> : <><Plus size={18} /> Crear viaje</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function TripCard({ trip, onClick, index, isInvitation, onAccept, onReject }) {
  const status = STATUS_MAP[trip.status] || STATUS_MAP.planning
  const daysLeft = trip.start_date
    ? Math.ceil((new Date(trip.start_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div
      className={`trip-card fade-in-up delay-${Math.min(index + 1, 5)} ${isInvitation ? 'trip-card-invitation' : ''}`}
      onClick={isInvitation ? null : onClick}
      id={`trip-card-${trip.id}`}
    >
      <div className="trip-card-cover" style={{ background: status.grad }}>
        <div className="trip-card-icon">{status.icon}</div>
        <div className={`badge ${status.badge} trip-card-badge`}>
          {isInvitation ? 'Nueva invitación' : status.label}
        </div>
      </div>
      <div className="trip-card-body">
        <h3 className="trip-card-name">{trip.name}</h3>
        <div className="trip-card-meta">
          <MapPin size={14} />
          <span>{trip.destination || 'Destino pendiente'}</span>
        </div>
        
        {isInvitation ? (
          <div className="invitation-actions">
            <p className="invitation-text">¿Te unes a este viaje?</p>
            <div className="invitation-buttons">
              <button className="btn btn-primary btn-sm" onClick={onAccept}>¡Claro! ✈️</button>
              <button className="btn btn-ghost btn-sm" onClick={onReject}>Ahora no</button>
            </div>
          </div>
        ) : (
          <>
            {trip.start_date && (
              <div className="trip-card-meta">
                <Calendar size={14} />
                <span>{new Date(trip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {daysLeft > 0 && <span className="trip-days-left">en {daysLeft}d</span>}
              </div>
            )}
            <div className="trip-card-footer">
              <span className="trip-card-open">
                Ver viaje <ChevronRight size={16} />
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
