import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { Plus, MapPin, Trash2, Star, Navigation, ExternalLink } from 'lucide-react'
import './ModulePage.css'

const POI_TYPES = ['Restaurante', 'Museo', 'Playa', 'Parque', 'Hotel', 'Compras', 'Transporte', 'Otro']

export default function MapPOI() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [pois, setPois] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [tripName, setTripName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState('Todos')
  const [form, setForm] = useState({ name: '', type: 'Otro', address: '', lat: '', lng: '', notes: '', maps_url: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    const { data: trip } = await supabase.from('trips').select('name').eq('id', tripId).single()
    if (trip) setTripName(trip.name)
    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)
    const { data } = await supabase
      .from('pois')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    if (data) setPois(data)
    setLoading(false)
  }

  async function addPOI(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('pois').insert({
      ...form,
      trip_id: tripId,
      user_id: user.id,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
    })
    setShowModal(false)
    setForm({ name: '', type: 'Otro', address: '', lat: '', lng: '', notes: '', maps_url: '' })
    fetchData()
    setSaving(false)
  }

  async function deletePOI(id) {
    await supabase.from('pois').delete().eq('id', id)
    fetchData()
  }

  const isTitular = myRole === 'titular'
  const types = ['Todos', ...POI_TYPES]
  const filtered = filterType === 'Todos' ? pois : pois.filter(p => p.type === filterType)

  return (
    <div className="module-page">
      <Navbar tripName={tripName} />
      <div className="container module-body">
        <div className="module-header fade-in-up">
          <div className="module-header-icon" style={{ background: 'var(--grad-map)' }}>
            <MapPin size={32} color="white" />
          </div>
          <div>
            <h1 className="module-title">Mapa & Puntos de Interés</h1>
            <p className="module-subtitle">{pois.length} lugares guardados</p>
          </div>
          {isTitular && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }} id="add-poi-btn">
              <Plus size={18} /> Añadir lugar
            </button>
          )}
        </div>

        {/* Map embed placeholder */}
        <div className="map-embed-card glass fade-in-up delay-1">
          <div className="map-embed-placeholder">
            <div className="map-compass"><Navigation size={32} /></div>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--gray-700)' }}>Mapa interactivo</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
                Integra Google Maps o Leaflet con las coordenadas de los POI
              </p>
            </div>
          </div>
          {pois.length > 0 && pois[0].lat && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${pois[0].lat},${pois[0].lng}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sky btn-sm"
            >
              <Navigation size={14} /> Ver en Google Maps
            </a>
          )}
        </div>

        {/* Filter chips */}
        <div className="poi-filters fade-in-up delay-2">
          {types.map(t => (
            <button
              key={t}
              className={`chip ${filterType === t ? 'active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* POI list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><MapPin size={40} /></div>
            <h3 className="empty-state-title">Sin lugares añadidos</h3>
            <p className="empty-state-text">Todos los integrantes pueden sugerir puntos de interés</p>
          </div>
        ) : (
          <div className="pois-list fade-in-up delay-3">
            {filtered.map((poi, i) => (
              <div key={poi.id} className={`poi-card glass fade-in-up delay-${Math.min(i+1, 5)}`}>
                <div className="poi-emoji"><MapPin size={24} /></div>
                <div className="poi-info">
                  <div className="poi-name">{poi.name}</div>
                  <div className="poi-meta">
                    <span className="badge badge-sky">{poi.type}</span>
                    {poi.address && <span style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}><MapPin size={12} /> {poi.address}</span>}
                  </div>
                  {poi.notes && <p className="poi-notes">{poi.notes}</p>}
                </div>
                <div className="poi-actions">
                  {poi.maps_url && (
                    <a href={poi.maps_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon btn-sm">
                      <ExternalLink size={15} />
                    </a>
                  )}
                  {poi.lat && poi.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${poi.lat},${poi.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sky btn-sm"
                    >
                      <Navigation size={14} />
                    </a>
                  )}
                  {isTitular && (
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deletePOI(poi.id)}>
                      <Trash2 size={15} style={{ color: 'var(--accent)' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="📍 Añadir lugar" onClose={() => setShowModal(false)}>
          <form onSubmit={addPOI} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="poi-name">Nombre del lugar *</label>
              <input id="poi-name" type="text" className="form-input" placeholder="Sagrada Família"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="poi-type">Tipo</label>
                <select id="poi-type" className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {POI_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="poi-address">Dirección</label>
                <input id="poi-address" type="text" className="form-input" placeholder="C/ Mallorca, Barcelona"
                  value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="poi-lat">Latitud</label>
                <input id="poi-lat" type="number" step="any" className="form-input" placeholder="41.4036"
                  value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="poi-lng">Longitud</label>
                <input id="poi-lng" type="number" step="any" className="form-input" placeholder="2.1744"
                  value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="poi-maps">Link de Google Maps</label>
              <input id="poi-maps" type="url" className="form-input" placeholder="https://maps.google.com/..."
                value={form.maps_url} onChange={e => setForm(f => ({ ...f, maps_url: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="poi-notes">Notas</label>
              <textarea id="poi-notes" className="form-input form-textarea" placeholder="Reservar con antelación..."
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving} id="confirm-poi-btn">
                {saving ? <div className="spinner" /> : <><Plus size={16} /> Guardar Lugar</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
