import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Calendar, MapPin, Plane, 
  ChevronRight, Trash2, Globe
} from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTrip, setNewTrip] = useState({ name: '', destination: '', start_date: '', end_date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTrips()
  }, [])

  async function fetchTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select('*, trip_members!inner(*)')
      .eq('trip_members.user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setTrips(data)
    setLoading(false)
  }

  async function createTrip(e) {
    e.preventDefault()
    setSaving(true)
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .insert({
        name: newTrip.name,
        destination: newTrip.destination,
        start_date: newTrip.start_date,
        end_date: newTrip.end_date,
        owner_id: user.id,
        status: 'planning'
      })
      .select()
      .single()

    if (trip) {
      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'titular',
        status: 'accepted'
      })
      setShowModal(false)
      setNewTrip({ name: '', destination: '', start_date: '', end_date: '' })
      fetchTrips()
    }
    setSaving(false)
  }

  async function deleteTrip(id, ownerId) {
    if (ownerId !== user.id) {
      alert('Solo el titular puede eliminar el viaje')
      return
    }
    if (!confirm('¿Seguro que quieres eliminar este viaje? Esta acción no se puede deshacer.')) return
    await supabase.from('trips').delete().eq('id', id)
    fetchTrips()
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      
      <div className="container dashboard-body">
        <header className="dashboard-header fade-in-up">
          <div className="dashboard-title-group">
            <h1 className="dashboard-title text-gradient">Mis Viajes</h1>
            <p className="dashboard-subtitle">Gestiona tus próximas aventuras</p>
          </div>
          <button className="btn btn-add-vibrant" onClick={() => setShowModal(true)}>
            <Plus size={22} /> Crear Nuevo Viaje
          </button>
        </header>

        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : (
          <div className="trips-grid">
            {trips.length === 0 ? (
              <div className="empty-state-card glass-card fade-in-up">
                <div className="hero-icon-glow"><Globe size={40} color="white" /></div>
                <h3>¿A dónde vamos?</h3>
                <p>Aún no tienes ningún viaje creado. ¡Empieza tu aventura hoy mismo!</p>
                <button className="btn btn-add-vibrant" onClick={() => setShowModal(true)}>
                  <Plus size={20} /> Crear mi primer viaje
                </button>
              </div>
            ) : trips.map(trip => (
              <div key={trip.id} className="trip-card glass-card fade-in-up">
                <Link to={`/trip/${trip.id}`} className="trip-card-link">
                  <div className="trip-card-cover">
                    {trip.cover_url ? (
                      <img src={trip.cover_url} alt={trip.name} />
                    ) : (
                      <div className="trip-card-cover-placeholder">
                        <Plane size={60} color="rgba(255,255,255,0.15)" />
                      </div>
                    )}
                    <div className="trip-card-status-badge">{trip.status}</div>
                  </div>
                  <div className="trip-card-content">
                    <h3 className="trip-card-name">{trip.name}</h3>
                    <div className="trip-card-meta">
                      <div className="trip-meta-item"><MapPin size={16} /> {trip.destination}</div>
                      <div className="trip-meta-item"><Calendar size={16} /> {new Date(trip.start_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </Link>
                <div className="trip-card-footer">
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/trip/${trip.id}`)}>
                    Entrar <ChevronRight size={16} />
                  </button>
                  {trip.owner_id === user.id && (
                    <button className="btn btn-ghost btn-icon btn-delete-vibrant" onClick={() => deleteTrip(trip.id, trip.owner_id)}>
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Nuevo Viaje" onClose={() => setShowModal(false)}>
          <form onSubmit={createTrip} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Nombre del viaje</label>
              <input type="text" className="form-input" required value={newTrip.name} onChange={e => setNewTrip(t => ({ ...t, name: e.target.value }))} placeholder="Ej. Eurotrip 2024" />
            </div>
            <div className="form-group">
              <label className="form-label">Destino</label>
              <input type="text" className="form-input" required value={newTrip.destination} onChange={e => setNewTrip(t => ({ ...t, destination: e.target.value }))} placeholder="Ciudad, País..." />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Fecha Inicio</label>
                <input type="date" className="form-input" required value={newTrip.start_date} onChange={e => setNewTrip(t => ({ ...t, start_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Fin</label>
                <input type="date" className="form-input" required value={newTrip.end_date} onChange={e => setNewTrip(t => ({ ...t, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn btn-add-vibrant" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={20} /> Crear Viaje Verde
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
