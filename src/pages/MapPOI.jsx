import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Map as MapIcon, MapPin, 
  ExternalLink, Navigation
} from 'lucide-react'
import './ModulePage.css'

export default function MapPOI() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [pois, setPois] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [tripName, setTripName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Otro', address: '', maps_url: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    setLoading(true)
    const { data: trip } = await supabase.from('trips').select('name').eq('id', tripId).single()
    if (trip) setTripName(trip.name)

    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)

    const { data: list } = await supabase.from('pois').select('*').eq('trip_id', tripId).order('created_at', { ascending: false })
    if (list) setPois(list)
    setLoading(false)
  }

  async function addPOI(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('pois').insert({ trip_id: tripId, user_id: user.id, ...form })
    setShowModal(false)
    setForm({ name: '', type: 'Otro', address: '', maps_url: '', notes: '' })
    fetchData()
    setSaving(false)
  }

  async function deletePOI(id) {
    if (!confirm('¿Eliminar lugar?')) return
    await supabase.from('pois').delete().eq('id', id)
    fetchData()
  }

  const isTitular = myRole === 'titular'

  return (
    <div className="module-page">
      <Navbar />

      <div className="container module-body">
        <header className="module-header fade-in-up">
          <div className="module-title-group">
            <div className="module-icon-box">
              <MapIcon size={28} />
            </div>
            <div>
              <h1 className="module-title">Mapa</h1>
              <p className="module-subtitle">Ubicaciones del viaje</p>
            </div>
          </div>
          <button className="btn btn-add-desktop hide-mobile" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Guardar Lugar
          </button>
        </header>

        <div className="glass-card fade-in-up" style={{ padding: '2.5rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
           <div className="hero-icon-glow" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
              <Navigation size={28} color="white" />
           </div>
           <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Explorar en Google Maps</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Accede a todas tus ubicaciones guardadas en la aplicación de mapas oficial.</p>
           </div>
           <button className="btn btn-secondary" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${tripName}`, '_blank')}>
             Abrir Maps
           </button>
        </div>

        <div className="items-list fade-in-up">
          {pois.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '4rem' }}>
               <p>Aún no has guardado ningún lugar.</p>
            </div>
          ) : pois.map(poi => (
            <div key={poi.id} className="item-row glass-card" style={{ padding: '1.5rem 2rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                   <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'white' }}>{poi.name}</span>
                   <span className="badge" style={{ background: 'var(--primary)', border: 'none' }}>{poi.type}</span>
                </div>
                {poi.address && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {poi.address}</div>}
              </div>
              
              <div className="activity-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                {poi.maps_url && (
                  <a href={poi.maps_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon" title="Ver en Google Maps">
                    <ExternalLink size={20} />
                  </a>
                )}
                {isTitular && (
                  <button className="btn btn-ghost btn-icon" onClick={() => deletePOI(poi.id)} style={{ color: 'var(--coral)' }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB Mobile Only */}
      <button className="fab-module show-mobile-only" onClick={() => setShowModal(true)}>
        <Plus size={32} />
      </button>

      {showModal && (
        <Modal title="Guardar Lugar" onClose={() => setShowModal(false)}>
          <form onSubmit={addPOI} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Nombre del lugar</label>
              <input type="text" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Hotel, Playa, Restaurante..." />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                 <option value="Restaurante">Restaurante</option>
                 <option value="Museo">Museo</option>
                 <option value="Alojamiento">Alojamiento</option>
                 <option value="Parque">Parque</option>
                 <option value="Compras">Compras</option>
                 <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección (opcional)</label>
              <input type="text" className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Link de Google Maps</label>
              <input type="url" className="form-input" value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
