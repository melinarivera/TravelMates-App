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

const STATUS_MAP = {
  planning: { label: 'PLANIFICANDO', color: '#00d4ff' }, // Azul Fluorescente
  active:   { label: 'EN CURSO',     color: '#39ff14' }, // Verde Fluorescente
  done:     { label: 'FINALIZADO',   color: '#fff' },
}

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
    const { data } = await supabase
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
    const { data: trip } = await supabase
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
    if (ownerId !== user.id) return
    if (!confirm('¿Seguro que quieres eliminar este viaje?')) return
    await supabase.from('trips').delete().eq('id', id)
    fetchTrips()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      
      <div className="container dashboard-body">
        <header className="dashboard-header fade-in-up">
          <div className="dashboard-title-group">
            <h1 className="dashboard-title text-gradient">Mis Viajes</h1>
            <p className="dashboard-subtitle">Tus próximas aventuras</p>
          </div>
          <button className="btn-add-vibrant" onClick={() => setShowModal(true)}>
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
                <h3>¿Cuál será tu próxima aventura?</h3>
                <button className="btn-add-vibrant" style={{ marginTop: '2.5rem' }} onClick={() => setShowModal(true)}>
                   Comenzar
                </button>
              </div>
            ) : trips.map(trip => {
              const status = STATUS_MAP[trip.status] || STATUS_MAP.planning
              return (
                <div key={trip.id} className="trip-card glass-card fade-in-up">
                  <div className="trip-card-cover">
                    {trip.cover_url ? (
                      <img src={trip.cover_url} alt={trip.name} />
                    ) : (
                      <div className="trip-card-cover-placeholder">
                        <Plane size={70} color="rgba(255,255,255,0.15)" />
                      </div>
                    )}
                    <div className="trip-card-status-badge" style={{ 
                      color: status.color, 
                      borderColor: status.color,
                      backgroundColor: status.color + '26' /* 15% opacity */
                    }}>
                      {status.label}
                    </div>
                  </div>
                  
                  <div className="trip-card-content">
                    <h3 className="trip-card-name">{trip.name}</h3>
                    <div className="trip-card-meta">
                      <div className="trip-meta-item"><MapPin size={20} /> {trip.destination}</div>
                      <div className="trip-meta-item">
                        <Calendar size={20} /> 
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </div>
                    </div>
                  </div>

                  <div className="trip-card-footer">
                    <button className="btn-entrar" onClick={() => navigate(`/trip/${trip.id}`)}>
                      Entrar <ChevronRight size={18} />
                    </button>
                    {trip.owner_id === user.id && (
                      <button className="btn-delete-vibrant" onClick={(e) => { e.preventDefault(); deleteTrip(trip.id, trip.owner_id); }}>
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Crear Nuevo Viaje" onClose={() => setShowModal(false)}>
          <form onSubmit={createTrip} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Nombre del viaje</label>
              <input type="text" className="form-input" required value={newTrip.name} onChange={e => setNewTrip(t => ({ ...t, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Destino</label>
              <input type="text" className="form-input" required value={newTrip.destination} onChange={e => setNewTrip(t => ({ ...t, destination: e.target.value }))} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Inicio</label>
                <input type="date" className="form-input" required value={newTrip.start_date} onChange={e => setNewTrip(t => ({ ...t, start_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fin</label>
                <input type="date" className="form-input" required value={newTrip.end_date} onChange={e => setNewTrip(t => ({ ...t, end_date: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn-add-vibrant" disabled={saving} style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
              Confirmar
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
