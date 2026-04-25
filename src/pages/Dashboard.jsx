import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import {
  Plus, Plane, MapPin, Calendar, Users,
  Clock, ChevronRight, Search, Globe, Check,
  Camera, Image as ImageIcon, Briefcase
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
  const [form, setForm] = useState({ name: '', destination: '', start_date: '', end_date: '', description: '', cover_url: '' })
  const [creating, setCreating] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

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

    if (!error) fetchTrips()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setForm(f => ({ ...f, cover_url: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  async function createTrip(e) {
    e.preventDefault()
    setCreating(true)

    const tripData = {
      ...form,
      owner_id: user.id,
      status: 'planning',
      start_date: form.start_date || null,
      end_date: form.end_date || null
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single()

    if (tripError) {
      console.error('Error creating trip:', tripError)
      alert(`Error: ${tripError.message}`)
      setCreating(false)
      return
    }

    if (trip) {
      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'titular',
        status: 'accepted',
      })
      
      setShowModal(false)
      setForm({ name: '', destination: '', start_date: '', end_date: '', description: '', cover_url: '' })
      setImagePreview(null)
      fetchTrips()
      navigate(`/trip/${trip.id}`)
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

      <section className="dashboard-hero">
        <div className="container">
          <div className="dashboard-hero-content fade-in-up">
            <div className="dashboard-greeting">
              <div className="hero-icon-glow">
                <Plane size={48} color="white" />
              </div>
              <div>
                <h1 className="dashboard-title text-gradient">¡Hola, aventurero!</h1>
                <p className="dashboard-subtitle">Tus próximas aventuras te están esperando</p>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
              <Plus size={20} /> Nuevo viaje
            </button>
          </div>

          <div className="dashboard-search fade-in-up delay-1">
            <Search size={20} className="dashboard-search-icon" />
            <input
              type="search"
              placeholder="Buscar destinos o viajes..."
              className="dashboard-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container dashboard-body">
        {loading ? (
          <div className="dashboard-loading">
            {[1,2,3].map(i => (
              <div key={i} className="trip-card-skeleton glass-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state fade-in-up">
            <div className="empty-state-icon">
              <Briefcase size={48} color="var(--text-muted)" />
            </div>
            <h3 className="empty-state-title">
              {search ? 'No encontramos ese viaje' : '¡Crea tu primer viaje!'}
            </h3>
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
                  <Clock size={22} color="var(--sun)" /> Invitaciones
                </h2>
                <div className="trips-grid">
                  {invitations.map((trip, i) => (
                    <TripCard key={trip.id} trip={trip} index={i} isInvitation onAccept={() => handleInvitation(trip.id, 'accepted')} onReject={() => handleInvitation(trip.id, 'rejected')} />
                  ))}
                </div>
              </section>
            )}

            {myTrips.length > 0 && (
              <section className="dashboard-section fade-in-up">
                <h2 className="dashboard-section-title">
                  <Plane size={22} color="var(--primary)" /> Mis viajes
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
                  <Globe size={22} color="var(--accent)" /> Viajes donde participo
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

      {showModal && (
        <Modal title="Nuevo Viaje" onClose={() => setShowModal(false)}>
          <form onSubmit={createTrip} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Nombre del viaje *</label>
              <input type="text" className="form-input" placeholder="Ej. Verano en la Montaña" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Destino *</label>
              <div className="form-input-with-icon">
                <MapPin size={18} className="input-icon" />
                <input type="text" className="form-input" placeholder="Barcelona, España" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required />
              </div>
            </div>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Fecha inicio</label>
                <input type="date" className="form-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha fin</label>
                <input type="date" className="form-input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Foto de portada</label>
              <div className="file-upload-box" onClick={() => document.getElementById('file-input').click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="file-preview" />
                ) : (
                  <div className="file-upload-placeholder">
                    <Camera size={32} color="var(--text-muted)" />
                    <span>Seleccionar foto (JPG, PNG)</span>
                  </div>
                )}
                <input type="file" id="file-input" hidden accept="image/*" onChange={handleFileChange} />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <div className="spinner" /> : <><Plus size={18} /> Crear viaje</>}
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
    <div className={`trip-card glass-card fade-in-up delay-${Math.min(index + 1, 5)} ${isInvitation ? 'trip-card-invitation' : ''}`} onClick={isInvitation ? null : onClick}>
      <div className="trip-card-cover">
        {trip.cover_url ? (
          <img src={trip.cover_url} alt={trip.name} />
        ) : (
          <div className="trip-card-cover-placeholder" style={{ background: status.grad }}>
             <ImageIcon size={48} color="white" opacity="0.3" />
          </div>
        )}
        <div className={`badge ${status.badge} trip-card-badge`}>
          {isInvitation ? 'Invitación' : status.label}
        </div>
      </div>
      <div className="trip-card-body">
        <h3 className="trip-card-name">{trip.name}</h3>
        <div className="trip-card-meta">
          <MapPin size={14} />
          <span>{trip.destination || 'Destino'}</span>
        </div>
        
        {isInvitation ? (
          <div className="invitation-buttons">
            <button className="btn btn-primary btn-sm" onClick={onAccept}>Aceptar</button>
            <button className="btn btn-secondary btn-sm" onClick={onReject}>Declinar</button>
          </div>
        ) : (
          <div className="trip-card-footer">
            <div className="trip-card-meta">
              <Calendar size={14} />
              <span>{trip.start_date ? new Date(trip.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Próximamente'}</span>
            </div>
            <ChevronRight size={20} color="var(--primary)" />
          </div>
        )}
      </div>
    </div>
  )
}
