import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { Plus, Trash2, Edit3, Calendar, Clock, MapPin, Check, X, ThumbsUp, ThumbsDown } from 'lucide-react'
import './ModulePage.css'

export default function Itinerary() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [days, setDays] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [tripName, setTripName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editActivity, setEditActivity] = useState(null)
  const [form, setForm] = useState({ day_date: '', time: '', title: '', location: '', description: '', type: 'activity', source: 'manual' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    const { data: trip } = await supabase.from('trips').select('name').eq('id', tripId).single()
    if (trip) setTripName(trip.name)

    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)

    const { data: acts } = await supabase
      .from('itinerary_activities')
      .select('*, activity_votes(vote)')
      .eq('trip_id', tripId)
      .order('day_date')
      .order('time')
    if (acts) {
      // Group by day
      const grouped = acts.reduce((acc, act) => {
        const day = act.day_date || 'Sin fecha'
        if (!acc[day]) acc[day] = []
        acc[day].push(act)
        return acc
      }, {})
      setDays(Object.entries(grouped).map(([date, activities]) => ({ date, activities })))
    } else {
      setDays([])
    }
    setLoading(false)
  }

  async function saveActivity(e) {
    e.preventDefault()
    setSaving(true)
    const source = isTitular ? 'manual' : 'voting'
    if (editActivity) {
      await supabase.from('itinerary_activities').update({ ...form, source }).eq('id', editActivity.id)
    } else {
      await supabase.from('itinerary_activities').insert({ ...form, source, trip_id: tripId, user_id: user.id })
    }
    setShowModal(false)
    setEditActivity(null)
    setForm({ day_date: '', time: '', title: '', location: '', description: '', type: 'activity', source: 'manual' })
    fetchData()
    setSaving(false)
  }

  async function deleteActivity(id) {
    await supabase.from('itinerary_activities').delete().eq('id', id)
    fetchData()
  }

  async function vote(actId, vote) {
    await supabase.from('activity_votes').upsert({ activity_id: actId, user_id: user.id, vote })
    fetchData()
  }
  async function approveActivity(id) {
    await supabase.from('itinerary_activities').update({ source: 'manual' }).eq('id', id)
    fetchData()
  }

  const isTitular = myRole === 'titular'
  const openAdd = (date = '') => {
    setEditActivity(null)
    setForm({ day_date: date, time: '', title: '', location: '', description: '', type: 'activity', source: 'manual' })
    setShowModal(true)
  }
  const openEdit = (act) => {
    setEditActivity(act)
    setForm({ day_date: act.day_date || '', time: act.time || '', title: act.title, location: act.location || '', description: act.description || '', type: act.type || 'activity', source: act.source || 'manual' })
    setShowModal(true)
  }

  const TYPE_COLORS = { activity: 'var(--accent)', food: 'var(--sun)', transport: 'var(--slate)', accommodation: 'var(--mint)' }
  const TYPE_ICONS  = { activity: <Calendar size={18} />, food: <DollarSign size={18} />, transport: <MapPin size={18} />, accommodation: <Plus size={18} /> }

  return (
    <div className="module-page">
      <Navbar tripName={tripName} />
      <div className="container module-body">
        <div className="module-header fade-in-up">
          <div className="module-header-icon" style={{ background: 'var(--grad-itinerary)' }}>
            <Calendar size={32} color="white" />
          </div>
          <div>
            <h1 className="module-title">Itinerario</h1>
            <p className="module-subtitle">{days.length} días planificados</p>
          </div>
          <button className="btn btn-primary" onClick={() => openAdd()} style={{ marginLeft: 'auto' }} id="add-activity-btn">
            <Plus size={18} /> {isTitular ? 'Añadir actividad' : 'Proponer actividad'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : days.length === 0 ? (
          <div className="empty-state fade-in-up">
            <div className="empty-state-icon"><Calendar size={40} /></div>
            <h3 className="empty-state-title">Itinerario vacío</h3>
            <p className="empty-state-text">
              {isTitular ? 'Añade las primeras actividades del viaje' : 'El titular añadirá las actividades pronto'}
            </p>
            <button className="btn btn-primary" onClick={() => openAdd()}>
              <Plus size={18} /> {isTitular ? 'Primera actividad' : 'Proponer actividad'}
            </button>
          </div>
        ) : (
          <div className="itinerary-days fade-in-up delay-1">
            {days.map(({ date, activities }, di) => (
              <div key={date} className={`itinerary-day fade-in-up delay-${Math.min(di + 1, 5)}`}>
                <div className="itinerary-day-header">
                  <div className="itinerary-day-badge">
                    <Calendar size={16} />
                    <span>
                      {date !== 'Sin fecha'
                        ? new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                        : 'Sin fecha asignada'}
                    </span>
                  </div>
                  {isTitular && (
                    <button className="btn btn-ghost btn-sm" onClick={() => openAdd(date)}>
                      <Plus size={16} /> {isTitular ? 'Actividad' : 'Propuesta'}
                    </button>
                  )}
                </div>

                <div className="itinerary-activities">
                  {activities.map(act => {
                    const icon = TYPE_ICONS[act.type] || <Calendar size={18} />
                    const color = TYPE_COLORS[act.type] || 'var(--accent)'
                    return (
                      <div key={act.id} className="activity-card glass">
                        <div className="activity-type-dot" style={{ background: color }} />
                        <div className="activity-body">
                          <div className="activity-top">
                            <span className="activity-emoji" style={{ color }}>{icon}</span>
                            <div className="activity-info">
                              <div className="activity-title">{act.title}</div>
                              <div className="activity-meta">
                                {act.time && <span><Clock size={12} />{act.time}</span>}
                                {act.location && <span><MapPin size={12} />{act.location}</span>}
                              </div>
                            </div>
                            {act.source === 'voting' && (
                              <span className="badge badge-sky" style={{ fontSize: '0.72rem' }}>Por votación</span>
                            )}
                          </div>
                          {act.description && <p className="activity-desc">{act.description}</p>}
                        </div>
                        <div className="activity-actions">
                          {isTitular && (
                            <>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(act)}>
                                <Edit3 size={15} />
                              </button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteActivity(act.id)}>
                                <Trash2 size={15} style={{ color: 'var(--accent)' }} />
                              </button>
                            </>
                          )}
                          <div className="vote-section">
                            <button className="vote-btn vote-up" onClick={() => vote(act.id, 'up')} title="Me gusta">
                              <ThumbsUp size={14} />
                              <span className="vote-count">{act.activity_votes?.filter(v => v.vote === 'up').length || 0}</span>
                            </button>
                            <button className="vote-btn vote-down" onClick={() => vote(act.id, 'down')} title="No me gusta">
                              <ThumbsDown size={14} />
                              <span className="vote-count">{act.activity_votes?.filter(v => v.vote === 'down').length || 0}</span>
                            </button>
                          </div>
                          {isTitular && act.source === 'voting' && (
                            <button className="btn btn-primary btn-sm" onClick={() => approveActivity(act.id)}>
                              Aprobar
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editActivity ? 'Editar Actividad' : 'Nueva Actividad'} onClose={() => { setShowModal(false); setEditActivity(null) }}>
          <form onSubmit={saveActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="act-title">Título *</label>
              <input id="act-title" type="text" className="form-input" placeholder="Visita al museo"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="act-date">Fecha</label>
                <input id="act-date" type="date" className="form-input"
                  value={form.day_date} onChange={e => setForm(f => ({ ...f, day_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="act-time">Hora</label>
                <input id="act-time" type="time" className="form-input"
                  value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="act-location">Lugar</label>
                <input id="act-location" type="text" className="form-input" placeholder="Plaza Mayor"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="act-type">Tipo</label>
                <select id="act-type" className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="activity">Actividad</option>
                  <option value="food">Comida</option>
                  <option value="transport">Transporte</option>
                  <option value="accommodation">Alojamiento</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="act-desc">Descripción</label>
              <textarea id="act-desc" className="form-input form-textarea" placeholder="Detalles adicionales..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setEditActivity(null) }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving} id="confirm-activity-btn">
                {saving ? <div className="spinner" /> : <><Check size={16} /> {editActivity ? 'Guardar Cambios' : 'Añadir Actividad'}</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
