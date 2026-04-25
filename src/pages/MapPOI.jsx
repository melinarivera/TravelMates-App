import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Map as MapIcon, MapPin, 
  Navigation, Search, Tag, Link as LinkIcon
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
          <button className="btn-add-vibrant" onClick={() => setShowModal(true)}>
            <Plus size={22} /> Añadir
          </button>
        </header>

        <div className="map-list-container fade-in-up" style={{ marginTop: '3rem' }}>
          {loading ? <div className="page-loading"><div className="spinner" /></div> : (
            pois.length === 0 ? (
              <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', opacity: 0.6 }}>
                 <MapPin size={48} style={{ marginBottom: '1.5rem', color: '#00f2ff' }} />
                 <p style={{ fontSize: '1.2rem' }}>Aún no hay sitios guardados.</p>
              </div>
            ) : (
              <div className="items-list">
                {pois.map(poi => (
                  <div key={poi.id} className="item-row glass-card poi-card">
                    <div className="poi-header">
                      <div className="poi-title-box">
                        <div className="poi-name">
                          <MapPin size={22} style={{ color: '#00f2ff' }} />
                          {poi.name}
                        </div>
                        <div style={{ marginTop: '0.3rem' }}>
                          <span className="poi-badge">{poi.type}</span>
                        </div>
                      </div>
                      {isTitular && (
                        <button className="btn-delete-vibrant" onClick={() => deletePOI(poi.id)}>
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                    
                    {poi.address && (
                      <div className="poi-address">
                        <Search size={14} /> {poi.address}
                      </div>
                    )}

                    <div className="poi-actions">
                      {poi.maps_url ? (
                        <a href={poi.maps_url} target="_blank" rel="noreferrer" className="btn-open-maps">
                          <Navigation size={18} /> Ver en Maps
                        </a>
                      ) : <div />}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {showModal && (
        <Modal title="Añadir Lugar" onClose={() => setShowModal(false)}>
          <form onSubmit={addPOI} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Nombre del sitio</label>
              <div className="form-input-container">
                <MapPin className="form-input-icon" size={20} />
                <input type="text" className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Torre Eiffel..." />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">¿Qué tipo de sitio es?</label>
              <div className="form-input-container">
                <Tag className="form-input-icon" size={20} />
                <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="Museo">Museo 🖼️</option>
                  <option value="Restaurante">Restaurante 🍽️</option>
                  <option value="Monumento">Monumento 🗽</option>
                  <option value="Parque">Parque 🌳</option>
                  <option value="Tienda">Tienda 🛍️</option>
                  <option value="Otro">Otro ✨</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Enlace de Google Maps</label>
              <div className="form-input-container">
                <LinkIcon className="form-input-icon" size={20} />
                <input type="url" className="form-input" value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))} placeholder="Pega el link de Maps aquí..." />
              </div>
            </div>

            <button type="submit" className="btn-add-vibrant" disabled={saving} style={{ width: '100%', marginTop: '1rem', height: '60px', fontSize: '1.1rem', justifyContent: 'center' }}>
              <Plus size={22} /> Añadir al Mapa
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
