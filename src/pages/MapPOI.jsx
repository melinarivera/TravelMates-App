import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Map as MapIcon, MapPin, 
  ExternalLink, Navigation, Info, Search
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
    const { error } = await supabase.from('pois').insert({
      trip_id: tripId,
      user_id: user.id,
      ...form
    })

    if (!error) {
      setShowModal(false)
      setForm({ name: '', type: 'Otro', address: '', maps_url: '', notes: '' })
      fetchData()
    }
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
      <Navbar tripName={tripName} />

      <div className="container module-body">
        <header className="module-header fade-in-up">
          <div className="module-title-group">
            <div className="module-icon-box">
              <MapIcon size={32} />
            </div>
            <div>
              <h1 className="module-title text-gradient">Mapa & POI</h1>
              <p className="module-subtitle">Lugares guardados del viaje</p>
            </div>
          </div>
          {isTitular && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Añadir lugar
            </button>
          )}
        </header>

        <div className="glass-card fade-in-up delay-1" style={{ marginBottom: '2rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
              <Navigation size={24} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                 <h3 style={{ margin: 0 }}>Mapa Interactivo</h3>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>Consulta la ubicación exacta de tus puntos de interés.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${tripName}`, '_blank')}>
                Abrir en Maps
              </button>
           </div>
        </div>

        <div className="items-list fade-in-up delay-2">
          {pois.length === 0 ? (
            <div className="empty-state glass-card">
               <MapPin size={48} opacity="0.2" />
               <p>Aún no has guardado ningún lugar.</p>
            </div>
          ) : pois.map(poi => (
            <div key={poi.id} className="item-row glass-card">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <span className="expense-desc">{poi.name}</span>
                   <span className="badge badge-accent">{poi.type}</span>
                </div>
                {poi.address && <div className="expense-meta"><MapPin size={12} /> {poi.address}</div>}
                {poi.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{poi.notes}</p>}
              </div>
              
              <div className="activity-actions">
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

      {showModal && (
        <Modal title="Añadir Lugar" onClose={() => setShowModal(false)}>
          <form onSubmit={addPOI} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Nombre del lugar *</label>
              <input type="text" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Museo del Prado" />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo</label>
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
              <label className="form-label">Dirección</label>
              <input type="text" className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Enlace de Google Maps</label>
              <input type="url" className="form-input" value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))} placeholder="https://goo.gl/maps/..." />
            </div>
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>Guardar lugar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
