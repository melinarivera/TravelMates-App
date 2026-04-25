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
    await supabase.from('pois').insert({
      trip_id: tripId,
      user_id: user.id,
      ...form
    })
    setShowModal(false)
    setForm({ name: '', type: 'Otro', address: '', maps_url: '', notes: '' })
    fetchData()
    setSaving(false)
  }

  async function deletePOI(id) {
    if (!confirm('¿Eliminar?')) return
    await supabase.from('pois').delete().eq('id', id)
    fetchData()
  }

  const isTitular = myRole === 'titular'

  return (
    <div className="module-page">
      <Navbar />

      <div className="container module-body">
        <header className="module-header">
          <div className="module-title-group">
            <div className="module-icon-box">
              <MapIcon size={24} />
            </div>
            <div>
              <h1 className="module-title text-gradient">Mapa</h1>
              <p className="module-subtitle">{pois.length} sitios guardados</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo
          </button>
        </header>

        <div className="glass-card fade-in-up" style={{ marginBottom: '1.5rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Navigation size={20} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Consulta tus ubicaciones guardadas en Google Maps.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${tripName}`, '_blank')}>
                Abrir Maps
              </button>
           </div>
        </div>

        <div className="items-list">
          {pois.map(poi => (
            <div key={poi.id} className="item-row glass-card">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                   <span style={{ fontWeight: 700, color: 'white' }}>{poi.name}</span>
                   <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.6rem' }}>{poi.type}</span>
                </div>
                {poi.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} /> {poi.address}</div>}
              </div>
              
              <div className="activity-actions">
                {poi.maps_url && (
                  <a href={poi.maps_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon btn-sm" style={{ padding: '6px' }}>
                    <ExternalLink size={16} />
                  </a>
                )}
                {isTitular && (
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deletePOI(poi.id)} style={{ color: 'var(--coral)', padding: '6px' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="fab-module show-mobile-only" onClick={() => setShowModal(true)}>
        <Plus size={28} />
      </button>

      {showModal && (
        <Modal title="Lugar" onClose={() => setShowModal(false)}>
          <form onSubmit={addPOI} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Nombre del sitio</label>
              <input type="text" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Hotel o Playa" />
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
              <label className="form-label">Google Maps Link</label>
              <input type="url" className="form-input" value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
