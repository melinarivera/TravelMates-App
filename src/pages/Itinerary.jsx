import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Edit3, Calendar, Clock, MapPin, 
  Check, X, ThumbsUp, ThumbsDown, DollarSign,
  Utensils, Map, Plane, Coffee, Camera, Music, ShoppingBag, Home
} from 'lucide-react'
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

    if (acts) {
      const grouped = acts.reduce((acc, act) => {
        const date = act.day_date || 'Sin fecha'
        if (!acc[date]) acc[date] = []
        acc[date].push(act)
        return acc
      }, {})
      setDays(Object.entries(grouped).sort())
    }
    setLoading(false)
  }

  async function saveActivity(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, trip_id: tripId, user_id: user.id }
    
    let err
    if (editActivity) {
      const { error } = await supabase.from('itinerary_activities').update(payload).eq('id', editActivity.id)
      err = error
    } else {
      const { error } = await supabase.from('itinerary_activities').insert(payload)
      err = error
    }

    if (!err) {
      setShowModal(false)
      setForm({ day_date: '', time: '', title: '', location: '', description: '', type: 'activity', source: 'manual' })
      setEditActivity(null)
      fetchData()
    }
    setSaving(false)
  }

  async function deleteActivity(id) {
    if (!confirm('¿Eliminar actividad?')) return
    await supabase.from('itinerary_activities').delete().eq('id', id)
    fetchData()
  }

  async function vote(activityId, voteType) {
    await supabase.from('activity_votes').upsert({
      activity_id: activityId,
      user_id: user.id,
      vote: voteType
    })
    fetchData()
  }

  async function approveActivity(id) {
    await supabase.from('itinerary_activities').update({ source: 'manual' }).eq('id', id)
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
              <Calendar size={32} />
            </div>
            <div>
              <h1 className="module-title text-gradient">Itinerario</h1>
              <p className="module-subtitle">Planifica paso a paso</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditActivity(null); setShowModal(true) }}>
            <Plus size={18} /> Proponer actividad
          </button>
        </header>

        {loading ? <div className="spinner" /> : (
          <div className="itinerary-days">
            {days.length === 0 ? (
              <div className="empty-state glass-card">
                 <Calendar size={48} opacity="0.2" />
                 <p>No hay actividades planeadas aún.</p>
              </div>
            ) : days.map(([date, acts]) => (
              <section key={date} className="itinerary-day fade-in-up">
                <h2 className="itinerary-day-title">
                  <Clock size={20} />
                  {date === 'Sin fecha' ? date : new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                
                <div className="items-list">
                  {acts.map(act => (
                    <div key={act.id} className="activity-card glass-card">
                      <div className="activity-time">{act.time || '--:--'}</div>
                      <div className="activity-info">
                        <div className="activity-title">{act.title}</div>
                        <div className="activity-meta">
                          {act.location && <span><MapPin size={12} /> {act.location}</span>}
                          <span className="badge badge-accent">{act.type}</span>
                        </div>
                      </div>
                      
                      <div className="activity-actions">
                         <div className="vote-section" style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => vote(act.id, 'up')}>
                              <ThumbsUp size={14} />
                              <span style={{ fontSize: '0.8rem' }}>{act.activity_votes?.filter(v => v.vote === 'up').length || 0}</span>
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => vote(act.id, 'down')}>
                              <ThumbsDown size={14} />
                              <span style={{ fontSize: '0.8rem' }}>{act.activity_votes?.filter(v => v.vote === 'down').length || 0}</span>
                            </button>
                         </div>

                         {isTitular && (
                           <>
                             {act.source === 'voting' && (
                               <button className="btn btn-primary btn-sm" onClick={() => approveActivity(act.id)}>Aprobar</button>
                             )}
                             <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditActivity(act); setForm(act); setShowModal(true); }}>
                               <Edit3 size={16} />
                             </button>
                             <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteActivity(act.id)} style={{ color: 'var(--coral)' }}>
                               <Trash2 size={16} />
                             </button>
                           </>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editActivity ? 'Editar actividad' : 'Proponer actividad'} onClose={() => setShowModal(false)}>
          <form onSubmit={saveActivity} className="create-trip-form">
             <div className="form-group">
               <label className="form-label">Título *</label>
               <input type="text" className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
             </div>
             <div className="grid-2">
               <div className="form-group">
                 <label className="form-label">Fecha</label>
                 <input type="date" className="form-input" value={form.day_date} onChange={e => setForm(f => ({ ...f, day_date: e.target.value }))} />
               </div>
               <div className="form-group">
                 <label className="form-label">Hora</label>
                 <input type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
               </div>
             </div>
             <div className="form-group">
               <label className="form-label">Ubicación</label>
               <input type="text" className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
             </div>
             <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="activity">Actividad</option>
                  <option value="food">Comida / Restaurante</option>
                  <option value="transport">Transporte</option>
                  <option value="accommodation">Alojamiento</option>
                  <option value="shopping">Compras</option>
                </select>
             </div>
             <div className="modal-actions">
               <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
               <button type="submit" className="btn btn-primary" disabled={saving}>Guardar</button>
             </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
