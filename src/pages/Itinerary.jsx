import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/layout/Navbar'
import Modal from '../components/ui/Modal'
import { 
  Plus, Trash2, Calendar, MapPin, ThumbsUp, ThumbsDown, Clock
} from 'lucide-react'
import './ModulePage.css'

export default function Itinerary() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [days, setDays] = useState([])
  const [myRole, setMyRole] = useState('invitado')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ day_date: '', time: '', title: '', location: '', description: '', type: 'activity', source: 'manual' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [tripId])

  async function fetchData() {
    setLoading(true)
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
    const { data: mem } = await supabase.from('trip_members').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
    if (mem) setMyRole(mem.role)
    setLoading(false)
  }

  async function saveActivity(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('itinerary_activities').insert({ ...form, trip_id: tripId, user_id: user.id })
    if (error) alert(error.message)
    setShowModal(false)
    setForm({ day_date: '', time: '', title: '', location: '', description: '', type: 'activity', source: 'manual' })
    fetchData()
    setSaving(false)
  }

  async function deleteActivity(id) {
    if (!confirm('¿Eliminar actividad?')) return
    await supabase.from('itinerary_activities').delete().eq('id', id)
    fetchData()
  }

  async function vote(activityId, voteType) {
    await supabase.from('activity_votes').upsert({ activity_id: activityId, user_id: user.id, vote: voteType })
    fetchData()
  }

  const isTitular = myRole === 'titular'

  return (
    <div className="module-page">
      <Navbar />
      <div className="container module-body">
        <header className="module-header fade-in-up">
          <div className="module-title-group">
            <div className="module-icon-box"><Calendar size={28} /></div>
            <div>
              <h1 className="module-title">Itinerario</h1>
              <p className="module-subtitle">Cronograma del viaje</p>
            </div>
          </div>
          <button className="btn btn-add-desktop hide-mobile" onClick={() => setShowModal(true)}>
            <Plus size={20} /> Añadir
          </button>
        </header>

        {loading ? <div className="spinner" /> : (
          <div className="itinerary-list">
            {days.map(([date, acts]) => (
              <section key={date} className="itinerary-day-section fade-in-up">
                <h2 className="itinerary-day-title">
                  {date === 'Sin fecha' ? date : new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                </h2>
                <div className="items-list">
                  {acts.map(act => (
                    <div key={act.id} className="activity-card glass-card">
                      <div className="activity-time">
                        <Clock size={14} /> {act.time ? act.time.slice(0, 5) : 'Pendiente'}
                      </div>
                      <div className="activity-content">
                        <h3 className="activity-title">{act.title}</h3>
                        {act.location && <p className="activity-loc"><MapPin size={12} /> {act.location}</p>}
                      </div>
                      <div className="activity-actions">
                         <div className="vote-btns" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-sm vote-btn-up" onClick={() => vote(act.id, 'up')}>
                              <ThumbsUp size={16} /> <span>{act.activity_votes?.filter(v => v.vote === 'up').length || 0}</span>
                            </button>
                            <button className="btn btn-sm vote-btn-down" onClick={() => vote(act.id, 'down')}>
                              <ThumbsDown size={16} /> <span>{act.activity_votes?.filter(v => v.vote === 'down').length || 0}</span>
                            </button>
                         </div>
                         {isTitular && (
                           <button className="btn btn-ghost btn-sm" onClick={() => deleteActivity(act.id)} style={{ color: 'var(--coral)', marginLeft: 'auto' }}>
                             <Trash2 size={18} />
                           </button>
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

      <button className="fab-module show-mobile-only" onClick={() => setShowModal(true)}>
        <Plus size={32} />
      </button>

      {showModal && (
        <Modal title="Añadir Actividad" onClose={() => setShowModal(false)}>
          <form onSubmit={saveActivity} className="create-trip-form">
            <div className="form-group">
              <label className="form-label">Título</label>
              <input type="text" className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej. Cena, Museo..." />
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
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>Guardar Actividad</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
