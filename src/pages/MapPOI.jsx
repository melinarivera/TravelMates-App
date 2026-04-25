import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Map as MapIcon, MapPin, 
  ExternalLink, Navigation, Info
} from 'lucide-react'
import './ModulePage.css'

export default function MapPOI() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [pois, setPois] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Otro', address: '', maps_url: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    setLoading(true)
    const { data: list } = await supabase.from('pois').select('*').eq('trip_id', tripId).order('created_at', { ascending: false })
    if (list) setPois(list)
    
    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)
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
            <div className="module-icon-box"><MapIcon size={28} /></div>
            <div>
              <h1 className="module-title">Mapa</h1>
              <p className="module-subtitle">Sitios para visitar</p>
            </div>
          </div>
          {/* BOTÓN VERDE ARRIBA */}
          <button className="btn btn-add-vibrant" onClick={() => setShowModal(true)}>
            <Plus size={22} /> Guardar Lugar
          </button>
        </header>

        <div className="map-list-container fade-in-up">
          {pois.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '4rem' }}>
               <Info size={48} opacity="0.1" style={{ marginBottom: '1rem' }} />
               <p>Aún no hay lugares guardados.</p>
            </div>
          ) : (
            <div className="items-list">
              {pois.map(poi => (
                <div key={poi.id} className="item-row glass-card">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                       <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'white' }}>{poi.name}</span>
                       <span className="badge-premium badge-ok">{poi.type}</span>
                    </div>
                    {poi.address && <div className="member-email" style={{ display: 'flex' }}><MapPin size={14} /> {poi.address}</div>}
                  </div>
                  
                  <div className="activity-actions">
                    {poi.maps_url && (
                      <a href={poi.maps_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ color: 'var(--badge-ok)' }}>
                        <ExternalLink size={20} />
                      </a>
                    )}
                    {isTitular && (
                      <button className="btn-delete-vibrant" onClick={() => deletePOI(poi.id)}>
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title="Guardar Sitio Verde" onClose={() => setShowModal(false)}>
          <form onSubmit={addPOI} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Nombre del lugar</label>
              <input type="text" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Enlace de Maps</label>
              <input type="url" className="form-input" value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))} placeholder="https://goo.gl/maps/..." />
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn btn-add-vibrant" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={20} /> Guardar Punto Verde
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
